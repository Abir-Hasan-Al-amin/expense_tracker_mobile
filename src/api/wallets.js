import client from './client';

export const getWallets = () => client.get('/wallets');
export const createWallet = (data) => client.post('/wallets', data);
export const getWallet = (id) => client.get(`/wallets/${id}`);
export const updateWallet = (id, data) => client.put(`/wallets/${id}`, data);
export const deleteWallet = (id) => client.delete(`/wallets/${id}`);
export const transferWallet = (id, data) => client.post(`/wallets/${id}/transfer`, data);
