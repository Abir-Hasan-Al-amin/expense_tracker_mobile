import client from './client';

export const getNotifications = (params) => client.get('/notifications', { params });
export const markAllRead = () => client.patch('/notifications/read-all');
export const markRead = (id) => client.patch(`/notifications/${id}/read`);
export const deleteNotification = (id) => client.delete(`/notifications/${id}`);
