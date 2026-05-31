// frontend/src/auth.js

// Save token and student object upon successful login
export const saveAuth = (token, student) => {
    localStorage.setItem('cp_token', token);
    localStorage.setItem('cp_student', JSON.stringify(student));
};

// Clear session on logout
export const logout = () => {
    localStorage.removeItem('cp_token');
    localStorage.removeItem('cp_student');
    // Force a reload to clear any cached states and kick them to the login screen
    window.location.href = '/login'; 
};

// Check if a user is currently logged in
export const isLoggedIn = () => {
    return !!localStorage.getItem('cp_token');
};

// Retrieve the logged-in student's details
export const getStudent = () => {
    const studentStr = localStorage.getItem('cp_student');
    if (!studentStr) return null;
    try {
        return JSON.parse(studentStr);
    } catch (e) {
        return null;
    }
};