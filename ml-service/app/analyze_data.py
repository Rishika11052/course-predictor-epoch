# ml-service/app/analyze_data.py
import pandas as pd
import numpy as np

def analyze_dataset():

    print("Analyzing Generated Dummy Data...")

    try:
        df = pd.read_csv('app/training_data_from_DB.csv')
    except FileNotFoundError:
        print("ERROR: app/training_data_from_DB.csv not found.")
        return
    
    print(f"Total records analyzed: {len(df)}:")

    # 1. CORRELATION ANALYSIS
    # In the real world, CGPA correlation to future grades is usually around 0.50 to 0.75.
    # If this is below 0.20, our data is too noisy (random).
    # If it is 0.95+, we "cheesed" it too much.
    print("\nCorrelation with Final Grade (1.0 is perfect, 0 is random noise):")
    correlations = df.corr()['historical_grade'].sort_values(ascending=False)
    for index, value in correlations.items():
        print(f"   - {index}: {value:.4f}")

    # 2. CGPA REALITY CHECK
    # Do top students actually get top grades in our data?
    print("\n🎓 Average Grade by CGPA Bracket:")
    df['cgpa_bracket'] = pd.cut(
        df['cgpa'], 
        bins=[5, 6, 7, 8, 9, 10], 
        labels=['5.0 - 6.0', '6.0 - 7.0', '7.0 - 8.0', '8.0 - 9.0', '9.0 - 10.0']
    )
    # Calculate the mean grade and how wildly it swings (Standard Deviation)
    bracket_stats = df.groupby('cgpa_bracket', observed=False)['historical_grade'].agg(['mean', 'std', 'count'])
    print(bracket_stats)

    print("\n3. Feature Impact on Grades:")
    features = ['clarity', 'workload', 'strictness', 'fairness']
    
    for feat in features:
        print(f"\n--- Average Grade by {feat.capitalize()} ---")
        df[f'{feat}_bracket'] = pd.cut(
            df[feat], 
            bins=[0, 2, 3, 4, 5], 
            # We group the 1-5 scale into logical buckets
            labels=['Low (0-2)', 'Med (2-3)', 'High (3-4)', 'Max (4-5)']
        )
        print(df.groupby(f'{feat}_bracket', observed=False)['historical_grade'].agg(['mean', 'count']))

if __name__ == "__main__":
    analyze_dataset()