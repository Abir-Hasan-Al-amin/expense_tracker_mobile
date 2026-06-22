import client from './client';

export const getSplits = () => client.get('/splits');
export const createSplit = (data) => client.post('/splits', data);
export const getSplit = (id) => client.get(`/splits/${id}`);
export const updateSplit = (id, data) => client.put(`/splits/${id}`, data);
export const deleteSplit = (id) => client.delete(`/splits/${id}`);
export const settleParticipant = (id, participantId) =>
  client.patch(`/splits/${id}/settle/${participantId}`);
