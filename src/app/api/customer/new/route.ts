import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { customerNewSchema } from "@/lib/validators/customer";
import { requireAuth } from "@/lib/auth/tenant";
import { generateTasksForCompany } from "@/lib/schedule/generator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", [
      { field: "body", reason: "invalid_json" },
    ]);
  }

  const parsed = customerNewSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "body",
      reason: i.code,
    }));
    return jsonError(400, "VALIDATION_ERROR", "入力に誤りがあります", details);
  }

  const v = parsed.data;

  const fiscalClosingMonth = v.legalForm === "sole" ? 12 : v.fiscalClosingMonth;

  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: v.name,
        legalForm: v.legalForm,
        address: v.address ?? null,
        fiscalClosingMonth,
        representativeName: v.representativeName ?? null,
        contactEmail: v.contactEmail ?? null,
        contactPhone: v.contactPhone ?? null,
      },
    });

    await tx.membership.create({
      data: {
        userId: auth.user.id,
        companyId: created.id,
        roleInCompany: "owner",
      },
    });

    // 便利のため、初回は自動でアクティブに（UIが後で home/schedule に入れる）
    await tx.session.update({
      where: { id: auth.session.id },
      data: { activeCompanyId: created.id },
    });

    await generateTasksForCompany(tx, created.id, { horizonMonths: 18 });

    return created;
  });

  return NextResponse.json({ companyId: company.id }, { status: 200 });
}
