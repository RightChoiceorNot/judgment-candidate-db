# 115 年地方公職人員選舉候選人官方資料來源調查

調查日期：2026-09-10（民國 115 年 9 月 10 日）

本文件只使用中央選舉委員會（CEC）及其官方體系中的地方選委會網站。沒有下載、保存、解析或匯入任何候選人資料。

## 結論

目前最可行的全國性來源是中選會 2026-09-07 發布的 [115 年候選人登記彙總表](https://web.cec.gov.tw/central/article/64709)。它不是「僅有登記人數」的一張統計表：頁面按九種選舉提供獨立 PDF，檔案大小隨預期候選人數顯著增加，村里長檔為 7,284 KB。因此可合理判定其設計目的為逐筆候選人登記資料的彙整，而非單純件數統計。

附件已於使用者核准後下載並在本機抽取。九份逐筆登記表均有 `選舉區、登記日期、姓名、推薦之政黨、備註` 五欄，共 19,675 列；四份「政黨推薦候選人登記情形」附件為人數統計，未匯入。每一逐筆列保存 PDF SHA-256、檔名、頁碼、公告 URL、公告日與抓取時間。正式公告名單與選舉公報尚未到預定公告時間，不能把本頁稱為最終名單。

## 官方來源盤點

| 優先 | 發布單位與來源 | 格式與範圍 | 狀態定位 | 更新方式／用途 |
| --- | --- | --- | --- | --- |
| 1 | [中選會 115 年候選人登記彙總表](https://web.cec.gov.tw/central/article/64709)，2026-09-07 | HTML 附件頁；9 份 PDF；涵蓋直轄市長、直轄市議員、縣市長、縣市議員、直轄市山地原住民區長／代表、鄉鎮市長／代表、村里長 | `registered`。登記受理已結束，但仍在審定候選人名單之前 | 登記完成後發布的全國彙整；可作首次預覽候選來源，須保留原始公告 URL、發布日與抓取時間 |
| 2 | [中選會 115 年地方選舉專區／選舉資訊](https://web.cec.gov.tw/central?Menu_id=1392) | HTML 導覽頁；公告、登記概況、選舉公報等分類 | 依子頁判定 | 作為中央來源目錄與更新偵測入口 |
| 3 | [中選會最新消息清單](https://web.cec.gov.tw/central/article/list/145?page=1) | HTML | `registered` 的日別登記概況及彙總表訊息 | 登記期間與完成登記後更新；日別概況不可取代逐筆名單 |
| 4 | 各直轄市／縣市選委會的 CEC 官方子站，例如 [臺北市選委會選舉資訊](https://web.cec.gov.tw/tpcec/menu/11432)、[臺南市選委會網站導覽](https://web.cec.gov.tw/tnec/sitemap) | HTML 與附件；格式可能為 PDF、DOC/DOCX、ODT、XLS | 依公告內容判定 | 地方選區、里長、山地原住民區等以當地正式公告、公報優先 |
| 5 | 中選會與地方選委會的「選舉公報」分類 | 通常為 PDF；有些歷屆文件可被搜尋引擎擷取成表格 | `officially_listed` | 正式公開顯示候選人身分的最高優先資料；待 115 年發布後逐一登錄 |
| 6 | 中選會／地方選委會的正式「公告候選人名單」與號次抽籤結果 | HTML、PDF、DOC/DOCX，依地區而異 | `officially_listed`，以公告為準 | 可更新既有 `registered` candidacy，必須留存舊來源與異動紀錄 |

沒有在本次官方網頁調查中發現可直接使用、且明確記載 115 年逐筆候選人資料的 CEC Open Data API、CSV 或 Excel 全國端點。現階段應以可設定的 HTML/PDF 附件 adapter 為主；若地方站提供 XLS/XLSX，才使用表格 adapter。

## 指定公告與附件

來源頁：<https://web.cec.gov.tw/central/article/64709><br>
發布單位：中央選舉委員會<br>
發布日期：2026-09-07（以中選會 115 年最新消息清單顯示日期為準）<br>
來源類型：候選人完成登記後的彙總資料；不是審定後公告名單，也不是選舉公報。
候選人狀態：`registered`，不可標記為 `officially_listed`。

| 選舉種類 | 附件 | 格式／大小 | 欄位與可解析性 |
| --- | --- | --- | --- |
| 直轄市長 | [1-1](https://web.cec.gov.tw/api/file/bb9a8d7a-9b8a-41ec-8e23-33efd009385a.pdf) | PDF，62 KB，23 列 | 五欄已核對 |
| 直轄市長政黨推薦 | [1-2](https://web.cec.gov.tw/api/file/ca219c05-fa5d-4706-af53-b214cd8c861f.pdf) | PDF，54 KB | 推薦關係補充來源；不得單獨建立候選人 |
| 直轄市議員 | [2-1](https://web.cec.gov.tw/api/file/ccd7e51a-5fd0-4ea0-a81b-a120cd550c9c.pdf) | PDF，400 KB，610 列 | 五欄已核對 |
| 直轄市議員政黨推薦 | [2-2](https://web.cec.gov.tw/api/file/7a8eb38b-76c3-41c1-9d54-0dd55951a182.pdf) | PDF，191 KB | 推薦關係補充來源；欄名待核對 |
| 縣市長 | [3-1](https://web.cec.gov.tw/api/file/370f3bbf-6408-4fdc-b8d8-9b9214913f74.pdf) | PDF，86 KB，58 列 | 五欄已核對 |
| 縣市長政黨推薦 | [3-2](https://web.cec.gov.tw/api/file/e3bc1f62-bfb5-4e42-8853-7389c4aee159.pdf) | PDF，60 KB | 推薦關係補充來源；欄名待核對 |
| 縣市議員 | [4-1](https://web.cec.gov.tw/api/file/4c21eb95-a032-4ccc-bdf4-fd1bca1ce4d7) | PDF，609 KB，892 列 | 五欄已核對 |
| 縣市議員政黨推薦 | [4-2](https://web.cec.gov.tw/api/file/4d195d02-a8a4-4a4e-9dcb-05f68ce285a5.pdf) | PDF，256 KB | 推薦關係補充來源；欄名待核對 |
| 山地原住民區長 | [5](https://web.cec.gov.tw/api/file/1278f66e-1d15-4ecf-aeeb-9ea5cba61f00.pdf) | PDF，58 KB | 預期含行政區／姓名等；欄名待核對 |
| 山地原住民區民代表 | [6](https://web.cec.gov.tw/api/file/f3b665f2-6f0b-485f-a1eb-17d152849317.pdf) | PDF，109 KB | 預期含選區／姓名等；欄名待核對 |
| 鄉鎮市長 | [7](https://web.cec.gov.tw/api/file/49fac9ae-e7cf-4e82-aaf5-76b764673823.pdf) | PDF，385 KB | 預期含鄉鎮市／姓名等；欄名待核對 |
| 鄉鎮市民代表 | [8](https://web.cec.gov.tw/api/file/d83da430-ba11-40e3-b57b-0c3d94cad0c8.pdf) | PDF，1,972 KB | 預期含選區／姓名等；欄名待核對 |
| 村里長 | [9](https://web.cec.gov.tw/api/file/30fe055c-2d64-46bc-a9ed-fd7d6f8cf2eb.pdf) | PDF，7,284 KB | 規模最大，極可能有逐筆村里與姓名；欄名待核對 |

頁面另提供 [全部附件 ZIP](https://web.cec.gov.tw/api/file/zip/64709.zip)，但本次未下載。

## 時程與狀態判定

中選會及地方選委會工作程序資料顯示：候選人登記受理為 8 月 31 日至 9 月 4 日；10 月 16 日前審定名單、10 月 23 日抽籤；直轄市長名單預定 11 月 12 日公告，直轄市議員、縣市長與縣市議員預定 11 月 17 日公告，地方層級名單由各地選委會依時程公告。因此 9 月 7 日登記彙總只能是 `registered`，即使附件含逐筆姓名，也不可視為最終正式候選人名單。

正式公告名單或選舉公報出現後，應新增 `candidate_sources`，將對應 `candidacies.candidate_status` 更新為 `officially_listed` 的等價狀態；保留原 `registered` 來源與所有變動事件。現有 schema 的 `candidate_status` 尚未包含 `officially_listed`，實作前需要一份 migration，並先取得使用者對資料匯入的核准。

## 建議 adapter 架構與欄位映射

所有 adapter 均由設定檔提供 URL、發布單位、格式、來源類型與選舉範圍；比對模組只讀已核准且已匯入的私有資料，不得硬寫任何官方 URL。

| Adapter | 輸入 | 輸出／驗證 |
| --- | --- | --- |
| `cec-attachment-page` | 官方 HTML 公告頁 | 擷取公告 URL、標題、發布日、附件 URL、檔名、格式、標示大小、抓取時間 |
| `pdf-candidate-register` | 經核准下載的文字型 PDF | 逐頁抽取表格；保存 SHA-256、頁碼、原始列與解析警告；掃描 PDF 時改列人工處理 |
| `spreadsheet-candidate-register` | 經核准的 CSV/XLS/XLSX | 工作表、欄頭、列數、欄位缺失與重複姓名預覽 |
| `official-list-or-bulletin` | 審定候選人名單或選舉公報 | 以最高優先來源建立／更新 candidacy，保留先前來源與狀態歷史 |

候選人列的預期映射為：`姓名 → candidates.full_name/normalized_name`、`選舉種類 → candidacies.election_type`、`選區／縣市／鄉鎮／村里 → candidacies.district`、`政黨 → candidacies.party_name`、`來源 URL／公告日／抓取日／雜湊 → candidate_sources`。候選人號次、頁碼與原始列可作 `candidate_sources.source_note` 或日後擴充的結構化欄位。每次匯入前必須產生預覽：資料範圍、預計筆數、選舉種類、選區、姓名、政黨、重複姓名與缺漏欄位。

## 自動化風險與下一步

- 各地選委會的附件格式可能是 PDF、Word、Excel 或 HTML，欄頭及行政區層級不一致。
- PDF 可能是掃描檔、合併儲存格或跨頁表格，需保留原始檔雜湊與人工覆核路徑，不能靜默填補。
- 登記後仍可能因資格審定、政黨撤回、撤回登記或最終公告而變動；只能追加來源與 review/event 紀錄，不能覆蓋舊資料。
- 同名不是同一人；匯入候選人資料只建立候選人與選舉參選紀錄，絕不自動建立已確認的裁判書關聯。

下一步是先提供待匯入來源 URL、範圍、預計筆數、欄位清單及 PDF 欄位預覽給使用者核准。未收到明確核准前，不下載附件、不解析、不匯入任何真實候選人資料。
