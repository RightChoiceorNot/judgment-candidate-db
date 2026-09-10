import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`請先在 .env 設定 ${name}`);
  }

  return value;
}

type ReconciliationResult = {
  reconcile_run_id: number;
  exact_jid_matches: number;
  newly_marked: number;
  restored_withdrawn_status: number;
};

async function main() {
  const supabase = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SECRET_KEY"),
  );

  const { data, error } = await supabase.rpc(
    "reconcile_judgment_deletions",
  );

  if (error) {
    throw error;
  }

  const result = data?.[0] as ReconciliationResult | undefined;

  if (!result) {
    throw new Error("撤除比對未回傳稽核結果");
  }

  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error("撤除比對失敗：", error);
  process.exitCode = 1;
});
