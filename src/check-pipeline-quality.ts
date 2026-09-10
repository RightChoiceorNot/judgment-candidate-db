import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

type QualityCheck = {
  check_name: string;
  failure_count: number;
};

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

  const { data, error } = await supabase.rpc("pipeline_quality_check");

  if (error) {
    throw error;
  }

  const checks = (data ?? []) as QualityCheck[];
  console.table(checks);

  if (checks.some((check) => check.failure_count > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("資料品質檢查失敗：", error);
  process.exitCode = 1;
});
