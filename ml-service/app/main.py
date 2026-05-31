# ml-service/app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
import pandas as pd
import numpy as np
import joblib
import os

app = FastAPI(title="Course Predictor ML Service")

# Load model once at startup
MODEL_PATH = 'app/grade_model.pkl'
rf_model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

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

class RecommendRequest(BaseModel):
    student_id: str
    cgpa: float

@app.get("/health")
def health():
    return {"status": "running", "model": rf_model is not None}

@app.post("/recommend")
def recommend_courses(req: RecommendRequest):
    if not rf_model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    conn = get_db_connection()
    try:
        # 1. Fetch data in bulk to avoid loops
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Get All Courses
            cur.execute("""
                SELECT ci.id as ci_id, c.id as c_id, c.code, c.name, i.name as instructor,
                       COALESCE(cr.avg_clarity, 3.0) as clarity, 
                       COALESCE(cr.avg_workload, 3.0) as workload,
                       COALESCE(cr.avg_grading_strictness, 3.0) as strictness,
                       COALESCE(cr.avg_eval_fairness, 3.0) as fairness,
                       COALESCE(cr.avg_overall, 3.0) as overall
                FROM course_instructor ci
                JOIN courses c ON ci.course_id = c.id
                JOIN instructors i ON ci.instructor_id = i.id
                LEFT JOIN course_ratings cr ON ci.id = cr.course_instructor_id
            """)
            all_courses = cur.fetchall()

            # Get Taken Courses
            cur.execute("SELECT course_id FROM user_activity WHERE student_id = %s AND action = 'enrolled'", (req.student_id,))
            taken = {r[0] for r in cur.fetchall()}

            # Get User Activities for KNN
            cur.execute("SELECT student_id, course_id FROM user_activity")
            act_df = pd.DataFrame(cur.fetchall(), columns=['uid', 'cid'])
            
            # Get All Reviews for KNN
            cur.execute("SELECT sr.student_id as uid, sr.course_instructor_id as ci_id, sr.score, s.cgpa FROM survey_responses sr JOIN students s ON sr.student_id = s.id WHERE sr.question_id = 4")
            rev_df = pd.DataFrame(cur.fetchall(), columns=['uid', 'ci_id', 'score', 'cgpa'])
            rev_df['cgpa'] = rev_df['cgpa'].astype(float)

        # 2. Process Recommendations
        my_activities = set(act_df[act_df['uid'] == req.student_id]['cid'])

        valid_courses = []
        feature_rows = []

        for c in all_courses:
            if c['c_id'] in taken: continue
            if float(c['overall']) < 1.5: continue # Basic quality filter (Rule based filtering)

            # --- KNN LOGIC (Optimized) ---
            course_revs = rev_df[rev_df['ci_id'] == c['ci_id']]
            if not course_revs.empty:
                # Vectorized similarity calculation
                course_revs = course_revs.copy()
                course_revs['sim'] = 1.0 / (1.0 + abs(req.cgpa - course_revs['cgpa']))
                
                # Top 5 similar students
                top_sim = course_revs.sort_values('sim', ascending=False).head(5)
                collab_score = np.average(top_sim['score'], weights=top_sim['sim'])
            else:
                collab_score = 3.0

            # Save metadata and features
            valid_courses.append({'course': c, 'collab_score': collab_score})
            feature_rows.append({
                'cgpa': float(req.cgpa),
                'clarity': float(c['clarity']), 
                'workload': float(c['workload']), 
                'strictness': float(c['strictness']), 
                'fairness': float(c['fairness'])
            })

        if not valid_courses:
            return []
        
        # Batch Processsing
        features_df = pd.DataFrame(feature_rows)
        
        # predict everything using the dataframe of features
        predictions = rf_model.predict(features_df)

        # Assemble results :

        recs = []

        for vc, pred_num in zip(valid_courses, predictions):

            c = vc['course']
            collab_score = vc['collab_score']
            pred_num = float(pred_num)

            # 1. Internal ML Scale (10 to 3) for Granularity
            if pred_num >= 9.5: 
                grade, ml_point = "A+", 10
            elif pred_num >= 8.5: 
                grade, ml_point = "A", 9
            elif pred_num >= 7.5: 
                grade, ml_point = "A-", 8
            elif pred_num >= 6.5: 
                grade, ml_point = "B", 7
            elif pred_num >= 5.5: 
                grade, ml_point = "B-", 6
            elif pred_num >= 4.5: 
                grade, ml_point = "C", 5
            elif pred_num >= 3.5: 
                grade, ml_point = "C-", 4
            else: 
                grade, ml_point = "D", 3

            # 2. Translate to Official College CGPA Scale
            if grade in ["A+", "A"]:
                official_point = 10
            else:
                official_point = ml_point + 1 # Shifts the 8 (A-) up to a 9, etc.

            # 2. The "Do No Harm" Filter
            # Target is the floor of their CGPA. (e.g., 8.35 -> 8. 9.88 -> 9)
            # 2. The "Do No Harm" Filter (MODIFIED FOR DEBUGGING)
            target_points = int(req.cgpa)
            
            # WE ARE COMMENTING OUT THE CONTINUE SO IT DOESN'T HIDE COURSES
            # if points < target_points:
            #     continue

            # 3. Dynamic Reasons
            if official_point < target_points:
                reason = f"⚠️ DANGER: Model predicts {grade} ({official_point} pts) which drops your CGPA!"
            elif official_point > target_points:
                reason = f"Strong potential for a CGPA boost (Predicted: {official_point} pts)."
            elif official_point == target_points:
                reason = f"Safe choice to maintain your {req.cgpa} standing."
            else:
                reason = "Highly compatible with your academic profile."

            recs.append({
                "code": c['code'], "name": c['name'], "instructor": c['instructor'],
                "avg_overall": float(c['overall']), "predicted_grade": grade,
                "score": float(round((collab_score * 0.4 + float(c['overall']) * 0.6), 2)),
                "reason": reason
            })

        # Sort the recs
        recs.sort(key=lambda x: x['score'], reverse=True)

        return recs[:6]

    except Exception as e:
        print(f"ERROR: {e}")
        return []
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)