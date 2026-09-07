import aiAssistantApi from '../api/aiAssistantApi';

export const orchestrate = async (task, context) => {
  try {
    const res = await aiAssistantApi.orchestrate(task, context);
    return res.data || res;
  } catch (error) {
    console.error('Error in orchestrate:', error);
    throw error;
  }
};

export default {
  orchestrate,
};
