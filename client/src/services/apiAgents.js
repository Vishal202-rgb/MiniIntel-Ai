export const orchestrate = async (task, context) => {
  try {
    const response = await fetch('/api/agents/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context })
    });
    if (!response.ok) {
      throw new Error('Failed to orchestrate task');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in orchestrate:', error);
    throw error;
  }
};
