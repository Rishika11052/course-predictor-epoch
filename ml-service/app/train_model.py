# ml-service/app/train_model.py


# import pandas as pd
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.model_selection import train_test_split
# from sklearn.metrics import mean_absolute_error, r2_score
# import joblib
# import os

# def train_and_save_model():
#     print("Loading data...")
#     df = pd.read_csv('app/training_data.csv')
    
#     # Define features and target
#     features = ['cgpa', 'study_hours', 'attendance', 'course_difficulty', 'past_course_performance']
#     X = df[features]
#     y = df['grade']
    
#     # Train/Test Split (80/20)
#     X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
#     print("Training Random Forest Model (this may take a few seconds)...")
#     model = RandomForestRegressor(
#         n_estimators=100, 
#         max_depth=10, 
#         min_samples_split=5, 
#         random_state=42
#     )
    
#     model.fit(X_train, y_train)
    
#     # Evaluate
#     predictions = model.predict(X_test)
#     mae = mean_absolute_error(y_test, predictions)
#     r2 = r2_score(y_test, predictions)
    
#     print(f"\n📊 Model Performance:")
#     print(f"Mean Absolute Error (MAE): {mae:.4f} (Expected ~0.43)")
#     print(f"R-squared (R²): {r2:.4f} (Expected ~0.69)")
    
#     print("\n🔍 Feature Importances:")
#     importances = model.feature_importances_
#     for feature, imp in zip(features, importances):
#         print(f"- {feature}: {imp*100:.1f}%")
        
#     # Save the model
#     joblib.dump(model, 'app/grade_model.pkl')
#     print("\n✅ Model saved successfully as app/grade_model.pkl")

# if __name__ == "__main__":
#     train_and_save_model()


import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def train_and_save_model():
    print("Loading data...")
    df = pd.read_csv('app/training_data_from_DB.csv')
    
    # Define features and target
    features = ['cgpa', 'clarity', 'workload', 'strictness', 'fairness']

    for col in features + ['historical_grade']:
        if col not in df.columns:
            print(f"Error in training model. Missing column {col} in training data.")
            return
        
    X = df[features]
    y = df['historical_grade']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest Model (this may take a few seconds)...")

    model = RandomForestRegressor(
        n_estimators=100, 
        max_depth=10, 
        min_samples_split=5, 
        random_state=42
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print(f"\n📊 True Model Performance:")
    print(f"Mean Absolute Error (MAE): {mae:.4f} grade points")
    print(f"R-squared (R²): {r2:.4f} (1.0 is perfect)")

    print("\n🔍 Feature Importances (What the AI actually cares about):")
    importances = model.feature_importances_
    for feature, imp in zip(features, importances):
        print(f"- {feature}: {imp*100:.1f}%")

    output_filename = 'app/grade_model.pkl'
    joblib.dump(model, output_filename)
    print(f"\nModel saved securely to {output_filename}")

if __name__ == "__main__":
    train_and_save_model()