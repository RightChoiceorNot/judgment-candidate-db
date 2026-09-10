import "dotenv/config";
import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

type DeletionCsvRow = {
  刪除日期: string;
  裁判日期年月: string;
  法院名稱: string;
  裁判ID: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("請先在 .env 設定 Supabase 連線資訊");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

const fileSetId = 68498;
const csvPath = "storage/downloads/fileset-68498.csv";
const sourceUrl =
  "https://opendata.judicial.gov.tw/api/FilesetLists/68498/file";

function toIsoDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    throw new Error(`無法辨識刪除日期：${value}`);
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

async function main() {
  const csvContent = await readFile(csvPath, "utf8");

  const parsedRows = parse(csvContent, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as DeletionCsvRow[];

  const { data: existingSourceFile, error: findSourceFileError } =
    await supabase
      .from("source_files")
      .select("id")
      .eq("source_url", sourceUrl)
      .maybeSingle();

  if (findSourceFileError) {
    throw findSourceFileError;
  }

  let sourceFileId = existingSourceFile?.id;

  if (!sourceFileId) {
    const { data: createdSourceFile, error: createSourceFileError } =
      await supabase
        .from("source_files")
        .insert({
          fileset_id: fileSetId,
          source_url: sourceUrl,
          original_filename: "fileset-68498.csv",
          file_format: "CSV",
          processing_status: "parsed",
          processed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (createSourceFileError) {
      throw createSourceFileError;
    }

    sourceFileId = createdSourceFile.id;
  }

  const deletionRows = parsedRows.map((row) => ({
    deleted_on: toIsoDate(row.刪除日期),
    judgment_year_month: row.裁判日期年月,
    court_name: row.法院名稱,
    external_jid: row.裁判ID,
    source_file_id: sourceFileId,
    last_seen_at: new Date().toISOString(),
  }));

  for (const rows of chunk(deletionRows, 500)) {
    const { error } = await supabase
      .from("judgment_deletions")
      .upsert(rows, { onConflict: "external_jid" });

    if (error) {
      throw error;
    }
  }

  console.log(`已同步 ${deletionRows.length.toLocaleString()} 筆撤下裁判資訊。`);
}

main().catch((error) => {
  console.error("同步失敗：", error);
  process.exitCode = 1;
});