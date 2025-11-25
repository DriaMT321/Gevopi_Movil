import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.26.6.40:8000',
  //baseURL: 'http://192.168.0.10:8000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
