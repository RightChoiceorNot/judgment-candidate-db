import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const memberAccount = process.env.JUDICIAL_MEMBER_ACCOUNT;
const memberPassword = process.env.JUDICIAL_MEMBER_PASSWORD;
const fileSetId = process.argv[2];

if (!memberAccount || !memberPassword) {
  throw new Error("請先在 .env 設定司法院會員帳號與密碼");
}

if (!fileSetId || !/^\d+$/.test(fileSetId)) {
  throw new Error("請在指令後輸入數字型的 fileset ID");
}

async function getToken() {
  const response = await fetch(
    "https://opendata.judicial.gov.tw/api/MemberTokens",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        memberAccount,
        pwd: memberPassword,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.token) {
    throw new Error(`取得司法院 Token 失敗：${JSON.stringify(result)}`);
  }

  return result.token as string;
}

async function main() {
  const token = await getToken();

  const response = await fetch(
    `https://opendata.judicial.gov.tw/api/FilesetLists/${fileSetId}/file`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`下載失敗：${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const outputDirectory = join("storage", "downloads");
  const outputPath = join(outputDirectory, `fileset-${fileSetId}.csv`);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, bytes);

  console.log(`下載完成：${outputPath}`);
  console.log(`檔案大小：${bytes.length.toLocaleString()} bytes`);
}

main().catch((error) => {
  console.error("處理失敗：", error);
  process.exitCode = 1;
});