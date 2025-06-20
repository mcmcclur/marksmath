import pandas as pd
import re


df = pd.read_csv('data/LiberalArtsEmployment.csv')

df = df.rename(columns={
    "Institution Name": "Institution",
    "Sector of institution (HD2023)": "Sector"
})
df = df.drop(columns = ["Unnamed: 63"])

id_vars = ["UnitID", "Institution", "Sector"]
long_df = df.melt(id_vars=id_vars, var_name="raw", value_name="Count")

def parse_year_and_type(raw):
    year_match = re.search(r"(20\d{2})", raw)
    year = int(year_match.group(1)) if year_match else None

    raw_lower = raw.lower()
    if "non-instructional staff" in raw_lower:
        pop = "staff"
    elif "instructional staff" in raw_lower:
        pop = "faculty"
    elif "management" in raw_lower:
        pop = "academic_dmin"
    elif "business" in raw_lower:
        pop = "financial_admin"
    elif "students" in raw_lower:
        pop = "enrollment"
    else:
        pop = "other"

    return pd.Series([year, pop])


long_df[["Year", "Pop"]] = long_df["raw"].apply(parse_year_and_type)
data = long_df[['UnitID', 'Institution', 'Sector', 'Year', 'Pop', 'Count']].dropna().to_dict(orient="records")
