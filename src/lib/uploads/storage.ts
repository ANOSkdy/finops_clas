import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { AppError } from "@/lib/api/errors";

function storageRoot() {
  const configured = process.env.PRIVATE_STORAGE_DIRECTORY;
  if (process.env.NODE_ENV === "production" && !configured) throw new AppError("STORAGE_ERROR", "ファイル保管サービスは現在利用できません", 503);
  const root = resolve(configured || resolve(process.cwd(), "storage", "private"));
  if (!isAbsolute(root)) throw new AppError("STORAGE_ERROR", "ファイル保管サービスは現在利用できません", 503);
  return root;
}

function objectPath(pathname: string) {
  const root = storageRoot();
  const target = resolve(root, ...pathname.split("/"));
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new AppError("STORAGE_ERROR", "ファイルの保存先が正しくありません", 400);
  return target;
}

export async function storePrivateObject(pathname: string, body: Uint8Array) {
  try {
    const target = objectPath(pathname);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body, { flag: "wx" });
    return { pathname, url: `private://${pathname}` };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("STORAGE_ERROR", "ファイルを安全に保存できませんでした", 503);
  }
}

export async function deletePrivateObject(pathname: string) {
  try { await rm(objectPath(pathname), { force: true }); }
  catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("STORAGE_ERROR", "ファイルを安全に破棄できませんでした", 503);
  }
}

export async function readPrivateObject(pathname: string) {
  try { return await readFile(objectPath(pathname)); }
  catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("STORAGE_ERROR", "ファイルを取得できませんでした", 503);
  }
}
