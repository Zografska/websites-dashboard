import numpy as np
import pandas as pd

from pipeline.common.cli import randomize_parser
from pipeline.common.paths import REPO_ROOT
from pipeline.export.master import EXPORT_DIR

FIRMS_MASTER = EXPORT_DIR / "firms_master.csv"
ASSIGNMENT_CSV = EXPORT_DIR / "assignment.csv"
BALANCE_CSV = EXPORT_DIR / "assignment_balance.csv"
SIZES = {
    "Small company": "piccola",
    "Medium sized company": "media",
    "Large company": "grande",
    "Very large company": "molto grande",
}
MERGED_LARGE = "grande o molto grande"
ARMS = ["C", "T2"]


def eligible_firms() -> pd.DataFrame:
    firms = pd.read_csv(FIRMS_MASTER, dtype={"bvd_id": str})
    firms = firms[firms.has_claims].copy()
    unknown = sorted(set(firms.size_category.dropna()) - set(SIZES))
    if unknown or firms.size_category.isna().any():
        raise SystemExit(f"size category missing or unknown: {unknown or 'missing values'}")
    return firms.sort_values("bvd_id").reset_index(drop=True)


def add_strata(firms: pd.DataFrame, min_stratum: int) -> tuple[pd.DataFrame, float, bool]:
    median = firms.red.median()
    firms["size"] = firms.size_category.map(SIZES)
    firms["risk"] = np.where(firms.red < median, "sotto la mediana", "pari o sopra la mediana")
    merged = firms.groupby(["size", "risk"]).size().min() < min_stratum
    if merged:
        firms["size"] = firms["size"].replace({"grande": MERGED_LARGE, "molto grande": MERGED_LARGE})
    firms["stratum"] = firms["size"] + " | " + firms["risk"]
    return firms, median, merged


def assign(firms: pd.DataFrame, seed: int) -> pd.Series:
    rng = np.random.default_rng(seed)
    arm = pd.Series(index=firms.index, dtype=object)
    for _, members in firms.groupby("stratum", sort=True):
        order = rng.permutation(members.index.to_numpy())
        first = rng.integers(len(ARMS))
        arm[order] = [ARMS[(first + position) % len(ARMS)] for position in range(len(order))]
    return arm


def balance(firms: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for stratum, group in firms.groupby("stratum"):
        counts = group.arm.value_counts()
        rows.append({"table": "stratum", "value": stratum, **{a: int(counts.get(a, 0)) for a in ARMS}})
    for column in ["region", "ateco_section", "b2c"]:
        shares = pd.crosstab(firms[column].fillna("missing"), firms.arm, normalize="columns").round(4)
        rows += [{"table": column, "value": value, **row.to_dict()} for value, row in shares.iterrows()]
    for column in ["red", "yellow", "claims", "employees", "high_confidence_red"]:
        means = firms.groupby("arm")[column].mean().round(3)
        rows.append({"table": "mean", "value": column, **means.to_dict()})
    return pd.DataFrame(rows)


def main(argv: list[str] | None = None) -> None:
    args = randomize_parser().parse_args(argv)
    if ASSIGNMENT_CSV.exists() and not args.force:
        raise SystemExit(f"{ASSIGNMENT_CSV.relative_to(REPO_ROOT)} exists; the draw is final (use --force to redraw)")
    firms, median, merged = add_strata(eligible_firms(), args.min_stratum)
    firms["arm"] = assign(firms, args.seed)
    firms["seed"] = args.seed
    columns = ["bvd_id", "domain", "size_category", "size", "red", "risk", "stratum", "arm", "seed"]
    firms[columns].to_csv(ASSIGNMENT_CSV, index=False)
    table = balance(firms)
    table.to_csv(BALANCE_CSV, index=False)
    print(f"{len(firms):,} firms | median red claims {median:g} | merged large sizes: {merged} | seed {args.seed}")
    print(table[table.table.isin(["stratum", "mean"])].to_string(index=False))
    print(f"-> {ASSIGNMENT_CSV.relative_to(REPO_ROOT)}, {BALANCE_CSV.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
