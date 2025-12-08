import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.26.9.173:8000/api',
  //baseURL: 'http://192.168.0.2:8000/api', // servidor anterior
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
