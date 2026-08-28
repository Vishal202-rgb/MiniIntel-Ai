export const orchestrate = async (task, context) => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    const token = userInfo ? JSON.parse(userInfo).token : '';
    
    const response = await fetch('/api/agents/orchestrate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ task, context })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to orchestrate task');
    }
    
    return data;
  } catch (error) {
    console.error('Error in orchestrate:', error);
    throw error;
  }
};
