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
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`缺少環境變數：${name}`);
  }

  return value;
}

function toIsoDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    throw new Error(`無法辨識裁判日期：${value}`);
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

async function main() {
  const supabase = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SECRET_KEY"),
  );

  const fileSetId = 68497;
  const month = "202606";
  const sourceUrl =
    "https://opendata.judicial.gov.tw/api/FilesetLists/68497/file";

  const monthDirectory = join(
    "storage",
    "downloads",
    `fileset-${fileSetId}`,
    month,
  );

  const { data: sourceFile, error: sourceFileError } = await supabase
    .from("source_files")
    .select("id")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (sourceFileError) {
    throw sourceFileError;
  }

  if (!sourceFile) {
    throw new Error("找不到 fileset 68497 的來源檔案紀錄");
  }

  const entries = await readdir(monthDirectory, { withFileTypes: true });

  const criminalFolders = entries
    .filter((entry) => entry.isDirectory() && entry.name.includes("刑事"))
    .map((entry) => entry.name)
    .sort();

  let totalIndexed = 0;

  const requestedFolder = process.argv[2];

  const foldersToProcess = requestedFolder
    ? criminalFolders.filter((folderName) => folderName === requestedFolder)
    : criminalFolders;

  if (requestedFolder && foldersToProcess.length === 0) {
    throw new Error(`找不到刑事資料夾：${requestedFolder}`);
  }

  for (const folderName of foldersToProcess) {
    const folderPath = join(monthDirectory, folderName);
    const filenames = (await readdir(folderPath))
      .filter((filename) => filename.endsWith(".json"))
      .sort();

    console.log(`開始處理：${folderName}，共 ${filenames.length} 筆`);

    const rows = [];

    for (const filename of filenames) {
      const filePath = join(folderPath, filename);
      const content = await readFile(filePath, "utf8");
      const judgment = JSON.parse(content) as JudicialJudgment;

      rows.push({
        external_jid: judgment.JID,
        source_file_id: sourceFile.id,
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

    for (let index = 0; index < rows.length; index += 200) {
      const batch = rows.slice(index, index + 200);

      const { error } = await supabase
        .from("raw_judgments")
        .upsert(batch, { onConflict: "external_jid" });

      if (error) {
        throw new Error(`${folderName} 第 ${index + 1} 筆匯入失敗：${error.message}`);
      }
    }

    totalIndexed += rows.length;
    console.log(`完成：${folderName}`);
  }

  console.log(`全部完成，共建立或更新 ${totalIndexed.toLocaleString()} 筆刑事判決索引。`);
}

main().catch((error) => {
  console.error("全月份索引匯入失敗：", error);
  process.exitCode = 1;
});