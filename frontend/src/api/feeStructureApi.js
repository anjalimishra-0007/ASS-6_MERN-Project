import { request } from './apiClient.js';

export const feeStructureApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/fee-structures?${query}` : '/fee-structures';
    return await request(endpoint, { method: 'GET' });
  },

  getById: async (id) => {
    return await request(`/fee-structures/${id}`, { method: 'GET' });
  },

  create: async (data) => {
    return await request('/fee-structures', {
      method: 'POST',
      body: data
    });
  },

  update: async (id, data) => {
    return await request(`/fee-structures/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  delete: async (id) => {
    return await request(`/fee-structures/${id}`, {
      method: 'DELETE'
    });
  }
};
