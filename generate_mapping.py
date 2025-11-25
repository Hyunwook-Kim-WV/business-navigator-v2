import pandas as pd
import json
import os

def generate_mapping():
    print("Loading Gu data from sales.csv...")
    # 1. Get Gu Code -> Gu Name map
    try:
        df_gu = pd.read_csv('public/sales.csv', encoding='cp949')
    except:
        df_gu = pd.read_csv('public/sales.csv', encoding='euc-kr')
        
    gu_map = {}
    for _, row in df_gu[['자치구_코드', '자치구_코드_명']].drop_duplicates().iterrows():
        gu_map[str(row['자치구_코드'])] = row['자치구_코드_명']
        
    print(f"Found {len(gu_map)} districts.")

    print("Loading Dong data from store_dong.csv...")
    # 2. Get Dong Code -> Dong Name map
    file_path = 'public/서울시 상권분석서비스(점포-행정동).csv'
    try:
        df_dong = pd.read_csv(file_path, encoding='cp949')
    except:
        df_dong = pd.read_csv(file_path, encoding='euc-kr')
        
    mapping = {}
    
    for _, row in df_dong[['행정동_코드', '행정동_코드_명']].drop_duplicates().iterrows():
        dong_code = str(row['행정동_코드'])
        dong_name = row['행정동_코드_명']
        
        # Gu code is the first 5 digits
        gu_code = dong_code[:5]
        
        if gu_code in gu_map:
            gu_name = gu_map[gu_code]
            
            if gu_name not in mapping:
                mapping[gu_name] = []
            
            # Check if already added
            if not any(d['code'] == dong_code for d in mapping[gu_name]):
                mapping[gu_name].append({
                    'code': dong_code,
                    'name': dong_name
                })
        else:
            print(f"Warning: Gu code {gu_code} for Dong {dong_name} ({dong_code}) not found in sales.csv")

    # Sort for consistency
    sorted_mapping = {}
    for gu in sorted(mapping.keys()):
        sorted_mapping[gu] = sorted(mapping[gu], key=lambda x: x['name'])

    # 3. Write to JS file
    output_path = 'src/data/seoul_gu_dong_mapping.js'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("export const GU_DONG_MAPPING = ")
        json.dump(sorted_mapping, f, ensure_ascii=False, indent=4)
        f.write(";")
        
    print(f"Mapping saved to {output_path}")

if __name__ == "__main__":
    generate_mapping()
