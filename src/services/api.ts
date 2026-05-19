import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})


api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})


let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
    refreshSubscribers.forEach(cb => cb(token))
    refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
    refreshSubscribers.push(cb)
}


const PUBLIC_ROUTES = [
    '/products',
    '/products/featured',
    '/products/categories',
    '/products/by-category',
    '/products/slug/',
    '/clubs',
    '/health'
]


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        
        if (!error.response) {
            console.error('Network error or server offline:', error.message)
            return Promise.reject(error)
        }

        
        const isPublicRoute = PUBLIC_ROUTES.some(route => 
            originalRequest.url?.includes(route)
        )

        
        if (isPublicRoute) {
            
            if (error.response?.status === 401) {
                console.warn('Public route returned 401:', originalRequest.url)
                return Promise.reject(error)
            }
            return Promise.reject(error)
        }

        
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error)
        }

        
        if (originalRequest.url?.includes('/auth/refresh')) {
            localStorage.clear()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        originalRequest._retry = true

        
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

                
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                isRefreshing = false
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        
        return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`
                resolve(api(originalRequest))
            })
        })
    }
)

export default api