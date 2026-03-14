import axios from 'axios'

const baseURL = import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000/api/v1'

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// apiClient.interceptors.response.use((config) => {
//   console.log("API Request Config:", {
//     method: config.method?.toUpperCase(),
//     baseURL: config.baseURL,
//     url: config.url,
//     params: config.params,
//     data: config.data,
//     headers: config.headers,
//   });
//   return config;
// });