export const getNotifications = async () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    const token = userInfo ? JSON.parse(userInfo).token : '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch('/api/notifications', { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};
