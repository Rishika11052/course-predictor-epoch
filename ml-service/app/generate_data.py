# ml-service/app/generate_data.py

# import pandas as pd
# import numpy as np

# def generate_synthetic_data(num_records=3000):
#     np.random.seed(42)
    
#     # 1. Base Feature: CGPA (Normal distribution, clipped 5-10)
#     cgpa = np.clip(np.random.normal(7.5, 1.0, num_records), 5.0, 10.0)
    
#     # 2. Correlated Features
#     study_hours = np.clip(0.8 * cgpa + np.random.normal(0, 3.0, num_records), 1.0, 12.0)
    
#     # We add more noise to attendance so the model can't rely on it as a perfect proxy for CGPA
#     attendance_base = (cgpa / 10.0) * 0.4 + (study_hours / 12.0) * 0.4
#     attendance = np.clip(attendance_base + np.random.normal(0, 0.2, num_records), 0.0, 1.0)
    
#     past_performance = np.clip(0.7 * cgpa + 2.0 + np.random.normal(0, 1.5, num_records), 4.0, 10.0)
    
#     # 3. Independent Course Feature
#     course_difficulty = np.clip(np.random.normal(3.0, 1.0, num_records), 1.0, 5.0)
#     course_id = np.random.randint(1, 12, num_records)
    
#     # 4. Target Variable: Grade (Heavily weighted towards CGPA now)
#     # 4. Target Variable: Grade (Precision Adjusted)
#     grade_base = (
#         0.60 * cgpa +                           # Dropped from 70% to 60%
#         0.15 * (study_hours / 12) * 10 +        # Increased from 5% to 15%
#         0.05 * attendance * 10 +                # Stays 5%
#         0.10 * past_performance -               # Stays 10%
#         0.10 * course_difficulty * 2            # Stays 10%
#     )
    
#     grade = np.clip(grade_base + np.random.normal(0, 0.5, num_records), 0.0, 10.0)
    
#     # Create DataFrame
#     df = pd.DataFrame({
#         'course_id': course_id,
#         'cgpa': cgpa,
#         'study_hours': study_hours,
#         'attendance': attendance,
#         'course_difficulty': course_difficulty,
#         'past_course_performance': past_performance,
#         'grade': grade
#     })
    
#     df.to_csv('app/training_data.csv', index=False)
#     print(f"✅ Successfully generated {num_records} synthetic records in app/training_data.csv")

# if __name__ == "__main__":
#     generate_synthetic_data()

import psycopg2
import pandas as pd
import numpy as np
import warnings

# Suppress the pandas SQLAlchemy warning for a clean terminal
warnings.filterwarnings('ignore', category=UserWarning)

# --- DATABASE CONFIG ---
# Use 127.0.0.1 instead of localhost to avoid 6-second DNS delays
DB_PARAMS = {
    "dbname": "course_predictor_db",
    "user": "postgres",
    "password": "12345678", 
    "host": "127.0.0.1",
    "port": "5432"
}

def get_db_connection():
    return psycopg2.connect(**DB_PARAMS)

def extract_data():
    conn = get_db_connection()

    query = """
        SELECT
            s.cgpa,
            COALESCE(cr.avg_clarity, 3.0) as clarity,
            COALESCE(cr.avg_workload, 3.0) as workload,
            COALESCE(cr.avg_grading_strictness, 3.0) as strictness,
            COALESCE(cr.avg_eval_fairness, 3.0) as fairness,
            sr.grade_received as historical_grade
        FROM students s
        JOIN survey_responses sr ON s.id = sr.student_id
        JOIN course_ratings cr ON sr.course_instructor_id = cr.course_instructor_id
        WHERE sr.question_id = 1;
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    if df.empty:
        print("No data found for training.")
        return
    
    print(f"Successfully extracted {len(df)} record from DB.")

    output_path = 'app/training_data_from_DB.csv'
    df.to_csv(output_path, index=False)
    print(f"Data Saved to {output_path} .")

if __name__ == "__main__":
    extract_data()