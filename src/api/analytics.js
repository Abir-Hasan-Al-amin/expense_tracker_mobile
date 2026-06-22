import client from './client';

export const getSummary = (params) => client.get('/analytics/summary', { params });
export const getCategoryBreakdown = (params) => client.get('/analytics/categories', { params });
export const getTrends = (params) => client.get('/analytics/trends', { params });
export const getNetWorth = () => client.get('/analytics/net-worth');
