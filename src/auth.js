
import { apiRequest } from './apiClient.js';

export function isAuthenticated() {
    return !!sessionStorage.getItem('auth_token');
}

export async function login(email, password) {
    const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    sessionStorage.setItem('auth_token', data.token);
    sessionStorage.setItem('user_email', data.email);
    return data;
}

export async function register(email, password) {
    const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    sessionStorage.setItem('auth_token', data.token);
    sessionStorage.setItem('user_email', data.email);
    return data;
}

export function logout() {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_email');
}