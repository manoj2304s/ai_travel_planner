export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('trao_token');
};

export const setToken = (token: string): void => {
    localStorage.setItem('trao_token', token);
};

export const removeToken = (): void => {
    localStorage.removeItem('trao_token');
};

export const getUser = (): { id: string; name: string; email: string } | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('trao_user');
    return user ? JSON.parse(user) : null;
};

export const setUser = (user: { id: string; name: string; email: string }): void => {
    localStorage.setItem('trao_user', JSON.stringify(user));
};

export const removeUser = (): void => {
    localStorage.removeItem('trao_user');
};

export const logout = (): void => {
    removeToken();
    removeUser();
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};