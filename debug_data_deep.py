import pandas as pd

file_path = 'public/sales.csv'

try:
    df = pd.read_csv(file_path, encoding='euc-kr')
    print("Columns (repr):", [repr(c) for c in df.columns])
    
    # Find latest YQ
    df['YQ'] = df.apply(lambda x: int(str(x['기준_년_코드']) + str(x['기준_분기_코드'])), axis=1)
    max_yq = df['YQ'].max()
    latest_df = df[df['YQ'] == max_yq]
    
    print(f"Latest YQ: {max_yq}")
    
    # Check for Weekend Sales Amount
    weekend_amt_col = [c for c in df.columns if '주말_매출_금액' in c]
    total_amt_col = [c for c in df.columns if '당월_매출_금액' in c]
    
    print(f"Weekend Amt Cols: {weekend_amt_col}")
    print(f"Total Amt Cols: {total_amt_col}")
    
    if weekend_amt_col and total_amt_col:
        w_col = weekend_amt_col[0]
        t_col = total_amt_col[0]
        
        print("Sample Weekend Amounts:", latest_df[w_col].head(5).tolist())
        print("Sample Total Amounts:", latest_df[t_col].head(5).tolist())
        
        # Calculate ratio
        latest_df['calc_ratio'] = latest_df[w_col] / latest_df[t_col] * 100
        print("Calculated Ratio Stats:")
        print(latest_df['calc_ratio'].describe())

except Exception as e:
    print(f"Error: {e}")
