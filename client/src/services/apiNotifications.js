export const getNotifications = async () => {
  try {
    const response = await fetch('/api/notifications');
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};
