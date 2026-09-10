import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type ParsedRow = {
  source_record_key: string;
  source_page_url: string;
  source_file_name: string;
  source_sha256: string;
  source_published_at: string;
  fetched_at: string;
  page_number: number;
  election_type: string;
  district: string;
  registration_date_roc: string;
  full_name: string;
  party_name: string;
  note: string;
};

type ParsedPreview = { rows: ParsedRow[] };

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`請先在 .env 設定 ${name}`);
  return value;
}

async function main() {
  const previewPath = "storage/downloads/cec-115-candidate-registration-64709/candidate-registration-preview.json";
  const preview = JSON.parse(await readFile(previewPath, "utf8")) as ParsedPreview;
  const supabase = createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_SECRET_KEY"));

  const { data: cycle, error: cycleError } = await supabase
    .from("election_cycles")
    .upsert({
      cycle_name: "115年地方公職人員選舉",
      election_date: "2026-11-28",
      election_type: "地方公職人員選舉",
      official_source_url: "https://web.cec.gov.tw/central/article/64709",
      source_fetched_at: new Date().toISOString(),
    }, { onConflict: "cycle_name" })
    .select("id")
    .single();
  if (cycleError) throw cycleError;

  let inserted = 0;
  let skipped = 0;
  for (let index = 0; index < preview.rows.length; index += 200) {
    const { data, error } = await supabase.rpc("import_registered_candidate_rows", {
      p_election_cycle_id: cycle.id,
      p_rows: preview.rows.slice(index, index + 200),
    });
    if (error) throw error;
    const result = data?.[0];
    inserted += result?.inserted_count ?? 0;
    skipped += result?.skipped_count ?? 0;
  }

  console.log(JSON.stringify({ parsed: preview.rows.length, inserted, skipped }));
}

main().catch((error) => {
  console.error("候選人登記資料匯入失敗：", error);
  process.exitCode = 1;
});
