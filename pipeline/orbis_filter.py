from pathlib import Path

import pandas as pd
import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
ORBIS_CSV = REPO_ROOT / "data/orbis/ORBIS_Italia_allsectors.csv"
SECTORS_YAML = Path(__file__).resolve().parent / "sectors.yaml"
B2C_LISTS = ["draft"]
MICRO_MAX_EMPLOYEES = 10
MICRO_MAX_REVENUE = 2_000_000
FIRMS_CSV = REPO_ROOT / "data/firms_filtered.csv"
FUNNEL_CSV = REPO_ROOT / "data/firms_filtered_funnel.csv"
OUTPUT_COLUMNS = {
    "bvd_id_number": "bvd_id",
    "name": "name",
    "website_address": "website_address",
    "domain": "domain",
    "firms_on_domain": "firms_on_domain",
    "primary_code_s_in_this_classification": "ateco_code",
    "primary_code_in_national_industry_classification_text_description": "ateco_description",
    "sector": "sector",
    "sector_list": "sector_list",
    "employees": "employees",
    "revenue": "revenue",
    "size_class": "size_class",
    "city": "city",
    "region_in_country": "region",
}

UNUSABLE_SITES = {
    "social or link page": [
        "facebook.com",
        "instagram.com",
        "linkedin.com",
        "youtube.com",
        "tiktok.com",
        "twitter.com",
        "x.com",
        "linktr.ee",
        "google.com",
        "goo.gl",
        "g.page",
    ],
    "directory listing": [
        "quantofattura.com",
        "commercioinitalia.it",
        "reteimprese.it",
        "paginegialle.it",
        "paginebianche.it",
        "overplace.com",
        "valoresalute.it",
        "tripadvisor.it",
        "tripadvisor.com",
        "booking.com",
        "quandoo.com",
        "quandoo.it",
        "autoscout24.it",
        "subito.it",
        "virgilio.it",
        "kompass.com",
        "elenchitelefonici.it",
        "empresite.it",
        "aziendit.com",
        "edilroma.com",
        "sconti-negozi.it",
        "leggimenu.it",
        "centriassistenza.org",
    ],
    "not a company site": [
        "aruba.it",
        "netsons.com",
        "web.tiscali.it",
        "mio-ip.it",
        "dan.com",
        "bit.ly",
        "wikipedia.org",
        "ansa.it",
        "docplayer.it",
        "amazon.it",
        "sfondidesktop.eu",
        "cardpostage.com",
    ],
    "dead platform (Google business.site)": ["business.site"],
    "parked domain": ["nidoma.com"],
}

VALID_DOMAIN = r"(?:[a-z0-9à-ÿ-]+\.)+[a-z]{2,}"


def load_orbis(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, dtype=str, keep_default_na=False, na_values=["NA", ""])


def keep_with_website(df: pd.DataFrame) -> pd.DataFrame:
    return df[df["website_address"].notna()]


def add_domain(df: pd.DataFrame) -> pd.DataFrame:
    domain = (
        df["website_address"]
        .str.strip()
        .str.lower()
        .str.replace(r"^[a-z]+://", "", regex=True)
        .str.replace(r"^www\d*\.", "", regex=True)
        .str.split(r"[/?#:]", regex=True)
        .str[0]
        .str.rstrip(".")
    )
    return df.assign(domain=domain)


def on_site(domain: pd.Series, sites: list[str]) -> pd.Series:
    match = pd.Series(False, index=domain.index)
    for site in sites:
        match |= (domain == site) | domain.str.endswith("." + site)
    return match


def drop_unusable(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    reason = pd.Series(pd.NA, index=df.index, dtype="string")
    reason[~df["domain"].str.fullmatch(VALID_DOMAIN)] = "malformed address"
    for label, sites in UNUSABLE_SITES.items():
        reason[reason.isna() & on_site(df["domain"], sites)] = label
    dropped = reason.dropna()
    return df[reason.isna()], dropped


def add_firms_on_domain(df: pd.DataFrame) -> pd.DataFrame:
    return df.assign(firms_on_domain=df.groupby("domain")["domain"].transform("size"))


def add_employees_revenue(df: pd.DataFrame) -> pd.DataFrame:
    def latest(column: str) -> pd.Series:
        return pd.to_numeric(df[f"{column}_23"], errors="coerce").fillna(
            pd.to_numeric(df[f"{column}_22"], errors="coerce")
        )

    return df.assign(employees=latest("n_emp"), revenue=latest("rev"))


def one_firm_per_domain(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df.sort_values(["revenue", "bvd_id_number"], ascending=[False, True], na_position="last")
        .drop_duplicates("domain")
        .sort_index()
    )


def load_sectors(path: Path) -> dict[str, dict[str, list[str]]]:
    lists = yaml.safe_load(path.read_text())
    return {
        list_name: {sector: [code.replace(".", "") for code in codes] for sector, codes in sectors.items()}
        for list_name, sectors in lists.items()
    }


def add_sector(df: pd.DataFrame, sector_lists: dict[str, dict[str, list[str]]]) -> pd.DataFrame:
    code = df["primary_code_s_in_this_classification"].fillna("")
    sector = pd.Series(pd.NA, index=df.index, dtype="string")
    sector_list = pd.Series(pd.NA, index=df.index, dtype="string")
    for list_name, sectors in sector_lists.items():
        for name, prefixes in sectors.items():
            match = sector.isna() & code.str.startswith(tuple(prefixes))
            sector[match] = name
            sector_list[match] = list_name
    return df.assign(sector=sector, sector_list=sector_list)


def keep_b2c(df: pd.DataFrame, lists: list[str]) -> pd.DataFrame:
    return df[df["sector_list"].isin(lists)]


def add_size_class(df: pd.DataFrame) -> pd.DataFrame:
    employees, revenue = df["employees"], df["revenue"]
    size_class = pd.Series("unknown", index=df.index)
    size_class[(employees < MICRO_MAX_EMPLOYEES) & (revenue <= MICRO_MAX_REVENUE)] = "micro"
    size_class[(employees >= MICRO_MAX_EMPLOYEES) | (revenue > MICRO_MAX_REVENUE)] = "not micro"
    return df.assign(size_class=size_class)


def save(df: pd.DataFrame, funnel: list[tuple[str, int]]) -> None:
    out = df[list(OUTPUT_COLUMNS)].rename(columns=OUTPUT_COLUMNS)
    out = out.assign(employees=out["employees"].round().astype("Int64"), revenue=out["revenue"].round().astype("Int64"))
    out.to_csv(FIRMS_CSV, index=False)
    pd.DataFrame(funnel, columns=["step", "firms"]).to_csv(FUNNEL_CSV, index=False)


if __name__ == "__main__":
    funnel = []

    df = load_orbis(ORBIS_CSV)
    funnel.append(("all firms", len(df)))

    df = keep_with_website(df)
    funnel.append(("with website", len(df)))

    df = add_domain(df)
    changed = df[df["website_address"] != df["domain"]]
    only_www = changed["website_address"].str.lower() == "www." + changed["domain"]
    print(f"addresses changed by cleaning: {len(changed):,} ({only_www.sum():,} only lost 'www.')")
    print(changed.loc[~only_www, ["website_address", "domain"]].sample(10, random_state=1).to_string(index=False))
    print()

    before = df
    df, dropped = drop_unusable(df)
    funnel.append(("usable website", len(df)))
    print("dropped as unusable:")
    print(dropped.value_counts().to_string())
    for label in dropped.unique():
        examples = before.loc[dropped[dropped == label].index, "website_address"].head(3).tolist()
        print(f"  {label}: {examples}")
    print()

    df = add_firms_on_domain(df)
    df = add_employees_revenue(df)
    df = add_sector(df, load_sectors(SECTORS_YAML))
    print("firms per sector:")
    print(df.groupby(["sector_list", "sector"]).size().to_string())
    print(df["sector_list"].value_counts(dropna=False).to_string())
    print()
    df = keep_b2c(df, B2C_LISTS)
    funnel.append((f"B2C sectors ({', '.join(B2C_LISTS)})", len(df)))

    df = one_firm_per_domain(df)
    funnel.append(("one firm per domain", len(df)))
    shared = df[df["firms_on_domain"] > 1]
    print(f"shared domains kept: {len(shared):,}")
    print("top 20 shared domains, firm kept:")
    print(
        shared.nlargest(20, "firms_on_domain")[["domain", "firms_on_domain", "name", "sector"]].to_string(index=False)
    )
    print()

    df = add_size_class(df)
    print("firms per size class:")
    print(df["size_class"].value_counts().to_string())
    print()
    print("size class per sector:")
    print(
        pd.crosstab(df["sector"], df["size_class"], margins=True, margins_name="Total")
        .sort_values("Total", ascending=False)
        .to_string()
    )
    print()

    for step, count in funnel:
        print(f"{step:<24} {count:>9,}")

    save(df, funnel)
    print(f"\nsaved {len(df):,} firms to {FIRMS_CSV.relative_to(REPO_ROOT)}")
    print(f"saved funnel to {FUNNEL_CSV.relative_to(REPO_ROOT)}")
