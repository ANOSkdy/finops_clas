import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { customerUpdateSchema } from "@/lib/validators/customer";
import { requireActiveCompany } from "@/lib/auth/tenant";
import { canEditCompany } from "@/lib/auth/rbac";

export const runtime = "nodejs";

function shapeCompany(c: any) {
  return {
    companyId: c.id,
    name: c.name,
    legalForm: c.legalForm,
    address: c.address ?? null,
    fiscalClosingMonth: c.fiscalClosingMonth,
    representativeName: c.representativeName ?? null,
    contactEmail: c.contactEmail ?? null,
    contactPhone: c.contactPhone ?? null,
  };
}

export async function GET(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  return NextResponse.json(
    {
      company: shapeCompany(scoped.company),
      roleInCompany: scoped.membership.roleInCompany,
      userRole: scoped.auth.user.role,
    },
    { status: 200 }
  );
}

export async function PUT(req: NextRequest) {
  const scoped = await requireActiveCompany(req);
  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  // admin only (membership role). system admin も許可する
  const isSystemAdmin = scoped.auth.user.role === "admin";
  if (!isSystemAdmin && !canEditCompany(scoped.membership.roleInCompany)) {
    return jsonError(403, "FORBIDDEN", "編集権限がありません");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = customerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const v = parsed.data.company;

  // legalForm は変更不可。sole は決算月12固定をサーバで強制
  const fiscalClosingMonth =
    scoped.company.legalForm === "sole" ? 12 : v.fiscalClosingMonth;

  const updated = await prisma.company.update({
    where: { id: scoped.companyId },
    data: {
      name: v.name,
      address: v.address ?? null,
      fiscalClosingMonth,
      representativeName: v.representativeName ?? null,
      contactEmail: v.contactEmail ?? null,
      contactPhone: v.contactPhone ?? null,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ company: shapeCompany(updated) }, { status: 200 });
}
