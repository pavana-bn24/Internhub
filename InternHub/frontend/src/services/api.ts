import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:8000/api/v1'

const API = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
})

export const getDownloadUrl = (filePath: string) =>
  `${API_BASE.replace('/api/v1', '')}/${filePath}`

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Prevent browser HTTP caching of GET responses
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() }
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please login again.')
        setTimeout(() => { window.location.href = '/login' }, 1500)
      }
    }
    return Promise.reject(error)
  }
)

export default API
