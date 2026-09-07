const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function main() {
  // Login as admin
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'vishal', password: 'miniIntel@SIH26023' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  console.log('Admin logged in:', loginData.success, 'Token exists:', !!token);

  const headers = { Authorization: `Bearer ${token}` };

  // 1. Documents
  const docsRes = await fetch(`${BASE_URL}/documents`, { headers });
  const docsData = await docsRes.json();
  console.log('Documents count:', docsData.pagination?.total || docsData.data?.length);
  const sampleDoc = docsData.data?.[0];
  console.log('Sample doc:', sampleDoc ? { id: sampleDoc._id, name: sampleDoc.originalName, status: sampleDoc.status } : 'none');

  // 2. Reports
  const repsRes = await fetch(`${BASE_URL}/reports`, { headers });
  const repsData = await repsRes.json();
  console.log('Reports count:', repsData.data?.length);
  const sampleRep = repsData.data?.[0];
  console.log('Sample report:', sampleRep ? { id: sampleRep._id, title: sampleRep.title, status: sampleRep.status } : 'none');

  // 3. Validation
  const valRes = await fetch(`${BASE_URL}/validation`, { headers });
  const valData = await valRes.json();
  console.log('Validation results count:', valData.data?.length);
  const sampleVal = valData.data?.[0];
  console.log('Sample val:', sampleVal ? { id: sampleVal._id, docId: sampleVal.documentId, status: sampleVal.status, issuesCount: sampleVal.issues?.length } : 'none');

  // 4. Extraction
  if (sampleDoc) {
    const extRes = await fetch(`${BASE_URL}/extraction/${sampleDoc._id}/records`, { headers });
    const extData = await extRes.json();
    console.log('Extracted records count for sample doc:', extData.pagination?.total || extData.data?.length);
  }

  // 5. Normal user login/register
  let userToken = null;
  const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testanalyst', password: 'Password@123' })
  });
  const userLoginData = await userLoginRes.json();
  if (userLoginData.success) {
    userToken = userLoginData.data.token;
    console.log('Normal user logged in:', userLoginData.data.username, userLoginData.data.role);
  } else {
    console.log('User login failed:', userLoginData.message, '- attempting register');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testanalyst', password: 'Password@123', email: 'testanalyst@mineintel.ai' })
    });
    const regData = await regRes.json();
    console.log('Register result:', regData.success, regData.message);
    if (regData.success) userToken = regData.data.token;
  }
}

main().catch(console.error);
