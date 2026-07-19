BEGIN;

CREATE TABLE "manual_procedures" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_key" VARCHAR(100),
  "company_id" UUID REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_by_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "category" VARCHAR(30) NOT NULL,
  "title" VARCHAR(300) NOT NULL,
  "trigger" TEXT NOT NULL,
  "deadline" TEXT NOT NULL,
  "submission_destination" TEXT,
  "cost" TEXT,
  "notes" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "manual_procedures_category_check" CHECK ("category" IN ('tax', 'social_insurance', 'registration')),
  CONSTRAINT "manual_procedures_scope_check" CHECK (
    ("source_key" IS NOT NULL AND "company_id" IS NULL) OR
    ("source_key" IS NULL AND "company_id" IS NOT NULL)
  )
);

CREATE TABLE "company_manual_procedure_statuses" (
  "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "procedure_id" UUID NOT NULL REFERENCES "manual_procedures"("id") ON DELETE CASCADE,
  "status" VARCHAR(20) NOT NULL DEFAULT 'not_started',
  "updated_by_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("company_id", "procedure_id"),
  CONSTRAINT "company_manual_procedure_status_check" CHECK ("status" IN ('not_started', 'in_progress', 'completed'))
);

CREATE UNIQUE INDEX "manual_procedures_source_key_key" ON "manual_procedures"("source_key");
CREATE INDEX "manual_procedures_company_category_position_idx" ON "manual_procedures"("company_id", "category", "position");
CREATE INDEX "company_manual_procedure_statuses_company_status_idx" ON "company_manual_procedure_statuses"("company_id", "status");

CREATE INDEX IF NOT EXISTS "tasks_company_active_due_idx"
  ON "tasks"("company_id", "due_date")
  WHERE "status" <> 'done';
CREATE INDEX IF NOT EXISTS "company_recurring_due_dates_order_idx"
  ON "company_recurring_tax_due_dates"("company_id", "month", "day");
DROP INDEX IF EXISTS "company_recurring_company_idx";

INSERT INTO "manual_procedures" (
  "source_key", "category", "title", "trigger", "deadline",
  "submission_destination", "cost", "notes", "position"
) VALUES
('tax-01', 'tax', '法人設立届出書', '法人を新規設立したとき', '設立登記日から2ヶ月以内', '税務署、都道府県税事務所、市区町村役場', NULL, '国税と地方税で提出期限・様式が異なるため、双方への提出を忘れないようにします。添付書類として定款の写し、登記事項証明書等が必要です。', 1),
('tax-02', 'tax', '青色申告の承認申請書', '青色申告（欠損金の繰越控除や各種税制優遇）の特典を受けたいとき', '設立から3ヶ月以内、または最初の事業年度末のいずれか早い前日まで', '税務署', NULL, '期限を1日でも過ぎると最初の期は強制的に白色申告となります。設立時に必ずセットで提出すべき最重要書類です。', 2),
('tax-03', 'tax', '給与支払事務所等の開設届出書', '役員報酬や従業員給与の支払を開始するとき', '開設（設立）から1ヶ月以内', '税務署', NULL, '役員1名のみ（代表者のみ）で給与・報酬を支払う場合でも提出が必要です。通常は設立届と一緒に提出します。', 3),
('tax-04', 'tax', '源泉所得税の納期の特例の承認申請書', '給与支払人員が常時10人未満で、源泉所得税の納付を年2回（7月・1月）にまとめたいとき', '随時（適用を受けたい月の前月末まで）', '税務署', NULL, '毎月の源泉所得税の納付事務を年2回に半減できる特例です。承認された月の翌月支払分から適用されます。', 4),
('tax-05', 'tax', '異動届出書', '商号、本店所在地、代表者、資本金、決算期、事業内容などに変更があったとき', '変更後速やかに（地方自治体は「10日以内」など規定あり）', '税務署、都道府県税事務所、市区町村役場', NULL, '履歴事項全部証明書（謄本）のコピー等を添付して提出します。管轄外移転の場合は各自治体への申告漏れに注意します。', 5),
('tax-06', 'tax', '消費税課税事業者届出書', '基準期間（前々期）または特定期間（前期前半6ヶ月）の課税売上高が1,000万円を超えたとき', '事由が生じた後、速やかに', '税務署', NULL, '免税事業者から課税事業者に強制的に移行する際の手続きです。届出を怠っても納税義務は免れません。', 6),
('tax-07', 'tax', '消費税課税事業者選択届出書', '免税事業者が自ら進んで課税事業者になり、輸出免税等による消費税還付を受けたいとき', '適用を受けたい課税期間の開始の日の前日まで（新設法人はその事業年度末まで）', '税務署', NULL, '一度選択すると、原則2年間は免税事業者に戻れません（取りやめ不可）。設備投資や輸出割合などを慎重にシミュレーションする必要があります。', 7),
('tax-08', 'tax', '消費税簡易課税制度選択届出書', '基準期間（前々期）の課税売上高が5,000万円以下で、みなし仕入率による簡易計算を適用したいとき', '適用を受けたい課税期間の開始の日の前日まで（新設法人はその事業年度末まで）', '税務署', NULL, '実際の仕入税額に関わらず、業種ごとの「みなし仕入率」で計算します。仕入や経費が少ないサービス業等で有利になることが多いです。一度適用すると原則2年間は変更できません。', 8),
('tax-09', 'tax', '消費税の届出等に関する各種取りやめ書', '消費税の選択届出（課税事業者選択、簡易課税選択など）をやめて免税または原則課税に戻したいとき', 'やめたい課税期間の開始の日の前日まで', '税務署', NULL, '適用をやめたい期が始まる前に提出する必要があります。1日でも遅れると翌期も強制適用となります。', 9),
('social-01', 'social_insurance', '新規適用届', '法人を新規設立し、社会保険の適用事業所となるとき', '事実発生から5日以内', '年金事務所', NULL, '法人であれば役員1名（代表者のみ）でも強制適用となります。登記簿謄本、法人番号指定通知書等のコピーなどを添付します。', 1),
('social-02', 'social_insurance', '被保険者資格取得届', '新たに役員・従業員を採用し、社会保険に加入させるとき', '採用・就任から5日以内', '年金事務所', NULL, '役員報酬が発生する役員、または週の所定労働時間が常時雇用者の4分の3以上の従業員が対象です。本人確認（マイナンバー等）が必要です。', 2),
('social-03', 'social_insurance', '被保険者資格喪失届', '役員・従業員が退職、死亡、または労働時間減少により加入要件から外れたとき', '退職等の翌日から5日以内', '年金事務所', NULL, '退職日の翌日が資格喪失日となります。健康保険証（被扶養者の分も含む）を回収して添付します。', 3),
('social-04', 'social_insurance', '被扶養者（異動）届', '従業員の家族を健康保険の扶養に入れる、または外すとき', '異動があった日から5日以内', '年金事務所', NULL, '結婚、出産、就職、離婚など。収入要件（原則年間収入130万円未満、60歳以上等は180万円未満など）の確認書類が必要です。', 4),
('social-05', 'social_insurance', '算定基礎届', '毎年1回、4〜6月の給与額からその年の10月以降の標準報酬月額を決定するとき', '毎年7月1日〜7月10日', '年金事務所', NULL, '「定時決定」と呼ばれる定例業務です。原則、全被保険者が対象となります。算定基礎届総括表も併せて提出します。', 5),
('social-06', 'social_insurance', '月額変更届', '昇給・降給などの固定的賃金に変動があり、変動後3ヶ月間の給与平均が従来の等級と2等級以上ズレたとき', '速やかに（条件を満たした4ヶ月目）', '年金事務所', NULL, '「随時改定」と呼ばれます。基本給、役職手当、通勤手当などの「固定的賃金の変動」がトリガーです。非固定的賃金の変動のみは対象外です。', 6),
('social-07', 'social_insurance', '賞与支払届', '被保険者（役員含む）に対して賞与を支給したとき', '賞与支払日から5日以内', '年金事務所', NULL, '※不支給報告書（賞与を支払わなかった場合の届出）は令和3年4月1日より廃止されました。不支給の場合は届出自体が不要です。', 7),
('social-08', 'social_insurance', '労働保険新規適用届', '従業員（パート・アルバイト含む）を初めて1名以上雇用し、労働保険の適用事業所となるとき', '雇用した日から10日以内', '労働基準監督署', NULL, '労災保険・雇用保険の基礎となります。役員のみの場合は、原則として労働保険（労災・雇用）の対象外です（従業員性がないため）。', 8),
('social-09', 'social_insurance', '雇用保険被保険者資格取得届', '新たに従業員を雇用し、雇用保険に加入させるとき', '雇い入れた月の翌月10日まで', 'ハローワーク', NULL, '週の所定労働時間が20時間以上、かつ31日以上の雇用見込みがある従業員が対象です。他社での二重加入はできません。', 9),
('social-10', 'social_insurance', '雇用保険被保険者資格喪失届', '従業員が退職したとき', '退職日の翌日から10日以内', 'ハローワーク', NULL, '退職後に失業手当を受給するために必要な「離職票」を発行する手続き（離職証明書の作成）を伴うことが多いです。', 10),
('social-11', 'social_insurance', '労働保険年度更新', '前年度の確定保険料の精算と、今年度の概算保険料を申告・納付するとき', '毎年6月1日〜7月10日', '労働局・労働基準監督署、または金融機関', NULL, '全従業員（アルバイト等含む）の1年間（4月〜翌3月）の総賃金を集計して計算します。申告書の提出と保険料の納付を同時に行います。', 11),
('registration-01', 'registration', '本店所在地移転', '会社の本店を移転したとき（引っ越したとき）', '移転日から2週間以内', NULL, E'同一管轄内：3万円\n管轄外への移転：6万円', '管轄外移転の場合、旧管轄と新管轄の両方の法務局宛ての申請書（各3万円、計6万円）を同時に旧管轄法務局へ提出します。株主総会または取締役会の決議書等が必要です。', 1),
('registration-02', 'registration', '役員変更（新任・辞任・退任・死亡・重任）', '役員が就任、退任、または任期満了に伴い同じ人が再任（重任）したとき', '効力発生日（または任期満了日）から2週間以内', NULL, E'資本金1億円以下：1万円\n資本金1億円超：3万円', '役員（取締役、監査役等）の任期満了による「重任（再任）」の場合、メンバーや役職に変化がなくても登記申請が必須です。放置すると「登記懈怠」で過料の対象になります。', 2),
('registration-03', 'registration', '商号変更', '会社の名前（社名）を変更したとき', '株主総会決議による効力発生日から2週間以内', NULL, '3万円', '定款変更が必要となるため、事前に株主総会での「特別決議」が必要です。類似商号（同一住所で同一商号の禁止など）の事前調査を法務局で行うと安全です。', 3),
('registration-04', 'registration', '目的変更', '会社の事業目的（事業内容）を追加、変更、削除したとき', '株主総会決議による効力発生日から2週間以内', NULL, '3万円', '商号同様、定款変更となるため株主総会の特別決議が必要です。許認可申請が必要な新規事業を追加する場合、許認可要件に合致する適法な文言で登記する必要があります。', 4),
('registration-05', 'registration', '資本金の額の変更（増資・減資）', '増資（金銭の払い込み、株式追加発行）または減資を行ったとき', '変更（払込期日等）から2週間以内', NULL, E'増資：増加額の1000分の7（最低3万円）\n減資：3万円', '減資の場合、官報公告や債権者への個別催告など「債権者保護手続き」として最低1ヶ月以上の公告期間が義務付けられているため、登記申請までに時間を要します。', 5),
('registration-06', 'registration', '公告方法の変更', '官報から電子公告（自社HP等）など、決算公告等の方法を変更したとき', '効力発生日から2週間以内', NULL, '3万円', '定款変更（株主総会特別決議）が必要です。電子公告（自社HPのURL）に変更した場合、そのURLの登記も合わせて行います。', 6),
('registration-07', 'registration', '株式・発行可能株式総数の変更', '株式分割、株式併合、または発行可能株式総数を増やしたとき', '効力発生日から2週間以内', NULL, '3万円', '発行可能株式総数の変更は原則として株主総会の特別決議が必要です（ただし増資に伴い取締役会決議で変更できる特例もあります）。', 7)
ON CONFLICT ("source_key") DO UPDATE SET
  "category" = EXCLUDED."category",
  "title" = EXCLUDED."title",
  "trigger" = EXCLUDED."trigger",
  "deadline" = EXCLUDED."deadline",
  "submission_destination" = EXCLUDED."submission_destination",
  "cost" = EXCLUDED."cost",
  "notes" = EXCLUDED."notes",
  "position" = EXCLUDED."position",
  "updated_at" = CURRENT_TIMESTAMP;

COMMIT;
