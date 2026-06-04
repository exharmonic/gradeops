import React, { useContext, createContext, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem('gradeops_token') || null);
    const [user, setUser] = useState(null);

    const login = (newToken) => {
        localStorage.setItem('gradeops_token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.setItem('gradeops_token', null);
        setToken(null);
        setUser(null);
    };
    return (
        <UserContext.Provider value={{ token, user, setUser, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);