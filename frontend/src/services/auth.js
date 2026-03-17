import api from "./api";

export const registerUser = async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
};

export const loginUser = async (credentials) => {
    const res = await api.post("/auth/login", credentials);
    // Store token and user in localStorage on successful login
    if (res.data.token) {
        localStorage.setItem("auction_token", res.data.token);
        localStorage.setItem("auction_user", JSON.stringify(res.data.user));
    }
    return res.data;
};

export const logoutUser = () => {
    localStorage.removeItem("auction_token");
    localStorage.removeItem("auction_user");
    window.location.href = "/login";
};

export const getCurrentUser = () => {
    const user = localStorage.getItem("auction_user");
    return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => {
    return !!localStorage.getItem("auction_token");
};
