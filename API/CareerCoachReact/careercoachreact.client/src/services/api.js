import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5021/api',
})

// Automatically add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('careercoach-token')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

export default api
