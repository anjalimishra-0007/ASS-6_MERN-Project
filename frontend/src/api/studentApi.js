import { request } from './apiClient.js';

export const studentApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/students?${query}` : '/students';
    return await request(endpoint, { method: 'GET' });
  },

  getById: async (id) => {
    return await request(`/students/${id}`, { method: 'GET' });
  }
};
