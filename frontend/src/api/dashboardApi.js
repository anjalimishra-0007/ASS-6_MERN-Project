import { request } from './apiClient.js';

export const dashboardApi = {
  getStats: async () => {
    return await request('/dashboard/stats', {
      method: 'GET'
    });
  }
};
