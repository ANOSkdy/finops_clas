import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveCompany } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin";
import { AppError } from "@/lib/api/errors";
import { parseJson, validationError, withApiError } from "@/lib/api/response";
import { db } from "@/lib/db";
import { fromDateUtc, todayInTokyo } from "@/lib/date/business-date";
import { visibleTaskStatus } from "@/lib/tasks/status";

export const runtime = "nodejs";
const schema = z.object({ status: z.enum(["pending", "done"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  return withApiError(async () => {
    assertSameOrigin(request);
    const context = await requireActiveCompany();
    const { taskId } = await params;
    if (!z.uuid().safeParse(taskId).success) throw new AppError("NOT_FOUND", "タスクが見つかりません", 404);
    const parsed = schema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const task = await db.$transaction(async (tx) => {
      const updated = await tx.task.updateMany({
        where: { id: taskId, companyId: context.companyId },
        data: { status: parsed.data.status, completedAt: parsed.data.status === "done" ? new Date() : null }
      });
      if (updated.count !== 1) throw new AppError("NOT_FOUND", "タスクが見つかりません", 404);
      const saved = await tx.task.findFirstOrThrow({ where: { id: taskId, companyId: context.companyId } });
      await tx.auditLog.create({ data: { companyId: context.companyId, actorUserId: context.session.userId, action: "task.status", entityType: "Task", entityId: taskId, result: "success", metadata: { status: parsed.data.status } } });
      return saved;
    });
    return NextResponse.json({ task: { ...task, dueDate: fromDateUtc(task.dueDate), status: visibleTaskStatus(task.status, task.dueDate, todayInTokyo()) } });
  });
}
