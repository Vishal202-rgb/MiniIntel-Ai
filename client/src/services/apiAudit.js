export const getLogs = async () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    const token = userInfo ? JSON.parse(userInfo).token : '';
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch('/api/audit', { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};
