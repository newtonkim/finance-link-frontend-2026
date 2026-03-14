import axios from 'axios'

const baseURL = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000/api/v1'

export const apiClient = axios.create({
  baseURL:"http://127.0.0.1:8000/api/v1",
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  

  return config
})
