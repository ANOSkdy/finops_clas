import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const loginId = "admin";
  const plain = process.env.DEMO_ADMIN_PASSWORD || "password";
  const passwordHash = await bcrypt.hash(plain, 10);

  await prisma.user.upsert({
    where: { loginId },
    update: { passwordHash, name: "Admin", role: "admin" },
    create: { loginId, passwordHash, name: "Admin", role: "admin" },
  });

  console.log("[OK] demo user upserted:", loginId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });