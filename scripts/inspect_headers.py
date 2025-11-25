import pandas as pd
import io

try:
    df = pd.read_csv('public/sales_dong.csv', encoding='euc-kr', nrows=0)
    print("Sales Data Columns:")
    for col in df.columns:
        print(f"- {col}")
except Exception as e:
    print(f"Error reading sales_dong.csv: {e}")

print("\n" + "="*20 + "\n")

try:
    df = pd.read_csv('public/store_dong.csv', encoding='euc-kr', nrows=0)
    print("Store Data Columns:")
    for col in df.columns:
        print(f"- {col}")
except Exception as e:
    print(f"Error reading store_dong.csv: {e}")
