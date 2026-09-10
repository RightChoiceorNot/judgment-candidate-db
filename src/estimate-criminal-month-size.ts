import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const monthDirectory = join(
  "storage",
  "downloads",
  "fileset-68497",
  "202606",
);

function formatBytes(bytes: number) {
  const units = ["bytes", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(2)} ${units[index]}`;
}

async function main() {
  const entries = await readdir(monthDirectory, { withFileTypes: true });
  const rows: { folder: string; jsonCount: number; totalBytes: number }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.includes("刑事")) continue;

    const folderPath = join(monthDirectory, entry.name);
    const filenames = await readdir(folderPath);

    let jsonCount = 0;
    let totalBytes = 0;

    for (const filename of filenames) {
      if (!filename.endsWith(".json")) continue;

      const file = await stat(join(folderPath, filename));
      jsonCount += 1;
      totalBytes += file.size;
    }

    rows.push({ folder: entry.name, jsonCount, totalBytes });
  }

  rows.sort((a, b) => b.totalBytes - a.totalBytes);

  const totalFiles = rows.reduce((sum, row) => sum + row.jsonCount, 0);
  const totalBytes = rows.reduce((sum, row) => sum + row.totalBytes, 0);

  console.log(`刑事 JSON 檔總數：${totalFiles.toLocaleString()}`);
  console.log(`刑事 JSON 總大小：${formatBytes(totalBytes)}`);

  console.table(
    rows.map((row) => ({
      資料夾: row.folder,
      JSON數量: row.jsonCount,
      大小: formatBytes(row.totalBytes),
    })),
  );
}

main().catch((error) => {
  console.error("統計失敗：", error);
  process.exitCode = 1;
});