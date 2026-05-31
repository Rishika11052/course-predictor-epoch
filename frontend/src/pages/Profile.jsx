// frontend/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import api from '../api';
import { getStudent, logout } from '../auth';
import { Link } from 'react-router-dom';

export default function Profile() {
    const student = getStudent();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    // frontend/src/pages/Profile.jsx

    useEffect(() => {
        let active = true; // Simple flag instead of AbortController

        const fetchRecs = async () => {
            if (!student?.id) return;
            setLoading(true);
            
            try {
                console.log("🚀 Sending request to Go backend for:", student.id);
                const res = await api.get(`/api/recommend/${student.id}`);
                
                if (active) {
                    console.log("✅ Backend responded with:", res.data);
                    
                    if (!res.data || res.data.length === 0) {
                        console.warn("⚠️ Data is empty! Check if Postgres has courses and reviews.");
                    }
                    
                    setRecommendations(res.data || []);
                    setLoading(false);
                }
            } catch (err) {
                if (active) {
                    console.error("❌ Real Error:", err);
                    setLoading(false);
                }
            }
        };

        fetchRecs();

        return () => { active = false; }; // Clean up flag
    }, [student?.id]);

    const getGradeColor = (grade) => {
        if (grade.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200';
        if (grade.startsWith('B')) return 'text-orange-600 bg-orange-50 border-orange-200';
        if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="min-h-screen bg-cp-cream pb-20">
            {/* Navbar */}
            <nav className="bg-cp-green-light border-b-4 border-cp-dark px-8 py-4 flex justify-between items-center shadow-sm mb-10">
                <Link to="/home" className="font-gothic text-3xl text-cp-green font-bold hover:text-cp-primary transition-colors">Course Predictor</Link>
                <div className="flex items-center gap-6">
                    <Link to="/home" className="font-black text-cp-dark hover:text-cp-primary uppercase text-sm">Home</Link>
                    <Link to="/courses" className="font-black text-cp-dark hover:text-cp-primary uppercase text-sm">Courses</Link>
                    <button onClick={logout} className="px-4 py-2 bg-cp-primary text-white font-black rounded-lg border-2 border-cp-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase">Logout</button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6">
                {/* Profile Header Section */}
                <div className="bg-cp-dark rounded-3xl p-10 mb-12 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
                    {/* Decorative Circle */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-cp-primary opacity-20 rounded-full"></div>
                    
                    <div className="w-32 h-32 rounded-full bg-cp-accent flex items-center justify-center text-5xl font-black text-cp-dark border-4 border-white z-10">
                        {student?.name ? student.name[0] : 'S'}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left z-10 text-white">
                        <h1 className="text-5xl font-display font-black mb-2 tracking-tighter">{student?.name}</h1>
                        <p className="text-xl font-bold text-cp-accent mb-4">{student?.department} Department</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                                <span className="text-gray-400 font-bold mr-2 uppercase text-xs">Roll Number</span>
                                <span className="font-black tracking-widest">{student?.id}</span>
                            </div>
                            <div className="bg-cp-primary/80 px-4 py-2 rounded-xl border border-white/20">
                                <span className="text-white/60 font-bold mr-2 uppercase text-xs">Current CGPA</span>
                                <span className="font-black text-white">{student?.cgpa}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations Header */}
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="font-display text-4xl font-black text-cp-dark">YOUR PICKS</h2>
                    <div className="h-1 flex-1 bg-cp-dark/10 rounded-full"></div>
                    <span className="text-[10px] font-black bg-cp-primary text-white px-3 py-1 rounded-full uppercase tracking-widest">
                        ML Engine v1.0
                    </span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-64 bg-white border-4 border-gray-100 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : recommendations && recommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {recommendations.map((rec, idx) => (
                            <div key={idx} className="bg-white border-4 border-cp-dark rounded-3xl p-8 relative group hover:shadow-[12px_12px_0px_0px_#F7C767] transition-all">
                                {/* Rank Number */}
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-cp-dark text-white rounded-xl flex items-center justify-center font-black text-xl border-4 border-white rotate-[-10deg]">
                                    {idx + 1}
                                </div>

                                <div className="mb-6">
                                    <span className="text-xs font-black text-cp-primary uppercase tracking-widest">{rec.code}</span>
                                    <h3 className="text-2xl font-black text-cp-dark leading-none mt-1">{rec.name}</h3>
                                    <p className="font-bold opacity-40 mt-1">Instructor: {rec.instructor}</p>
                                </div>

                                <div className="flex items-center gap-6 mb-6">
                                    <div className={`px-5 py-3 rounded-2xl border-4 font-black text-center ${getGradeColor(rec.predicted_grade)}`}>
                                        <div className="text-[10px] uppercase opacity-60 leading-none mb-1">Likely Grade</div>
                                        <div className="text-3xl">{rec.predicted_grade}</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-[10px] font-black mb-1 uppercase">
                                            <span>Compatibility</span>
                                            <span>{Math.round(rec.score * 20)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                                            <div className="bg-cp-accent h-full transition-all duration-1000" style={{ width: `${(rec.score/5)*100}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-cp-cream p-4 rounded-2xl border-2 border-dashed border-cp-dark/20 relative">
                                    <span className="absolute -top-3 left-4 bg-cp-cream px-2 text-[10px] font-black text-cp-dark/40 uppercase">System Logic</span>
                                    <p className="text-sm font-medium text-cp-dark/70 italic leading-relaxed">
                                        "{rec.reason}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white border-4 border-dashed border-cp-dark/10 rounded-3xl">
                        <div className="text-6xl mb-4">🛰️</div>
                        <h3 className="text-2xl font-black text-cp-dark/30">CALIBRATING RECOMMENDATIONS...</h3>
                        <p className="font-bold text-cp-dark/20 max-w-sm mx-auto">
                            Submit at least one course review to help the algorithm understand your academic profile.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}