import "dotenv/config";

const memberAccount = process.env.JUDICIAL_MEMBER_ACCOUNT;
const memberPassword = process.env.JUDICIAL_MEMBER_PASSWORD;
const fileSetId = process.argv[2];

if (!memberAccount || !memberPassword) {
  throw new Error("請先在 .env 設定司法院會員帳號與密碼");
}

if (!fileSetId || !/^\d+$/.test(fileSetId)) {
  throw new Error("請在指令後輸入數字型的 fileset ID");
}

function formatBytes(bytes: number) {
  const units = ["bytes", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

async function getToken() {
  const response = await fetch(
    "https://opendata.judicial.gov.tw/api/MemberTokens",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        Range: "bytes=0-0",
      },
    }
  );

  const contentRange = response.headers.get("content-range");
  const contentLength = response.headers.get("content-length");

  const totalBytes = contentRange?.match(/\/(\d+)$/)?.[1] ?? contentLength;

  console.log(`fileset ID：${fileSetId}`);
  console.log(`HTTP 狀態：${response.status}`);
  console.log(`檔案類型：${response.headers.get("content-type") ?? "未知"}`);

  if (totalBytes) {
    console.log(`預估檔案大小：${formatBytes(Number(totalBytes))}`);
  } else {
    console.log("伺服器未提供檔案大小，尚未下載檔案。");
  }
}

main().catch((error) => {
  console.error("查詢失敗：", error);
  process.exitCode = 1;
});