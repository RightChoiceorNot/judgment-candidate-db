import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

type Candidate = { id: number; full_name: string; normalized_name: string };
type JudgmentRow = { external_jid: string };
type JudgmentJson = { JID: string; JFULL?: string };
type Match = { candidate_id: number; external_jid: string; matched_name: string; local_source_path: string };

function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`缺少 ${name}`); return value; }
function normalize(value: string) { return value.normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, ""); }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

async function main() {
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SECRET_KEY"));
  const candidates: Candidate[] = [];
  for (let start = 0;; start += 1000) {
    const { data, error } = await supabase.from("candidates").select("id, full_name, normalized_name").range(start, start + 999);
    if (error) throw error;
    candidates.push(...(data ?? []) as Candidate[]);
    if (!data || data.length < 1000) break;
  }
  const indexedJids = new Set<string>();
  for (let start = 0;; start += 1000) {
    const { data, error } = await supabase.from("raw_judgments").select("external_jid").range(start, start + 999);
    if (error) throw error;
    for (const row of (data ?? []) as JudgmentRow[]) indexedJids.add(row.external_jid);
    if (!data || data.length < 1000) break;
  }
  const candidateIdsByName = new Map<string, number[]>();
  for (const candidate of candidates) {
    const name = normalize(candidate.full_name);
    if (name.length < 3) continue;
    candidateIdsByName.set(name, [...(candidateIdsByName.get(name) ?? []), candidate.id]);
  }
  const matcher = new RegExp([...candidateIdsByName.keys()].sort((a, b) => b.length - a.length).map(escapeRegex).join("|"), "gu");
  const root = join("storage", "downloads", "fileset-68497", "202606");
  const matches: Match[] = [];
  const folders = await readdir(root, { withFileTypes: true });
  for (const folder of folders) {
    if (!folder.isDirectory() || !folder.name.includes("刑事")) continue;
    const folderPath = join(root, folder.name);
    for (const filename of await readdir(folderPath)) {
      if (!filename.endsWith(".json")) continue;
      const filePath = join(folderPath, filename);
      const judgment = JSON.parse(await readFile(filePath, "utf8")) as JudgmentJson;
      if (!judgment.JFULL || !indexedJids.has(judgment.JID)) continue;
      const names = new Set(normalize(judgment.JFULL).match(matcher) ?? []);
      for (const name of names) for (const candidateId of candidateIdsByName.get(name) ?? []) matches.push({ candidate_id: candidateId, external_jid: judgment.JID, matched_name: name, local_source_path: filePath });
    }
  }
  let inserted = 0; let skipped = 0; let withdrawn = 0;
  for (let start = 0; start < matches.length; start += 200) {
    const { data, error } = await supabase.rpc("create_pending_review_cases", { p_rows: matches.slice(start, start + 200) });
    if (error) throw error;
    const result = data?.[0]; inserted += result?.inserted_count ?? 0; skipped += result?.skipped_count ?? 0; withdrawn += result?.withdrawn_count ?? 0;
  }
  console.log(JSON.stringify({ candidates: candidates.length, indexed_jids: indexedJids.size, matches: matches.length, inserted, skipped, withdrawn }));
}
main().catch((error) => { console.error("本機 JFULL 比對失敗：", error); process.exitCode = 1; });
