import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function dateUtcOffsetDays(days: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }),
});

async function main() {
  const argCompanyId = process.argv[2];

  const company =
    (argCompanyId && (await prisma.company.findUnique({ where: { id: argCompanyId } }))) ||
    (await prisma.company.findFirst());

  if (!company) {
    console.log("[SKIP] No company found.");
    return;
  }

  const existing = await prisma.task.count({ where: { companyId: company.id } });
  if (existing > 0) {
    console.log("[SKIP] Tasks already exist for company:", company.id);
    return;
  }

  await prisma.task.createMany({
    data: [
      { companyId: company.id, category: "tax", title: "消費税 申告準備", dueDate: dateUtcOffsetDays(7), status: "pending" },
      { companyId: company.id, category: "social", title: "社保手続き 確認（期限切れサンプル）", dueDate: dateUtcOffsetDays(-2), status: "pending" },
      { companyId: company.id, category: "other", title: "書類アップロード（テスト）", dueDate: dateUtcOffsetDays(2), status: "pending" },
      { companyId: company.id, category: "tax", title: "源泉税 集計", dueDate: dateUtcOffsetDays(14), status: "pending" },
    ],
  });

  console.log("[OK] Seeded tasks for company:", company.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });