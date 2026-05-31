// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { saveAuth } from '../auth';

export default function Login() {
    const navigate = useNavigate();
    const [rollNumber, setRollNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', {
                roll_number: rollNumber.toUpperCase(),
                password: password
            });
            // Save to localStorage
            saveAuth(res.data.token, res.data.student);
            // Redirect to Home
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-cp-dark px-4">
            <div className="w-full max-w-md bg-[#241710] p-8 rounded-xl border border-cp-card shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="font-gothic text-5xl text-cp-hover mb-2">Login</h1>
                    <p className="text-cp-text opacity-70">Welcome back to Course Predictor</p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-cp-accent mb-2">Roll Number</label>
                        <input 
                            type="text" 
                            required
                            placeholder="e.g. CS24BTECH11052"
                            className="w-full bg-cp-dark border border-cp-card rounded px-4 py-3 text-cp-text focus:outline-none focus:border-cp-hover uppercase transition-colors"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-cp-accent mb-2">Password</label>
                        <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            className="w-full bg-cp-dark border border-cp-card rounded px-4 py-3 text-cp-text focus:outline-none focus:border-cp-hover transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 font-bold text-white bg-cp-primary rounded transition-all hover:bg-cp-hover disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-cp-text opacity-70">
                    Don't have an account? <Link to="/register" className="text-cp-accent hover:underline">Register here</Link>
                </p>
            </div>
        </div>
    );
}   