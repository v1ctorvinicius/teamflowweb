import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor para token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Interceptor para refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken
                    })
                    localStorage.setItem('access_token', response.data.accessToken)
                    error.config.headers.Authorization = `Bearer ${response.data.accessToken}`
                    return axios(error.config)
                } catch {
                    localStorage.clear()
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)