import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

type JudicialJudgment = {
  JID: string;
  JYEAR: string;
  JCASE: string;
  JNO: string;
  JDATE: string;
  JTITLE: string;
  JFULL: string;
  JPDF: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("請先在 .env 設定 Supabase 連線資訊");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

const fileSetId = 68497;
const month = "202606";
const folderName = process.argv[2] ?? "三重簡易庭刑事";

const sourceUrl =
  "https://opendata.judicial.gov.tw/api/FilesetLists/68497/file";

function toIsoDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    throw new Error(`無法辨識裁判日期：${value}`);
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

async function getSourceFileId() {
  const { data: existing, error: findError } = await supabase
    .from("source_files")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from("source_files")
    .insert({
      fileset_id: fileSetId,
      source_url: sourceUrl,
      original_filename: "fileset-68497.rar",
      file_format: "RAR",
      processing_status: "processing",
    })
    .select("id")
    .single();

  if (createError) {
    throw createError;
  }

  return created.id;
}

async function main() {
  const folderPath = join(
    "storage",
    "downloads",
    "fileset-68497",
    month,
    folderName
  );

  const filenames = (await readdir(folderPath)).filter((filename) =>
    filename.endsWith(".json")
  );

  const sourceFileId = await getSourceFileId();

  const rows = [];

  for (const filename of filenames) {
    const filePath = join(folderPath, filename);
    const content = await readFile(filePath, "utf8");
    const judgment = JSON.parse(content) as JudicialJudgment;

    rows.push({
      external_jid: judgment.JID,
      source_file_id: sourceFileId,
      court_name: folderName,
      case_number: `${judgment.JYEAR},${judgment.JCASE},${judgment.JNO}`,
      judgment_date: toIsoDate(judgment.JDATE),
      case_type: judgment.JCASE,
      judgment_text: null,
      full_text_available: false,
      public_status: "pending_review",
      last_seen_at: new Date().toISOString(),
    });
  }

  for (const batch of chunk(rows, 200)) {
    const { error } = await supabase
      .from("raw_judgments")
      .upsert(batch, { onConflict: "external_jid" });

    if (error) {
      throw error;
    }
  }

  const { error: sourceFileError } = await supabase
    .from("source_files")
    .update({
      processing_status: "parsed",
      processed_at: new Date().toISOString(),
    })
    .eq("id", sourceFileId);

  if (sourceFileError) {
    throw sourceFileError;
  }

  console.log(
    `已從「${folderName}」匯入 ${rows.length.toLocaleString()} 筆刑事裁判，狀態皆為 pending_review。`
  );
}

main().catch((error) => {
  console.error("匯入失敗：", error);
  process.exitCode = 1;
});