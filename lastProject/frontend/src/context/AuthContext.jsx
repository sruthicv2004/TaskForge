import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api, { setToken } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (username, password) => {
        try {
            const response = await api.post('login/', { username, password });
            const { access, refresh, role, user_id } = response.data;
            setToken(access);
            localStorage.setItem('refresh_token', refresh);
            
            const userData = { username, role, id: user_id };
            localStorage.setItem('user_data', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.detail || 'Login failed' };
        }
    }, []);

    const register = useCallback(async (username, email, password, role = 'user') => {
        try {
            await api.post('register/', { username, email, password, role });
            return await login(username, password);
        } catch (error) {
            return { success: false, message: error.response?.data?.username?.[0] || 'Registration failed' };
        }
    }, [login]);

    const logout = useCallback(() => {
        setToken(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setUser(null);
    }, []);

    const contextValue = useMemo(
        () => ({ user, login, register, logout, loading }),
        [user, login, register, logout, loading]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
