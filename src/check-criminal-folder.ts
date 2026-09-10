import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

type JudgmentIdRecord = {
  JID: string;
};

const folderPath = join(
  "storage",
  "downloads",
  "fileset-68497",
  "202606",
  "三重簡易庭刑事"
);

async function main() {
  const filenames = (await readdir(folderPath)).filter((filename) =>
    filename.endsWith(".json")
  );

  const jidCounts = new Map<string, number>();

  for (const filename of filenames) {
    const content = await readFile(join(folderPath, filename), "utf8");
    const judgment = JSON.parse(content) as JudgmentIdRecord;

    jidCounts.set(judgment.JID, (jidCounts.get(judgment.JID) ?? 0) + 1);
  }

  const duplicates = [...jidCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([jid, count]) => ({ jid, count }));

  console.log(`JSON 檔案數：${filenames.length}`);
  console.log(`不重複 JID 數：${jidCounts.size}`);
  console.log(`重複 JID 數：${duplicates.length}`);

  if (duplicates.length > 0) {
    console.table(duplicates);
  }
}

main().catch((error) => {
  console.error("檢查失敗：", error);
  process.exitCode = 1;
});