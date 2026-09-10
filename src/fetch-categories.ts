type JudicialCategory = {
  categoryNo: string;
  categoryName: string;
};

const categoriesUrl =
  "https://opendata.judicial.gov.tw/data/api/rest/categories";

async function main() {
  const response = await fetch(categoriesUrl);

  if (!response.ok) {
    throw new Error(
      `司法院 API 回應失敗：${response.status} ${response.statusText}`
    );
  }

  const categories = (await response.json()) as JudicialCategory[];

  console.log(`取得 ${categories.length} 個主題分類：`);
  console.table(categories);
}

main().catch((error) => {
  console.error("讀取失敗：", error);
  process.exitCode = 1;
});