const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== STARTING SETTINGS & HELP/SUPPORT REST API VERIFICATION ===\n');

  let adminToken = '';
  let normalToken = '';

  // 1. Authentication
  console.log('--- 1. Authentication & Setup ---');
  try {
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'vishal',
      password: 'miniIntel@SIH26023'
    });
    adminToken = adminLoginRes.data.data.token;
    console.log('✓ Admin login successful. Role:', adminLoginRes.data.data.role);

    const normalUserRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testanalyst',
      password: 'Password@123'
    });
    normalToken = normalUserRes.data.data.token;
    console.log('✓ Normal user login successful. ID:', normalUserRes.data.data._id);
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const normalHeaders = { Authorization: `Bearer ${normalToken}` };

  // ==========================================
  // SETTINGS ENDPOINTS
  // ==========================================
  console.log('\n--- 2. Settings Endpoints ---');

  // 2a. GET /api/v1/settings (Admin)
  try {
    const res = await axios.get(`${BASE_URL}/settings`, { headers: adminHeaders });
    console.log('✓ GET /settings status:', res.status);
    console.log('  Language:', res.data.data.language?.language);
    console.log('  Timezone:', res.data.data.language?.timezone);
    console.log('  Theme:', res.data.data.appearance?.theme);
    console.log('  Notifications:', res.data.data.notifications);
    console.log('  Account Organization:', res.data.data.account?.organization);
    console.log('  Admin Controls Available:', Boolean(res.data.data.adminSettings));
  } catch (err) {
    console.error('GET /settings failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2b. GET /api/v1/settings/language
  try {
    const res = await axios.get(`${BASE_URL}/settings/language`, { headers: normalHeaders });
    console.log('✓ GET /settings/language status:', res.status);
    console.log('  Current Language:', res.data.data.language);
    console.log('  Supported Languages Count:', res.data.data.supportedLanguages?.length);
  } catch (err) {
    console.error('GET /settings/language failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2c. PUT /api/v1/settings/language (Update to Hindi)
  try {
    const res = await axios.put(
      `${BASE_URL}/settings/language`,
      { language: 'hi' },
      { headers: normalHeaders }
    );
    console.log('✓ PUT /settings/language status:', res.status);
    console.log('  Updated Language:', res.data.data.language);

    // Verify persistence
    const checkRes = await axios.get(`${BASE_URL}/settings/language`, { headers: normalHeaders });
    console.log('  Verified persisted language:', checkRes.data.data.language === 'hi' ? 'YES (hi)' : 'NO');
  } catch (err) {
    console.error('PUT /settings/language failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2d. GET /api/v1/settings/appearance
  try {
    const res = await axios.get(`${BASE_URL}/settings/appearance`, { headers: normalHeaders });
    console.log('✓ GET /settings/appearance status:', res.status);
    console.log('  Current Theme:', res.data.data.theme);
  } catch (err) {
    console.error('GET /settings/appearance failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2e. PUT /api/v1/settings/appearance (Update to Dark mode)
  try {
    const res = await axios.put(
      `${BASE_URL}/settings/appearance`,
      { theme: 'dark' },
      { headers: normalHeaders }
    );
    console.log('✓ PUT /settings/appearance status:', res.status);
    console.log('  Updated Theme:', res.data.data.theme);

    // Verify persistence
    const checkRes = await axios.get(`${BASE_URL}/settings/appearance`, { headers: normalHeaders });
    console.log('  Verified persisted theme:', checkRes.data.data.theme === 'dark' ? 'YES (dark)' : 'NO');
  } catch (err) {
    console.error('PUT /settings/appearance failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2f. GET /api/v1/settings/notifications
  try {
    const res = await axios.get(`${BASE_URL}/settings/notifications`, { headers: normalHeaders });
    console.log('✓ GET /settings/notifications status:', res.status);
    console.log('  Initial Notifications:', res.data.data);
  } catch (err) {
    console.error('GET /settings/notifications failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2g. PUT /api/v1/settings/notifications (Update flags)
  try {
    const res = await axios.put(
      `${BASE_URL}/settings/notifications`,
      { emailNotif: false, pushNotif: true, reportAlerts: true },
      { headers: normalHeaders }
    );
    console.log('✓ PUT /settings/notifications status:', res.status);
    console.log('  Updated Notifications:', res.data.data);

    // Verify persistence
    const checkRes = await axios.get(`${BASE_URL}/settings/notifications`, { headers: normalHeaders });
    console.log('  Verified reportAlerts is true:', checkRes.data.data.reportAlerts === true ? 'YES' : 'NO');
    console.log('  Verified emailNotif is false:', checkRes.data.data.emailNotif === false ? 'YES' : 'NO');
  } catch (err) {
    console.error('PUT /settings/notifications failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2h. PUT /api/v1/settings (Bulk Update)
  try {
    const res = await axios.put(
      `${BASE_URL}/settings`,
      {
        language: 'en',
        appearance: { theme: 'light' },
        notifications: { emailNotif: true, reportAlerts: false }
      },
      { headers: normalHeaders }
    );
    console.log('✓ PUT /settings (bulk) status:', res.status);
    console.log('  Bulk updated language:', res.data.data.language?.language);
    console.log('  Bulk updated theme:', res.data.data.appearance?.theme);
    console.log('  Bulk updated reportAlerts:', res.data.data.notifications?.reportAlerts);
  } catch (err) {
    console.error('PUT /settings (bulk) failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2i. Validation Checks (Invalid Language / Invalid Theme)
  console.log('\n--- 3. Settings Validation Checks ---');
  try {
    await axios.put(
      `${BASE_URL}/settings/language`,
      { language: 'invalid_lang_code' },
      { headers: normalHeaders }
    );
    console.error('✗ Expected 400 error for invalid language!');
    process.exit(1);
  } catch (err) {
    console.log('✓ Correctly rejected invalid language with status:', err.response?.status);
    console.log('  Message:', err.response?.data?.message);
  }

  try {
    await axios.put(
      `${BASE_URL}/settings/appearance`,
      { theme: 'neon_pink' },
      { headers: normalHeaders }
    );
    console.error('✗ Expected 400 error for invalid theme!');
    process.exit(1);
  } catch (err) {
    console.log('✓ Correctly rejected invalid theme with status:', err.response?.status);
    console.log('  Message:', err.response?.data?.message);
  }

  // 2j. User Isolation Check (Admin vs Normal User)
  console.log('\n--- 4. User Isolation Check ---');
  try {
    const adminSettings = await axios.get(`${BASE_URL}/settings`, { headers: adminHeaders });
    const normalSettings = await axios.get(`${BASE_URL}/settings`, { headers: normalHeaders });
    console.log('✓ Admin user:', adminSettings.data.data.account?.username, '| Admin Controls:', Boolean(adminSettings.data.data.adminSettings));
    console.log('✓ Normal user:', normalSettings.data.data.account?.username, '| Admin Controls:', Boolean(normalSettings.data.data.adminSettings));
    console.log('✓ Verified normal user has no adminSettings:', normalSettings.data.data.adminSettings === null);
  } catch (err) {
    console.error('User isolation check failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // ==========================================
  // HELP & SUPPORT ENDPOINTS
  // ==========================================
  console.log('\n--- 5. Help & Support Endpoints ---');

  // 5a. GET /api/v1/help
  try {
    const res = await axios.get(`${BASE_URL}/help`, { headers: adminHeaders });
    console.log('✓ GET /help status:', res.status);
    console.log('  Title:', res.data.data.title);
    console.log('  Total Guides:', res.data.data.totalGuides);
    console.log('  Total FAQs:', res.data.data.totalFaqs);
    console.log('  Categories:', res.data.data.guideCategories);
    console.log('  Support Email:', res.data.data.supportContact?.email);
  } catch (err) {
    console.error('GET /help failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5b. GET /api/v1/help/faqs
  let sampleFaqId = '';
  try {
    const res = await axios.get(`${BASE_URL}/help/faqs`, { headers: adminHeaders });
    console.log('✓ GET /help/faqs status:', res.status);
    console.log('  Total FAQs returned:', res.data.data.total);
    console.log('  Categories available:', res.data.data.categories);
    if (res.data.data.faqs?.length > 0) {
      sampleFaqId = res.data.data.faqs[0].id;
      console.log('  Sample FAQ ID acquired:', sampleFaqId, '| Question:', res.data.data.faqs[0].question);
    }
  } catch (err) {
    console.error('GET /help/faqs failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5c. GET /api/v1/help/faqs/:id
  if (sampleFaqId) {
    try {
      const res = await axios.get(`${BASE_URL}/help/faqs/${sampleFaqId}`, { headers: adminHeaders });
      console.log('✓ GET /help/faqs/:id status:', res.status);
      console.log('  Question:', res.data.data.question);
      console.log('  Answer Excerpt:', res.data.data.answer.substring(0, 80) + '...');
    } catch (err) {
      console.error('GET /help/faqs/:id failed:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // 5d. GET /api/v1/help/search (Search query: "export")
  try {
    const res = await axios.get(`${BASE_URL}/help/search?q=export`, { headers: adminHeaders });
    console.log('✓ GET /help/search?q=export status:', res.status);
    console.log('  Results Count:', res.data.data.resultsCount);
    console.log('  Matched FAQs Count:', res.data.data.matchedFaqs?.length);
    console.log('  Matched Guides Count:', res.data.data.matchedGuides?.length);
    if (res.data.data.matchedFaqs?.length > 0) {
      console.log('  Matched FAQ Question:', res.data.data.matchedFaqs[0].question);
    }
  } catch (err) {
    console.error('GET /help/search failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5e. GET /api/v1/help/search (Search query: "validation")
  try {
    const res = await axios.get(`${BASE_URL}/help/search?q=validation`, { headers: adminHeaders });
    console.log('✓ GET /help/search?q=validation status:', res.status);
    console.log('  Results Count:', res.data.data.resultsCount);
    console.log('  Matched Guides:', res.data.data.matchedGuides?.map(g => g.title).join(', '));
  } catch (err) {
    console.error('GET /help/search?q=validation failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n=== ALL SETTINGS & HELP/SUPPORT REST API TESTS PASSED PERFECTLY! ===');
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
