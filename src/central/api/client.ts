import axios from 'axios'

const baseURL = import.meta.env.VITE_BACKEND_URL || '/api/v1'


export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  console.log("=====cenrat1");
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