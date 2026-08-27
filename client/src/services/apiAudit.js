export const getLogs = async () => {
  try {
    const response = await fetch('/api/audit');
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};
