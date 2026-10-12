from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent
ORBIS_CSV = REPO_ROOT / "data/orbis/ORBIS_Italia_allsectors.csv"

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


def one_firm_per_domain(df: pd.DataFrame) -> pd.DataFrame:
    revenue = pd.to_numeric(df["rev_23"], errors="coerce").fillna(
        pd.to_numeric(df["rev_22"], errors="coerce")
    )
    firms_on_domain = df.groupby("domain")["domain"].transform("size")
    return (
        df.assign(firms_on_domain=firms_on_domain, _revenue=revenue)
        .sort_values(["_revenue", "bvd_id_number"], ascending=[False, True], na_position="last")
        .drop_duplicates("domain")
        .drop(columns="_revenue")
        .sort_index()
    )


if __name__ == "__main__":
    funnel = []

    df = load_orbis(ORBIS_CSV)
    funnel.append(("all firms", len(df)))

    df = keep_with_website(df)
    funnel.append(("with website", len(df)))

    df = add_domain(df)
    changed = df[df["website_address"] != df["domain"]]
    only_www = changed["website_address"].str.lower() == "www." + changed["domain"]
    print(
        f"addresses changed by cleaning: {len(changed):,} ({only_www.sum():,} only lost 'www.')"
    )
    print(
        changed.loc[~only_www, ["website_address", "domain"]]
        .sample(10, random_state=1)
        .to_string(index=False)
    )
    print()

    before = df
    df, dropped = drop_unusable(df)
    funnel.append(("usable website", len(df)))
    print("dropped as unusable:")
    print(dropped.value_counts().to_string())
    for label in dropped.unique():
        examples = (
            before.loc[dropped[dropped == label].index, "website_address"]
            .head(3)
            .tolist()
        )
        print(f"  {label}: {examples}")
    print()

    df = one_firm_per_domain(df)
    funnel.append(("one firm per domain", len(df)))
    shared = df[df["firms_on_domain"] > 1]
    print(f"shared domains: {len(shared):,} (covering {shared['firms_on_domain'].sum():,} firms)")
    print("top 20 shared domains, firm kept:")
    print(
        shared.nlargest(20, "firms_on_domain")[["domain", "firms_on_domain", "name"]]
        .to_string(index=False)
    )
    print()

    for step, count in funnel:
        print(f"{step:<20} {count:>9,}")
