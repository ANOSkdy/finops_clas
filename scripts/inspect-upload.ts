import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const fileId = process.argv[2];
if (!fileId) {
  console.error("Usage: pnpm tsx scripts/inspect-upload.ts <fileId>");
  process.exit(1);
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }),
});

async function main() {
  const upload = await prisma.upload.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      companyId: true,
      userId: true,
      purpose: true,
      originalFilename: true,
      createdAt: true,
    },
  });

  console.log({ upload });

  if (!upload) return;

  const company = await prisma.company.findUnique({
    where: { id: upload.companyId },
    select: { id: true, name: true, legalForm: true },
  });

  console.log({ company });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });