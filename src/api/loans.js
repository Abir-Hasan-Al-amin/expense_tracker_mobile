import client from './client';

export const getLoans = (params) => client.get('/loans', { params });
export const createLoan = (data) => client.post('/loans', data);
export const getLoan = (id) => client.get(`/loans/${id}`);
export const updateLoan = (id, data) => client.put(`/loans/${id}`, data);
export const deleteLoan = (id) => client.delete(`/loans/${id}`);
export const repayLoan = (id, data) => client.post(`/loans/${id}/repay`, data);
