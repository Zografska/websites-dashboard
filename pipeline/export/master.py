import json
from pathlib import Path

import pandas as pd

from pipeline.batch import BATCH_DIR
from pipeline.common.cli import master_parser
from pipeline.common.paths import CHUNK_DIR, CRAWL_DIR, DATA_DIR, FIRMS_CSV, REPO_ROOT
from pipeline.llm.b2c import B2C_DIR
from pipeline.llm.claims import CLAIMS_DIR, category_from, gray_zone_from, label_from, light_from

ORBIS_CSV = DATA_DIR / "orbis/ORBIS_Italia_allsectors.csv"
EXPORT_DIR = DATA_DIR / "export"
B2C_FOR_CLAIMS = {"yes", "mixed", "unclear"}
SECTIONS = [
    ("A", 1, 3, "Agriculture, forestry and fishing"),
    ("B", 5, 9, "Mining and quarrying"),
    ("C", 10, 33, "Manufacturing"),
    ("D", 35, 35, "Electricity, gas, steam and air conditioning"),
    ("E", 36, 39, "Water supply, sewerage, waste"),
    ("F", 41, 43, "Construction"),
    ("G", 45, 47, "Wholesale and retail trade"),
    ("H", 49, 53, "Transportation and storage"),
    ("I", 55, 56, "Accommodation and food service"),
    ("J", 58, 63, "Information and communication"),
    ("K", 64, 66, "Financial and insurance"),
    ("L", 68, 68, "Real estate"),
    ("M", 69, 75, "Professional, scientific and technical"),
    ("N", 77, 82, "Administrative and support services"),
    ("O", 84, 84, "Public administration"),
    ("P", 85, 85, "Education"),
    ("Q", 86, 88, "Human health and social work"),
    ("R", 90, 93, "Arts, entertainment and recreation"),
    ("S", 94, 96, "Other services"),
    ("T", 97, 98, "Households as employers"),
    ("U", 99, 99, "Extraterritorial organisations"),
]
ORBIS_COLUMNS = {
    "bvd_id_number": "bvd_id",
    "p_iva": "p_iva",
    "codice_fiscale": "codice_fiscale",
    "street_no_building_etc_line_1": "address",
    "postcode": "postcode",
    "city": "comune",
    "region_in_country": "region_province",
    "telephone_number": "phone",
    "e_mail_address": "email",
    "category_of_the_company": "size_category",
    "n_emp_23": "employees_2023",
    "n_emp_22": "employees_2022",
    "rev_23": "revenue_2023",
    "date_of_incorporation": "incorporated",
    "type_of_entity": "entity_type",
}
CLAIM_COLUMNS = [
    "bvd_id",
    "domain",
    "batch",
    "quote",
    "context_snippet",
    "source_url",
    "pages",
    "page_urls",
    "triggers",
    "category",
    "scope_status",
    "gray_zone",
    "light",
    "confidence",
    "confidence_level",
    "model_reason",
    "quote_found",
    "key",
]
FIRM_COLUMNS = [
    "bvd_id",
    "p_iva",
    "codice_fiscale",
    "name",
    "website",
    "domain",
    "firms_on_domain",
    "region",
    "province",
    "comune",
    "postcode",
    "address",
    "phone",
    "email",
    "ateco_code",
    "ateco_description",
    "ateco_division",
    "ateco_section",
    "ateco_section_name",
    "size_category",
    "size_class",
    "employees",
    "revenue_2023",
    "entity_type",
    "incorporated",
    "batch",
    "crawl_status",
    "crawl_reason",
    "pages_crawled",
    "readable",
    "crawled_at",
    "b2c",
    "b2c_confidence",
    "checked_for_claims",
    "has_claims",
    "claims",
    "red",
    "yellow",
    "high_confidence",
    "high_confidence_red",
    "low_confidence",
    "categories",
    "pages_with_claims",
]


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def confidence_level(value: float) -> str:
    return "high" if value >= 0.8 else "medium" if value > 0.65 else "low"


def ateco_division(code: str) -> str | None:
    digits = str(code).removesuffix(".0")
    return digits.zfill(6)[:2] if digits.isdigit() else None


def ateco_section(division: str | None) -> tuple[str | None, str | None]:
    if not isinstance(division, str):
        return None, None
    number = int(division)
    return next(((letter, name) for letter, low, high, name in SECTIONS if low <= number <= high), (None, None))


def batch_names(prefix: str) -> list[str]:
    numbers = sorted(int(path.stem.removeprefix("batch_")) for path in BATCH_DIR.glob("batch_*.csv"))
    return [f"{prefix}-{number:02d}" for number in numbers]


def raw_claims(batches: list[str], model: str) -> pd.DataFrame:
    rows = []
    for batch in batches:
        for record in read_jsonl(CLAIMS_DIR / model / f"{batch}.jsonl"):
            for claim in record["claims"]:
                triggers = claim["triggers"]
                label = label_from(triggers)
                category = category_from(triggers)
                rows.append(
                    {
                        "domain": record["domain"],
                        "batch": batch,
                        "page_url": record["page_url"],
                        "chunk": record["chunk"],
                        "quote": claim["quote"],
                        "context_snippet": claim["context_snippet"],
                        "triggers": ",".join(triggers),
                        "category": category,
                        "scope_status": label,
                        "gray_zone": gray_zone_from(triggers),
                        "light": light_from(label, category),
                        "confidence": claim["confidence"],
                        "model_reason": claim["reason"],
                        "quote_found": claim["quote_found"],
                        "key": claim["key"],
                    }
                )
    return pd.DataFrame(rows)


def merge_claims(raw: pd.DataFrame) -> pd.DataFrame:
    ordered = raw.sort_values(["domain", "key", "confidence"], ascending=[True, True, False], kind="stable")
    pages = ordered.groupby(["domain", "key"], sort=False).page_url.agg(lambda urls: list(dict.fromkeys(urls)))
    best = ordered.drop_duplicates(["domain", "key"]).set_index(["domain", "key"])
    best["source_url"] = best.pop("page_url")
    best["pages"] = pages.map(len)
    best["page_urls"] = pages.map(" | ".join)
    best["confidence_level"] = best.confidence.map(confidence_level)
    return best.reset_index()


def crawl_table(batches: list[str], prefix: str) -> pd.DataFrame:
    parts = []
    for batch in batches:
        number = int(batch.removeprefix(f"{prefix}-"))
        summary = pd.read_csv(CRAWL_DIR / f"summary_batch_{number:02d}_{batch}.csv")
        summary = summary.rename(columns={"status": "crawl_status", "reason": "crawl_reason", "pages": "pages_crawled"})
        parts.append(
            summary[["domain", "crawl_status", "crawl_reason", "pages_crawled", "readable"]].assign(batch=batch)
        )
    crawl = pd.concat(parts, ignore_index=True)
    dates = {}
    for batch in batches:
        for site in read_jsonl(CHUNK_DIR / f"{batch}.jsonl"):
            dates[site["domain"]] = site["crawled_at"]
    crawl["crawled_at"] = crawl.domain.map(dates)
    return crawl


def b2c_table(batches: list[str], model: str) -> pd.DataFrame:
    rows = [
        {"domain": record["domain"], "b2c": record["b2c"], "b2c_confidence": record["confidence"]}
        for batch in batches
        for record in read_jsonl(B2C_DIR / model / f"{batch}.jsonl")
    ]
    return pd.DataFrame(rows)


def orbis_table() -> pd.DataFrame:
    orbis = pd.read_csv(ORBIS_CSV, dtype=str, usecols=list(ORBIS_COLUMNS), na_values=["NA"], keep_default_na=False)
    orbis = orbis.rename(columns=ORBIS_COLUMNS).drop_duplicates("bvd_id")
    parts = orbis.region_province.str.split("|", n=1, expand=True)
    orbis["region"], orbis["province"] = parts[0], parts[1]
    orbis["employees"] = pd.to_numeric(orbis.employees_2023.fillna(orbis.employees_2022), errors="coerce")
    return orbis.drop(columns=["region_province", "employees_2023", "employees_2022"])


def firm_counts(claims: pd.DataFrame) -> pd.DataFrame:
    grouped = claims.assign(
        red=claims.light.eq("red"),
        yellow=claims.light.eq("yellow"),
        high_confidence=claims.confidence_level.eq("high"),
        high_confidence_red=claims.confidence_level.eq("high") & claims.light.eq("red"),
        low_confidence=claims.confidence_level.eq("low"),
    ).groupby("domain")
    counts = grouped[["red", "yellow", "high_confidence", "high_confidence_red", "low_confidence"]].sum()
    counts["claims"] = grouped.size()
    counts["categories"] = grouped.category.nunique()
    counts["pages_with_claims"] = grouped.source_url.nunique()
    return counts.reset_index()


def build(prefix: str, model: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    batches = batch_names(prefix)
    claims = merge_claims(raw_claims(batches, model))
    firms = pd.read_csv(FIRMS_CSV, dtype={"bvd_id": str, "ateco_code": str})
    firms = firms.rename(columns={"website_address": "website"}).drop(
        columns=["employees", "revenue", "city", "region"]
    )
    firms = firms.merge(crawl_table(batches, prefix), on="domain", how="inner")
    firms = firms.merge(b2c_table(batches, model), on="domain", how="left")
    firms = firms.merge(orbis_table(), on="bvd_id", how="left")
    firms = firms.merge(firm_counts(claims), on="domain", how="left")
    count_columns = ["claims", "red", "yellow", "high_confidence", "high_confidence_red", "low_confidence"]
    firms[count_columns + ["categories", "pages_with_claims"]] = (
        firms[count_columns + ["categories", "pages_with_claims"]].fillna(0).astype(int)
    )
    firms["checked_for_claims"] = firms.b2c.isin(B2C_FOR_CLAIMS)
    firms["has_claims"] = firms.claims > 0
    firms["ateco_division"] = firms.ateco_code.map(ateco_division)
    sections = firms.ateco_division.map(ateco_section)
    firms["ateco_section"] = sections.str[0]
    firms["ateco_section_name"] = sections.str[1]
    claims = claims.merge(firms[["domain", "bvd_id"]], on="domain", how="left")
    return claims[CLAIM_COLUMNS], firms[FIRM_COLUMNS]


def main(argv: list[str] | None = None) -> None:
    args = master_parser().parse_args(argv)
    claims, firms = build(args.prefix, args.model)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    claims_path = EXPORT_DIR / "claims_master.csv"
    firms_path = EXPORT_DIR / "firms_master.csv"
    claims.to_csv(claims_path, index=False)
    firms.to_csv(firms_path, index=False)
    with_claims = firms[firms.has_claims]
    checked = firms.checked_for_claims.sum()
    print(f"{len(firms):,} firms, {firms.readable.sum():,} readable, {checked:,} checked for claims")
    print(f"{len(with_claims):,} firms with claims, {len(claims):,} claims ({claims.light.eq('red').sum():,} red)")
    print(f"-> {claims_path.relative_to(REPO_ROOT)}, {firms_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
