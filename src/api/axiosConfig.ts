import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

// const API_BASE_URL = 'https://kefu.5ok.co/api/v1';
const API_BASE_URL = 'http://111.223.37.162:7788';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    // 直连IP的请求时，会用上写死的userId
    // 当请求域名的url，走nginx会通过authelia_session解析出用户对应的userId并覆写这个X-User-Id请求头
    config.headers['X-User-Id'] = '1';
    
    // You can add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError): Promise<AxiosError> => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
