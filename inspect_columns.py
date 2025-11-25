import pandas as pd
import os

files = [
    'public/서울시 상권분석서비스(추정매출-행정동).csv',
    'public/서울시 상권분석서비스(점포-행정동).csv',
    'public/서울시 상권분석서비스(길단위인구-행정동).csv',
    'public/서울시 상권분석서비스(상주인구-행정동).csv',
    'public/서울시 상권분석서비스(직장인구-행정동).csv'
]

with open('columns_report.txt', 'w', encoding='utf-8') as f:
    for file_path in files:
        f.write(f"\n--- Checking {file_path} ---\n")
        if not os.path.exists(file_path):
            f.write("File not found.\n")
            continue
            
        try:
            # Try cp949 first, then euc-kr
            try:
                df = pd.read_csv(file_path, encoding='cp949')
            except:
                df = pd.read_csv(file_path, encoding='euc-kr')
                
            cols = df.columns.tolist()
            f.write(f"Total Columns: {len(cols)}\n")
            
            # Check for Gu and Dong columns
            gu_cols = [c for c in cols if '구' in c]
            dong_cols = [c for c in cols if '동' in c]
            f.write(f"Columns with '구': {gu_cols}\n")
            f.write(f"Columns with '동': {dong_cols}\n")
            
            # Print all columns
            f.write(f"All Columns: {cols}\n")
            
            # Print first row to check data format
            f.write(f"First Row: {df.iloc[0].tolist()}\n")

        except Exception as e:
            f.write(f"Error: {e}\n")
