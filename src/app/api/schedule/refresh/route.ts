import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireActiveCompany } from "@/lib/auth/tenant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const scoped = await requireActiveCompany(req);

  if (!scoped) return jsonError(401, "UNAUTHORIZED", "ログインが必要です");
  if (!scoped.companyId) return jsonError(404, "NOT_FOUND", "会社が選択されていません");
  if (!scoped.membership) return jsonError(403, "FORBIDDEN", "アクセス権限がありません");
  if (!scoped.company) return jsonError(404, "NOT_FOUND", "会社が見つかりません");

  const company = scoped.company;

  const entityType = company.legalForm === "sole" ? "sole" : "corporation";
  const fiscalYearEndMonth =
    entityType === "sole" ? 12 : company.fiscalClosingMonth ?? 12;
  const withholdingSpecial =
    company.withholdingIncomeTaxPaymentSchedule === "special";
  const residentTaxSpecial =
    company.residentTaxPaymentSchedule === "special";

  await prisma.$executeRaw`
    WITH params AS (
      SELECT
        ${scoped.companyId}::uuid  AS company_id,
        ${entityType}::text AS entity_type,
        ${fiscalYearEndMonth}::int AS fiscal_year_end_month,
        ${withholdingSpecial}::boolean AS withholding_special,
        ${residentTaxSpecial}::boolean AS resident_tax_special
    ), window AS (
      SELECT
        date_trunc('month', current_date)::date AS from_month,
        (date_trunc('month', current_date)::date + interval '36 months')::date AS to_month
    ), due_months AS (
      SELECT (generate_series(
        (SELECT from_month FROM window) + interval '1 month',
        (SELECT to_month FROM window),
        interval '1 month'
      ))::date AS month_start
    ), years AS (
      SELECT generate_series(
        extract(year from current_date)::int,
        extract(year from (current_date + interval '3 years'))::int,
        1
      ) AS y
    ), candidate_tasks AS (
      -- Withholding tax: monthly (next month 10th)
      SELECT
        (SELECT company_id FROM params) AS company_id,
        'tax'::text AS category,
        '源泉所得税・復興特別所得税（毎月納付）'::text AS title,
        (dm.month_start + interval '9 days')::date AS due_date
      FROM due_months dm
      WHERE (SELECT withholding_special FROM params) = false

      UNION ALL

      -- Withholding special: Jul 10 and Jan 20
      SELECT
        (SELECT company_id FROM params),
        'tax',
        '源泉所得税・復興特別所得税（納期の特例：1〜6月分）',
        make_date(y.y, 7, 10)
      FROM years y
      WHERE (SELECT withholding_special FROM params) = true

      UNION ALL

      SELECT
        (SELECT company_id FROM params),
        'tax',
        '源泉所得税・復興特別所得税（納期の特例：7〜12月分）',
        make_date(y.y, 1, 20)
      FROM years y
      WHERE (SELECT withholding_special FROM params) = true

      UNION ALL

      -- Resident tax special collection: monthly (next month 10th)
      SELECT
        (SELECT company_id FROM params),
        'tax',
        '住民税（特別徴収）納入（毎月）',
        (dm.month_start + interval '9 days')::date
      FROM due_months dm
      WHERE (SELECT resident_tax_special FROM params) = false

      UNION ALL

      -- Resident tax special: Jun 10 and Dec 10
      SELECT
        (SELECT company_id FROM params),
        'tax',
        '住民税（特別徴収）納入（納期の特例：12〜5月分）',
        make_date(y.y, 6, 10)
      FROM years y
      WHERE (SELECT resident_tax_special FROM params) = true

      UNION ALL

      SELECT
        (SELECT company_id FROM params),
        'tax',
        '住民税（特別徴収）納入（納期の特例：6〜11月分）',
        make_date(y.y, 12, 10)
      FROM years y
      WHERE (SELECT resident_tax_special FROM params) = true

      UNION ALL

      -- Annual Jan 31 submissions
      SELECT
        (SELECT company_id FROM params),
        'tax',
        '法定調書・給与支払報告書・償却資産申告（提出期限）',
        make_date(y.y, 1, 31)

      FROM years y

      UNION ALL

      -- Corporation only: corporate/local taxes filing/payment (fiscal year end + 2 months)
      SELECT
        (SELECT company_id FROM params),
        'tax',
        '法人税・地方税（確定申告・納付）',
        ((make_date(y.y, (SELECT fiscal_year_end_month FROM params), 1) + interval '1 month' - interval '1 day') + interval '2 months')::date
      FROM years y
      WHERE (SELECT entity_type FROM params) = 'corporation'
    ), filtered AS (
      SELECT * FROM candidate_tasks WHERE due_date >= current_date
    ), to_insert AS (
      SELECT f.* FROM filtered f WHERE NOT EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.company_id = f.company_id AND t.title = f.title AND t.due_date = f.due_date
      )
    )
    INSERT INTO public.tasks (company_id, category, title, due_date)
    SELECT company_id, category, title, due_date FROM to_insert;
  `;

  return jsonOk({ ok: true });
}
