import api from './api';

let authToken = null;
let loggedCi = null;

export const login = async (ci, contrasena) => {
  const response = await api.post('/usuarios/login', {
    ci,
    contrasena,
  });
  authToken = response.data.access_token;
  loggedCi = ci;

  return authToken;
};

export const getToken = () => authToken;
export const getLoggedCi = () => loggedCi;

export const logout = () => {
  authToken = null;
  loggedCi = null;
};
