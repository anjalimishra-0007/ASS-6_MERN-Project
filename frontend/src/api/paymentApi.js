import { request } from './apiClient.js';

export const paymentApi = {
  recordPayment: async (paymentData) => {
    return await request('/payments', {
      method: 'POST',
      body: paymentData
    });
  },

  getPaymentByReceiptNo: async (receiptNo) => {
    return await request(`/payments/receipt/${receiptNo}`, {
      method: 'GET'
    });
  },

  getAllPayments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/payments?${query}` : '/payments';
    return await request(endpoint, { method: 'GET' });
  },

  getStudentSummary: async (studentId) => {
    const endpoint = studentId ? `/payments/student-summary/${studentId}` : '/payments/my-summary';
    return await request(endpoint, { method: 'GET' });
  }
};
