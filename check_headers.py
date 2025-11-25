import pandas as pd
import io

def check_headers(file_path):
    try:
        # Try reading with euc-kr which is common for Korean public data
        df = pd.read_csv(file_path, encoding='euc-kr', nrows=0)
        print(f"Headers for {file_path}:")
        print(list(df.columns))
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

check_headers('public/sales_dong.csv')
check_headers('public/store_dong.csv')
