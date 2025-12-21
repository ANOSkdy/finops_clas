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
  const rows = await prisma.upload.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      purpose: true,
      originalFilename: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      storageProvider: true,
      storageKey: true,
    },
  });

  console.log("latest uploads:");
  for (const r of rows) {
    console.log({
      id: r.id,
      purpose: r.purpose,
      originalFilename: r.originalFilename,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes?.toString?.() ?? String(r.sizeBytes),
      createdAt: r.createdAt.toISOString(),
      storageProvider: r.storageProvider,
      storageKey: r.storageKey.slice(0, 60) + "...",
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