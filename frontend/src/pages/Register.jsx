// frontend/src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { saveAuth } from '../auth';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        rollNumber: '',
        department: '',
        cgpa: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Register the user
            await api.post('/auth/register', {
                full_name: formData.fullName,
                roll_number: formData.rollNumber.toUpperCase(),
                department: formData.department,
                cgpa: parseFloat(formData.cgpa),
                password: formData.password
            });

            // 2. Auto-login immediately after successful registration
            const loginRes = await api.post('/auth/login', {
                roll_number: formData.rollNumber.toUpperCase(),
                password: formData.password
            });

            saveAuth(loginRes.data.token, loginRes.data.student);
            navigate('/home');
            
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-cp-dark px-4 py-12">
            <div className="w-full max-w-md bg-[#241710] p-8 rounded-xl border border-cp-card shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="font-gothic text-5xl text-cp-hover mb-2">Register</h1>
                    <p className="text-cp-text opacity-70">Join Course Predictor</p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-cp-accent mb-1">Full Name</label>
                        <input type="text" name="fullName" required className="w-full bg-cp-dark border border-cp-card rounded px-3 py-2 text-cp-text focus:outline-none focus:border-cp-hover" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-cp-accent mb-1">Roll Number</label>
                        <input type="text" name="rollNumber" required placeholder="CS24BTECH11052" className="w-full bg-cp-dark border border-cp-card rounded px-3 py-2 text-cp-text focus:outline-none focus:border-cp-hover uppercase" onChange={handleChange} />
                        <p className="text-xs text-cp-text opacity-50 mt-1">Email auto-generated as rollnumber@iith.ac.in</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-bold text-cp-accent mb-1">Department</label>
                            <input type="text" name="department" required placeholder="e.g. CS" className="w-full bg-cp-dark border border-cp-card rounded px-3 py-2 text-cp-text focus:outline-none focus:border-cp-hover" onChange={handleChange} />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-bold text-cp-accent mb-1">CGPA</label>
                            <input type="number" name="cgpa" step="0.01" min="0" max="10" required placeholder="e.g. 8.5" className="w-full bg-cp-dark border border-cp-card rounded px-3 py-2 text-cp-text focus:outline-none focus:border-cp-hover" onChange={handleChange} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-cp-accent mb-1">Password</label>
                        <input type="password" name="password" required minLength="6" className="w-full bg-cp-dark border border-cp-card rounded px-3 py-2 text-cp-text focus:outline-none focus:border-cp-hover" onChange={handleChange} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 font-bold text-white bg-cp-primary rounded transition-all hover:bg-cp-hover disabled:opacity-50 mt-6">
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-cp-text opacity-70">
                    Already have an account? <Link to="/login" className="text-cp-accent hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}