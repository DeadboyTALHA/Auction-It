/**
 * Authentication Context
 * Stores login state and provides it to the whole app
 * Author: Talha
 */

import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context object
const AuthContext = createContext(null);

// AuthProvider wraps the whole app and gives all components access to auth state
export const AuthProvider = ({ children }) => {
    // user: stores user info if logged in, null if not
    const [user, setUser] = useState(null);
    // token: the JWT token stored in localStorage
    const [token, setToken] = useState(null);
    // loading: true while checking if user is already logged in
    const [loading, setLoading] = useState(true);

    // On first load, check if there is a saved token in browser storage
    useEffect(() => {
        const savedToken = localStorage.getItem("auction_token");
        const savedUser = localStorage.getItem("auction_user");
        if (savedToken && savedUser) {
            // Restore login state from previous session
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false); // Done checking
    }, []);

    // login: called after successful login/register API call
    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        // Save to localStorage so user stays logged in after refresh
        localStorage.setItem("auction_token", authToken);
        localStorage.setItem("auction_user", JSON.stringify(userData));
    };

    // logout: clears all auth state
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auction_token");
        localStorage.removeItem("auction_user");
    };

    // isAuthenticated: true if user is logged in
    const isAuthenticated = !!token;

    // isSeller: true if user has seller or admin role
    const isSeller = user && (user.role === "seller" || user.role === "admin");

    // isAdmin: true only for admin users
    const isAdmin = user && user.role === "admin";

    // Provide all these values to child components
    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated, isSeller, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook — components call useAuth() to access auth state
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside AuthProvider");
    return context;
};

export default AuthContext;
