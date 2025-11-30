import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.0.13:8000/api',
  //baseURL: 'http://192.168.0.13:8000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
