import { request } from './apiClient.js';

export const authApi = {
  login: async (credentials) => {
    return await request('/auth/login', {
      method: 'POST',
      body: credentials
    });
  },

  register: async (userData) => {
    return await request('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  getMe: async () => {
    return await request('/auth/me', {
      method: 'GET'
    });
  }
};
