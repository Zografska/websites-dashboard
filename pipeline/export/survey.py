import pandas as pd

from pipeline.common.cli import survey_parser
from pipeline.common.paths import EXPORT_DIR, REPO_ROOT, REVIEW_DIR

FIRMS_MASTER = EXPORT_DIR / "firms_master.csv"
ASSIGNMENT = EXPORT_DIR / "assignment.csv"
SECTOR_SENTENCES = REVIEW_DIR / "sector_sentences_draft_2026-11-15.csv"
PASSPHRASES = EXPORT_DIR / "firm_report_links_aleksandra_2026-11-15.xlsx"
REPORT_URL = "https://greenclaims.2d4d.eu/#/firm/{firm_id}"
TEST_FIRM = "FDUMMY"
SURVEY_NAME = "survey_firms_2026-11-15"
TEXT_COLUMNS = ["Partita IVA", "Codice fiscale", "Codice ATECO", "Divisione ATECO", "Numero di telefono"]
COLUMNS = {
    "firm_id": "ID impresa",
    "bvd_id": "BvD ID",
    "p_iva": "Partita IVA",
    "codice_fiscale": "Codice fiscale",
    "name": "Ragione sociale",
    "region": "Regione",
    "province": "Provincia",
    "comune": "Comune",
    "ateco_section_name": "Settore",
    "ateco_division": "Divisione ATECO",
    "ateco_code": "Codice ATECO",
    "ateco_hand_coded": "ATECO assegnato a mano",
    "size": "Dimensione",
    "employees": "Numero addetti",
    "phone": "Numero di telefono",
    "referente": "Nome referente",
    "arm": "Trattamento",
    "sector_sentence": "Frase settoriale",
    "passphrase": "Codice di accesso al report",
    "report_link": "Link al report",
}


def passphrases() -> pd.DataFrame:
    table = pd.read_excel(PASSPHRASES, sheet_name="Firms", dtype=str)
    table = table[table["Firm ID"] != TEST_FIRM]
    return table.rename(columns={"Firm ID": "firm_id", "Passphrase": "passphrase"})[["firm_id", "passphrase"]]


def sector_sentences() -> dict[str, str]:
    table = pd.read_csv(SECTOR_SENTENCES, dtype=str, keep_default_na=False)
    return dict(zip(table.Division, table["Frase settoriale (draft)"], strict=True))


def build() -> pd.DataFrame:
    firms = pd.read_csv(FIRMS_MASTER, dtype=str, keep_default_na=False)
    firms = firms[firms.firm_id != ""]
    assignment = pd.read_csv(ASSIGNMENT, dtype=str, usecols=["bvd_id", "size", "arm"])
    table = firms.merge(assignment, on="bvd_id", how="inner", validate="1:1")
    table = table.merge(passphrases(), on="firm_id", how="left", validate="1:1")
    table["report_link"] = table.firm_id.map(lambda firm_id: REPORT_URL.format(firm_id=firm_id))
    table["sector_sentence"] = table.ateco_division.str.zfill(2).map(sector_sentences())
    table["referente"] = ""
    table["ateco_hand_coded"] = table.ateco_hand_coded.map({"True": "sì", "False": "no"})
    return table.sort_values("firm_id")[list(COLUMNS)].rename(columns=COLUMNS).reset_index(drop=True)


def check(table: pd.DataFrame, firms: int) -> None:
    problems = []
    if len(table) != firms:
        problems.append(f"{len(table):,} rows, expected {firms:,}")
    for column in ["ID impresa", "Codice di accesso al report", "Link al report"]:
        if not table[column].notna().all() or not table[column].is_unique:
            problems.append(f"{column} missing or not unique")
    for column in ["Trattamento", "Frase settoriale"]:
        if table[column].isna().any() or (table[column] == "").any():
            problems.append(f"{column} missing")
    if problems:
        raise SystemExit("; ".join(problems))


def write_xlsx(table: pd.DataFrame, path) -> None:
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        table.to_excel(writer, index=False, sheet_name="Imprese")
        sheet = writer.sheets["Imprese"]
        for position, column in enumerate(table.columns, 1):
            cells = next(sheet.iter_cols(min_col=position, max_col=position, min_row=2))
            if column in TEXT_COLUMNS:
                for cell in cells:
                    cell.number_format = "@"
            sheet.column_dimensions[cells[0].column_letter].width = min(40, max(12, len(column) + 2))
        sheet.freeze_panes = "B2"


def main(argv: list[str] | None = None) -> None:
    args = survey_parser().parse_args(argv)
    table = build()
    check(table, len(pd.read_csv(ASSIGNMENT, usecols=["bvd_id"])))
    name = args.name or SURVEY_NAME
    csv, xlsx = EXPORT_DIR / f"{name}.csv", EXPORT_DIR / f"{name}.xlsx"
    table.to_csv(csv, index=False)
    write_xlsx(table, xlsx)
    empty = {column: int((table[column].fillna("") == "").sum()) for column in table.columns}
    arms = table.Trattamento.value_counts()
    print(f"{len(table):,} firms; C {arms.get('C', 0):,}, T2 {arms.get('T2', 0):,}")
    print("empty: " + ", ".join(f"{column} {count:,}" for column, count in empty.items() if count))
    print(f"-> {csv.relative_to(REPO_ROOT)}\n-> {xlsx.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
