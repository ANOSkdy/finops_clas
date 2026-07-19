"use client";

import { apiFetch } from "@/lib/api/client";

export async function uploadPrivateFile(file: File, purpose: "rating" | "trial_balance") {
  const grant = await apiFetch<{ grantId: string }>("/api/uploads/token", { method: "POST", body: JSON.stringify({ purpose, fileName: file.name, mimeType: file.type, size: file.size }) });
  const form = new FormData();
  form.set("grantId", grant.grantId);
  form.set("file", file);
  if (file.size <= 20 * 1024 * 1024) {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    form.set("sha256", [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""));
  }
  return apiFetch<{ file: { id: string; name: string; mimeType: string; size: number; purpose: string } }>("/api/uploads/complete", { method: "POST", body: form });
}
