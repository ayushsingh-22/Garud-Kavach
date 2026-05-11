import React, { createContext, useState, useEffect, useContext } from 'react';
import apiFetch from '../utils/apiFetch';
import { getRefreshToken, clearTokens } from '../utils/tokenStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            // Don't hit the server when we're already on a public auth page —
            // there's no session cookie to validate and it causes a redirect loop.
            const authPaths = ['/login', '/signup', '/register'];
            if (authPaths.some((p) => window.location.pathname.startsWith(p))) {
                setLoading(false);
                return;
            }
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
            await apiFetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: getRefreshToken() }),
            });
        } finally {
            clearTokens();
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
