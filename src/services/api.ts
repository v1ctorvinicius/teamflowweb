import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Fila para requisições pendentes durante o refresh
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
    refreshSubscribers.forEach(cb => cb(token))
    refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
    refreshSubscribers.push(cb)
}

// Interceptor de response com refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Se não for 401 ou já tentou refresh, rejeita
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error)
        }

        // Evita loop infinito no endpoint /auth/refresh
        if (originalRequest.url?.includes('/auth/refresh')) {
            localStorage.clear()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        originalRequest._retry = true

        // Se já está fazendo refresh, aguarda na fila
        if (!isRefreshing) {
            isRefreshing = true

            try {
                const refreshToken = localStorage.getItem('refresh_token')
                if (!refreshToken) {
                    throw new Error('No refresh token')
                }

                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken
                })

                const { accessToken, refreshToken: newRefreshToken } = response.data.data

                localStorage.setItem('access_token', accessToken)
                localStorage.setItem('refresh_token', newRefreshToken)

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

                onRefreshed(accessToken)
                isRefreshing = false

                // Reexecuta a requisição original
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                isRefreshing = false
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        // Aguarda o refresh terminar e depois reexecuta
        return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(api(originalRequest))
            })
        })
    }
)

export default api