import pandas as pd

def inspect_csv(file_path):
    try:
        df = pd.read_csv(file_path, encoding='euc-kr', nrows=1)
        print(f"--- {file_path} ---")
        print("Columns:", list(df.columns))
        print("First Row:", df.iloc[0].to_dict())
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

inspect_csv('public/sales_dong.csv')
