import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Automatically set a Guest user to bypass login
        const storedUser = localStorage.getItem('dsa_mentor_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // Provide a default guest user for seamless experience
            const guestUser = { id: 'guest_123', username: 'Guest', email: 'guest@example.com' };
            setUser(guestUser);
            localStorage.setItem('dsa_mentor_user', JSON.stringify(guestUser));
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('dsa_mentor_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dsa_mentor_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
