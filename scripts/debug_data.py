import pandas as pd
import chardet

file_path = 'public/sales.csv'

try:
    # Try reading with euc-kr
    df = pd.read_csv(file_path, encoding='euc-kr')
    print("Columns:", df.columns.tolist())
    
    # Find the latest quarter
    df['YQ'] = df.apply(lambda x: int(str(x['기준_년_코드']) + str(x['기준_분기_코드'])), axis=1)
    max_yq = df['YQ'].max()
    print(f"Latest YQ: {max_yq}")
    
    latest_df = df[df['YQ'] == max_yq]
    
    # Check Weekend Sales Ratio
    if '주말_매출_비율' in latest_df.columns:
        print("Weekend Sales Ratio Stats:")
        print(latest_df['주말_매출_비율'].describe())
        print("Sample values:", latest_df['주말_매출_비율'].head(10).tolist())
    else:
        print("'주말_매출_비율' column not found!")
        
    # Check if we can calculate it manually
    if '주말_매출_금액' in latest_df.columns and '당월_매출_금액' in latest_df.columns:
        print("Calculating manually...")
        latest_df['calc_ratio'] = latest_df['주말_매출_금액'] / latest_df['당월_매출_금액'] * 100
        print(latest_df['calc_ratio'].describe())

except Exception as e:
    print(f"Error: {e}")
