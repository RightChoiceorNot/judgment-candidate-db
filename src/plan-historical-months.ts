import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`請先在 .env 設定 ${name}`);
  }

  return value;
}

async function main() {
  const supabase = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SECRET_KEY"),
  );

  const { data, error } = await supabase
    .from("source_resources")
    .select("fileset_id, dataset_title, resource_format, resource_description")
    .eq("category_no", "051")
    .order("fileset_id", { ascending: false });

  if (error) {
    throw error;
  }

  const { data: sourceFiles, error: sourceFilesError } = await supabase
    .from("source_files")
    .select("fileset_id, file_size_bytes");

  if (sourceFilesError) {
    throw sourceFilesError;
  }

  const knownFiles = new Map(
    (sourceFiles ?? []).map((file) => [file.fileset_id, file.file_size_bytes]),
  );

  const rows = (data ?? []).map((resource) => ({
    month: resource.resource_description?.match(/^(\d{6})/)?.[1] ?? null,
    filesetId: resource.fileset_id,
    format: resource.resource_format,
    estimatedBytes: knownFiles.get(resource.fileset_id) ?? "unknown; inspect before download",
    priority:
      resource.resource_description?.startsWith("202606")
        ? "already indexed"
        : resource.resource_format === "RAR"
          ? "recent months first; estimate before download"
          : "catalog only",
  }));

  console.table(rows);
  console.log(`共 ${rows.length} 筆來源資源；此指令不下載任何檔案。`);
}

main().catch((error) => {
  console.error("歷史資料規劃失敗：", error);
  process.exitCode = 1;
});
