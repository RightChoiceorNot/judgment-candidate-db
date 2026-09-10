import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

ROOT = Path("storage/downloads/cec-115-candidate-registration-64709")
OUTPUT = ROOT / "candidate-registration-preview.json"
SOURCE_PAGE_URL = "https://web.cec.gov.tw/central/article/64709"

ELECTION_FILES = {
    "1-1": "直轄市長",
    "2-1": "直轄市議員",
    "3-1": "縣市長",
    "4-1": "縣市議員",
    "5-": "直轄市山地原住民區長",
    "6-": "直轄市山地原住民區民代表",
    "7-": "鄉鎮市長",
    "8-": "鄉鎮市民代表",
    "9-": "村里長",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    rows = []
    files = []
    fetched_at = datetime.now(timezone.utc).isoformat()

    for prefix, election_type in ELECTION_FILES.items():
        path = next(ROOT.glob(f"{prefix}*.pdf"))
        file_hash = sha256(path)
        row_number = 0

        with pdfplumber.open(path) as pdf:
            for page_number, page in enumerate(pdf.pages, start=1):
                table = page.extract_table()
                if not table:
                    continue
                for table_row in table[1:]:
                    if len(table_row) < 5 or not table_row[1] or not table_row[2]:
                        continue
                    if not table_row[1].startswith("115/"):
                        continue
                    row_number += 1
                    district, registration_date, full_name, party_name, note = table_row[:5]
                    rows.append({
                        "source_record_key": f"{file_hash}:{page_number}:{row_number}",
                        "source_page_url": SOURCE_PAGE_URL,
                        "source_file_name": path.name,
                        "source_sha256": file_hash,
                        "source_published_at": "2026-09-07",
                        "fetched_at": fetched_at,
                        "page_number": page_number,
                        "election_type": election_type,
                        "district": (district or "").replace("\n", " "),
                        "registration_date_roc": registration_date,
                        "full_name": (full_name or "").replace("\n", " "),
                        "party_name": (party_name or "").replace("\n", " "),
                        "note": (note or "").replace("\n", " "),
                    })
        files.append({
            "file_name": path.name,
            "election_type": election_type,
            "sha256": file_hash,
            "record_count": row_number,
        })

    OUTPUT.write_text(json.dumps({"files": files, "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT), "files": files, "record_count": len(rows)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
