import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requireEnv("DATABASE_URL") }),
});

async function main() {
  const rows = await prisma.email.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      mailTo: true,
      subject: true,
      status: true,
      providerMessageId: true,
      attachmentUploadIds: true,
      error: true,
      createdAt: true,
    },
  });

  console.log("latest emails:");
  for (const r of rows) {
    console.log({
      id: r.id,
      mailTo: r.mailTo,
      subject: r.subject,
      status: r.status,
      providerMessageId: r.providerMessageId,
      attachmentUploadIds: r.attachmentUploadIds,
      error: r.error,
      createdAt: r.createdAt.toISOString(),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });