import client from './client';

export const getBills = (params) => client.get('/bills', { params });
export const createBill = (data) => client.post('/bills', data);
export const getBill = (id) => client.get(`/bills/${id}`);
export const updateBill = (id, data) => client.put(`/bills/${id}`, data);
export const deleteBill = (id) => client.delete(`/bills/${id}`);
export const payBill = (id) => client.patch(`/bills/${id}/pay`);
export const unpayBill = (id) => client.patch(`/bills/${id}/unpay`);
