const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://localhost:5000/api/agents/orchestrate', {
      task: "What should be corrected in this report, and why?",
      context: {}
    });
    console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("ERROR:", e.response ? e.response.data : e.message);
  }
}
run();
