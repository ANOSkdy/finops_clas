import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.PRISMA_MIGRATE_ON_BUILD === "true") {
  run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"]);
}
run(process.execPath, ["node_modules/prisma/build/index.js", "generate"]);
run(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"]);
