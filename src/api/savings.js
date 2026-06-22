import client from './client';

export const getSavings = (params) => client.get('/savings', { params });
export const createSavings = (data) => client.post('/savings', data);
export const getSaving = (id) => client.get(`/savings/${id}`);
export const updateSavings = (id, data) => client.put(`/savings/${id}`, data);
export const deleteSavings = (id) => client.delete(`/savings/${id}`);
export const contributeSavings = (id, data) => client.post(`/savings/${id}/contribute`, data);
