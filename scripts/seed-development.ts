import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEVELOPMENT_SEED !== "true") {
  throw new Error("Development seed is disabled. Set ALLOW_DEVELOPMENT_SEED=true outside production.");
}
const password = process.env.DEVELOPMENT_SEED_PASSWORD;
if (!password || password.length < 12) throw new Error("DEVELOPMENT_SEED_PASSWORD must contain at least 12 characters.");
const seedPassword = password;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  try {
    const user = await prisma.user.upsert({
      where: { loginId: "clas-admin" },
      update: { name: "開発管理者", role: "global", passwordHash: await hashPassword(seedPassword) },
      create: { loginId: "clas-admin", name: "開発管理者", role: "global", passwordHash: await hashPassword(seedPassword) }
    });
    const existing = await prisma.company.findFirst({ where: { name: "CLAS 開発会社" } });
    const company = existing ?? await prisma.company.create({ data: { name: "CLAS 開発会社", legalForm: "corporation", closingMonth: 3, representativeName: "開発担当", email: "finance@example.invalid" } });
    await prisma.membership.upsert({ where: { userId_companyId: { userId: user.id, companyId: company.id } }, create: { userId: user.id, companyId: company.id, roleInCompany: "admin" }, update: { roleInCompany: "admin" } });
    await prisma.manualDocument.upsert({
      where: { slug: "getting-started" },
      create: { slug: "getting-started", title: "はじめに", content: "## CLAS FinOpsを始める\n\n1. 左上から操作する会社を選択します。\n2. **会社設定**で基本情報と税務設定を確認します。\n3. **スケジュール**で再計算を実行します。\n\n## 安全な操作\n\n- 完了済みタスクは再計算後も保持されます。\n- 財務書類は非公開ストレージへ保存されます。\n- メール送信前には宛先・件名・添付を確認してください。" },
      update: {}
    });
    console.info("Development records are ready. Login ID: clas-admin");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Development seed failed.");
  process.exitCode = 1;
});
