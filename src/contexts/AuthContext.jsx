import React, { createContext, useState, useEffect, useContext } from 'react';
import apiFetch from '../utils/apiFetch';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await apiFetch('/api/check-login');
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    const logout = async () => {
        try {
            await apiFetch('/api/logout', { method: 'POST' });
        } finally {
            setUser(null);
            // Redirect to home or login page after logout
            window.location.href = '/login';
        }
    };

    const value = { user, setUser, loading, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
