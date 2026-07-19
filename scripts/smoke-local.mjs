import { randomBytes, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for local smoke testing.");
const password = randomBytes(24).toString("base64url");
const authSecret = randomBytes(48).toString("base64url");
const cronSecret = randomBytes(32).toString("base64url");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function json(response) {
  const value = await response.json();
  if (!response.ok) throw new Error(`Request failed with ${response.status}: ${value?.error?.code ?? "UNKNOWN"}`);
  return value;
}

async function request(path, cookie, init = {}) {
  return fetch(`http://localhost:3000${path}`, {
    ...init,
    headers: { ...(init.body instanceof FormData ? {} : init.body ? { "content-type": "application/json" } : {}), ...(init.method && init.method !== "GET" ? { origin: "http://localhost:3000" } : {}), ...(cookie ? { cookie } : {}), ...init.headers }
  });
}

try {
  const user = await prisma.user.upsert({
    where: { loginId: "clas-smoke-admin" },
    update: { name: "動作確認管理者", role: "global", passwordHash: await hash(password, 10) },
    create: { loginId: "clas-smoke-admin", name: "動作確認管理者", role: "global", passwordHash: await hash(password, 10) }
  });
  const existingCompany = await prisma.company.findFirst({ where: { name: "CLAS 動作確認会社" } });
  const company = existingCompany ?? await prisma.company.create({ data: { name: "CLAS 動作確認会社", legalForm: "corporation", closingMonth: 3, representativeName: "動作確認担当", email: "finance@example.invalid" } });
  const existingForeignCompany = await prisma.company.findFirst({ where: { name: "CLAS テナント分離確認会社" } });
  const foreignCompany = existingForeignCompany ?? await prisma.company.create({ data: { name: "CLAS テナント分離確認会社", legalForm: "corporation", closingMonth: 12 } });
  const foreignTask = await prisma.task.upsert({ where: { companyId_taskKey: { companyId: foreignCompany.id, taskKey: "smoke-foreign-task" } }, create: { companyId: foreignCompany.id, taskKey: "smoke-foreign-task", title: "テナント分離確認", category: "other", dueDate: new Date("2026-12-01T00:00:00.000Z") }, update: {} });
  const foreignChecklistItem = await prisma.accountingChecklistItem.upsert({ where: { companyId_name: { companyId: foreignCompany.id, name: "テナント分離確認資料" } }, create: { companyId: foreignCompany.id, name: "テナント分離確認資料", position: 0 }, update: {} });
  const foreignUpload = await prisma.upload.upsert({ where: { companyId_storageProvider_storageKey: { companyId: foreignCompany.id, storageProvider: "local_private", storageKey: "smoke/foreign.csv" } }, create: { companyId: foreignCompany.id, userId: user.id, purpose: "rating", originalName: "foreign.csv", mimeType: "text/csv", size: 10, storageKey: "smoke/foreign.csv", storageUrl: "private://smoke/foreign.csv", accessMode: "private" }, update: {} });
  await prisma.membership.upsert({ where: { userId_companyId: { userId: user.id, companyId: company.id } }, create: { userId: user.id, companyId: company.id, roleInCompany: "admin" }, update: { roleInCompany: "admin" } });
  await prisma.manualDocument.upsert({ where: { slug: "smoke-manual" }, create: { slug: "smoke-manual", title: "動作確認マニュアル", content: "## はじめに\n\n安全な操作を確認します。" }, update: {} });

  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack"], {
    cwd: process.cwd(), windowsHide: true, stdio: "ignore",
    env: { ...process.env, DATABASE_URL: databaseUrl, AUTH_SESSION_SECRET: authSecret, CRON_SECRET: cronSecret, MAIL_PROVIDER: "disabled" }
  });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { const response = await fetch("http://localhost:3000/login"); if (response.ok) { ready = true; break; } } catch {}
    await delay(500);
  }
  assert(ready, "Development server did not become ready.");

  const invalidLogin = await request("/api/auth/login", null, { method: "POST", body: JSON.stringify({ loginId: user.loginId, password: "invalid-credential" }) });
  assert(invalidLogin.status === 401, "Invalid login must return 401.");
  const login = await request("/api/auth/login", null, { method: "POST", body: JSON.stringify({ loginId: user.loginId, password }) });
  assert(login.status === 204, "Valid login must return 204.");
  const cookie = login.headers.getSetCookie()[0]?.split(";", 1)[0];
  assert(cookie, "Session cookie was not set.");

  const companyList = await json(await request("/api/customer/list", cookie));
  assert(companyList.companies.some((item) => item.id === company.id), "Seeded company is not visible.");
  const deniedCompany = await request("/api/customer/select", cookie, { method: "POST", body: JSON.stringify({ companyId: foreignCompany.id }) });
  assert(deniedCompany.status === 404, "Unauthorized company selection must return 404.");
  assert((await request("/api/customer/select", cookie, { method: "POST", body: JSON.stringify({ companyId: company.id }) })).status === 204, "Company selection failed.");

  const refreshed = await json(await request("/api/schedule/refresh", cookie, { method: "POST" }));
  assert(refreshed.generated > 0, "Schedule generation produced no tasks.");
  const refreshedAgain = await json(await request("/api/schedule/refresh", cookie, { method: "POST" }));
  assert(refreshedAgain.generated === refreshed.generated, "Schedule refresh is not stable.");
  const schedule = await json(await request("/api/schedule/list", cookie));
  const firstTask = schedule.tasks[0];
  assert(firstTask, "Schedule list is empty.");
  const done = await json(await request(`/api/tasks/${firstTask.id}/status`, cookie, { method: "PATCH", body: JSON.stringify({ status: "done" }) }));
  assert(done.task.status === "done", "Task completion failed.");
  await json(await request("/api/schedule/refresh", cookie, { method: "POST" }));
  const preserved = await json(await request("/api/schedule/list", cookie));
  assert(preserved.tasks.find((item) => item.id === firstTask.id)?.status === "done", "Completed task was not preserved.");
  const reopened = await json(await request(`/api/tasks/${firstTask.id}/status`, cookie, { method: "PATCH", body: JSON.stringify({ status: "pending" }) }));
  assert(["pending", "overdue"].includes(reopened.task.status), "Task reopen failed.");
  const foreignTaskResponse = await request(`/api/tasks/${foreignTask.id}/status`, cookie, { method: "PATCH", body: JSON.stringify({ status: "done" }) });
  assert(foreignTaskResponse.status === 404, "Foreign task must return 404.");

  const checklist = await json(await request("/api/accounting-checklist?fiscalYear=2026", cookie));
  assert(checklist.items.length >= 5, "Default checklist items are missing.");
  const check = await json(await request("/api/accounting-checklist/checks", cookie, { method: "PATCH", body: JSON.stringify({ itemId: checklist.items[0].id, fiscalYear: 2026, month: 4, checked: true }) }));
  assert(check.check.checked === true, "Checklist update failed.");
  const foreignCheck = await request("/api/accounting-checklist/checks", cookie, { method: "PATCH", body: JSON.stringify({ itemId: foreignChecklistItem.id, fiscalYear: 2026, month: 4, checked: true }) });
  assert(foreignCheck.status === 404, "Foreign checklist item must return 404.");
  assert((await request(`/api/uploads/${foreignUpload.id}/download`, cookie)).status === 404, "Foreign upload download must return 404.");
  assert((await request("/api/rating/finalize", cookie, { method: "POST", body: JSON.stringify({ fileId: foreignUpload.id }) })).status === 404, "Foreign rating upload must return 404.");

  const companySettings = await json(await request("/api/customer", cookie));
  assert(companySettings.company.id === company.id && companySettings.canEdit, "Company settings scope or permission failed.");
  const home = await json(await request("/api/home/summary", cookie));
  assert(home.counts && Array.isArray(home.tasks), "Home summary failed.");

  const ratingFile = new File(["month,amount\n2026-06,100"], "financial.csv", { type: "text/csv" });
  const ratingGrant = await json(await request("/api/uploads/token", cookie, { method: "POST", body: JSON.stringify({ purpose: "rating", fileName: ratingFile.name, mimeType: ratingFile.type, size: ratingFile.size }) }));
  const ratingForm = new FormData(); ratingForm.set("grantId", ratingGrant.grantId); ratingForm.set("file", ratingFile);
  const ratingUpload = await json(await request("/api/uploads/complete", cookie, { method: "POST", body: ratingForm }));
  const rating = await json(await request("/api/rating/finalize", cookie, { method: "POST", body: JSON.stringify({ fileId: ratingUpload.file.id }) }));
  assert(rating.rating.aiSource === "fallback", "AI without credentials must use the disclosed fallback.");
  assert((await request(`/api/uploads/${ratingUpload.file.id}/download`, cookie)).status === 200, "Authenticated private download failed.");

  const trialFile = new File(["account,debit,credit\ncash,100,0"], "trial-balance.csv", { type: "text/csv" });
  const trialGrant = await json(await request("/api/uploads/token", cookie, { method: "POST", body: JSON.stringify({ purpose: "trial_balance", fileName: trialFile.name, mimeType: trialFile.type, size: trialFile.size }) }));
  const trialForm = new FormData(); trialForm.set("grantId", trialGrant.grantId); trialForm.set("file", trialFile);
  const trialUpload = await json(await request("/api/uploads/complete", cookie, { method: "POST", body: trialForm }));
  const mail = await request("/api/mail/send", cookie, { method: "POST", body: JSON.stringify({ recipient: "recipient@example.invalid", subject: "試算表", body: "ご確認ください。", attachmentIds: [trialUpload.file.id], idempotencyKey: randomUUID() }) });
  const mailResult = await mail.json();
  assert(mail.status === 503 && mailResult.auditSaved === true && mailResult.email.status === "failed", "Disabled mail provider must retain a failed audit row.");

  const cron = await json(await request("/api/cron/reminders?dryRun=true", null, { headers: { authorization: `Bearer ${cronSecret}` } }));
  assert(typeof cron.scanned === "number", "Reminder dry-run failed.");
  for (const path of ["/home", "/schedule", "/accounting_checklist", "/company_edit", "/settings", "/manual", "/system_manager"]) {
    assert((await request(path, cookie)).status === 200, `Authenticated page failed: ${path}`);
  }
  assert((await request("/api/auth/logout", cookie, { method: "POST" })).status === 204, "Logout failed.");
  assert((await request("/api/home/summary", cookie)).status === 401, "API must reject the deleted session after logout.");

  console.info(JSON.stringify({ result: "pass", invalidLogin: 401, unauthorizedCompany: 404, generatedTasks: refreshed.generated, checklistItems: checklist.items.length, authenticatedPages: 7, mailProvider: "disabled-audited", privateDownload: "pass", reminderDryRunScanned: cron.scanned }));
} finally {
  await prisma.$disconnect();
  if (server?.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    else server.kill("SIGTERM");
  }
}
