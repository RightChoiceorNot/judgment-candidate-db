import { readdir } from "node:fs/promises";
import { join } from "node:path";

const monthDirectory = join(
  "storage",
  "downloads",
  "fileset-68497",
  "202606"
);

async function main() {
  const entries = await readdir(monthDirectory, { withFileTypes: true });

  const rows = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.includes("刑事")) {
      continue;
    }

    const folderPath = join(monthDirectory, entry.name);
    const filenames = await readdir(folderPath);
    const jsonCount = filenames.filter((filename) =>
      filename.endsWith(".json")
    ).length;

    rows.push({
      folder: entry.name,
      jsonCount,
    });
  }

  rows.sort((a, b) => b.jsonCount - a.jsonCount);

  console.log(`刑事資料夾數：${rows.length}`);
  console.log(
    `刑事 JSON 檔總數：${rows
      .reduce((total, row) => total + row.jsonCount, 0)
      .toLocaleString()}`
  );

  console.table(rows);
}

main().catch((error) => {
  console.error("統計失敗：", error);
  process.exitCode = 1;
});