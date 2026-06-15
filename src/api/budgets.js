import client from './client';

export const getBudgets = (params) => client.get('/budgets', { params });
export const setBudget = (data) => client.post('/budgets', data);
export const deleteBudget = (id) => client.delete(`/budgets/${id}`);
