const API_BASE = 'http://localhost:5000';

export async function apiRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.error) errorMessage = errorData.error;
        } catch (_) { /* ignore */ }
        throw new Error(errorMessage);
    }

    return response.json();
}