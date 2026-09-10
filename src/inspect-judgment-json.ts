import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const monthDirectory = join(
  "storage",
  "downloads",
  "fileset-68497",
  "202606"
);

async function main() {
  const entries = await readdir(monthDirectory, { withFileTypes: true });

  const criminalDirectory = entries.find(
    (entry) => entry.isDirectory() && entry.name.includes("刑事")
  );

  if (!criminalDirectory) {
    throw new Error("找不到刑事資料夾");
  }

  const criminalDirectoryPath = join(
    monthDirectory,
    criminalDirectory.name
  );

  const filenames = await readdir(criminalDirectoryPath);

  const jsonFilename = filenames.find((filename) =>
    filename.endsWith(".json")
  );

  if (!jsonFilename) {
    throw new Error("找不到 JSON 判決檔");
  }

  const filePath = join(criminalDirectoryPath, jsonFilename);
  const content = await readFile(filePath, "utf8");
  const judgment = JSON.parse(content) as Record<string, unknown>;

  console.log(`測試檔案：${criminalDirectory.name}/${jsonFilename}`);
  console.log("JSON 欄位名稱：");

  console.table(
    Object.entries(judgment).map(([field, value]) => ({
      field,
      type: Array.isArray(value) ? "array" : typeof value,
      length: typeof value === "string" ? value.length : "",
    }))
  );
}

main().catch((error) => {
  console.error("讀取失敗：", error);
  process.exitCode = 1;
});