import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

type FileSet = {
  fileSetId: number;
  resourceFormat: string;
  resourceDescription: string;
};

type JudicialResource = {
  datasetId: number;
  title: string;
  categoryName: string;
  filesets: FileSet[];
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("請先在 .env 設定 SUPABASE_URL 與 SUPABASE_SECRET_KEY");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function main() {
  const response = await fetch(
    "https://opendata.judicial.gov.tw/data/api/rest/categories/051/resources"
  );

  if (!response.ok) {
    throw new Error(`司法院 API 回應失敗：${response.status}`);
  }

  const resources = (await response.json()) as JudicialResource[];

  const rows = resources.flatMap((resource) =>
    resource.filesets.map((fileset) => ({
      dataset_id: resource.datasetId,
      dataset_title: resource.title,
      category_no: "051",
      fileset_id: fileset.fileSetId,
      resource_format: fileset.resourceFormat,
      resource_description: fileset.resourceDescription,
      last_seen_at: new Date().toISOString(),
    }))
  );

  const { error } = await supabase
    .from("source_resources")
    .upsert(rows, { onConflict: "fileset_id" });

  if (error) {
    throw error;
  }

  console.log(`已同步 ${rows.length} 筆裁判書資料來源目錄。`);
}

main().catch((error) => {
  console.error("同步失敗：", error);
  process.exitCode = 1;
});