const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://localhost:5000/api/agents/orchestrate', {
      task: "Generate a comprehensive analysis report on production anomalies.",
      context: { data: { documentId: "6a91a1342c171625d7dd5d9a" }, type: "comprehensive" }
    });
    console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("ERROR:", e.response ? e.response.data : e.message);
  }
}
run();
