type FileSet = {
  fileSetId: number;
  resourceFormat: string;
  resourceDescription: string;
};

type JudicialResource = {
  datasetId: number;
  title: string;
  categoryName: string;
  filesets: FileSet[];
};

const categoryNo = process.argv[2] ?? "051";
const resourcesUrl =
  `https://opendata.judicial.gov.tw/data/api/rest/categories/${categoryNo}/resources`;

async function main() {
  const response = await fetch(resourcesUrl);

  if (!response.ok) {
    throw new Error(
      `司法院 API 回應失敗：${response.status} ${response.statusText}`
    );
  }

  const resources = (await response.json()) as JudicialResource[];

  const rows = resources.flatMap((resource) =>
    resource.filesets.map((fileset) => ({
      datasetId: resource.datasetId,
      title: resource.title,
      categoryName: resource.categoryName,
      fileSetId: fileset.fileSetId,
      format: fileset.resourceFormat,
      description: fileset.resourceDescription,
    }))
  );

  console.log(`分類 ${categoryNo} 共取得 ${resources.length} 個資料集：`);
  console.table(rows);
}

main().catch((error) => {
  console.error("讀取失敗：", error);
  process.exitCode = 1;
});