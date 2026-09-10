import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"));
  const { data, error } = await supabase.rpc("review_case_status_summary");
  if (error) throw error;
  console.log(JSON.stringify({ statuses: data ?? [] }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
