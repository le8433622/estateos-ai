import { chromium } from 'playwright';

const BASE = 'https://estateos-frontend.onrender.com';
const ADMIN_BASE = 'https://estateos-admin.onrender.com';
const API_BASE = 'https://estateos-backend-api.onrender.com';
const PASS = 'EstateOS123';

const results = { pass: 0, fail: 0, details: [] };

function check(name, ok, msg) {
  if (ok) { results.pass++; results.details.push(`  ✅ ${name}`); }
  else { results.fail++; results.details.push(`  ❌ ${name}: ${msg}`); }
}

let tokenCache = {};

async function loginViaAPI(page, email, appType) {
  const resp = await page.request.post(`${API_BASE}/api/sign-in/${appType}`, {
    data: { email, password: PASS, stayConnected: false, mobile: true },
    timeout: 60000,
  });
  let body = {};
  try { body = await resp.json(); } catch (e) { /* 204 has no body */ }
  if (resp.status() === 200 && body.accessToken) {
    tokenCache[email] = body.accessToken;
  }
  return { status: resp.status(), body };
}

async function loginAndGetToken(page, email, appType) {
  const resp = await page.request.post(`${API_BASE}/api/sign-in/${appType}`, {
    data: { email, password: PASS, stayConnected: false, mobile: true },
    timeout: 60000,
  });
  let body = {};
  try { body = await resp.json(); } catch (e) {}
  if (resp.status() === 200 && body.accessToken) {
    tokenCache[email] = body.accessToken;
    return body.accessToken;
  }
  return null;
}

async function authFetch(ctx, email, path, options = {}) {
  const token = tokenCache[email];
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-access-token'] = token;
  return ctx.request.fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    timeout: 60000,
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const apiCtx = await browser.newContext({ ignoreHTTPSErrors: true });

  console.log('\n========== PERMISSION QA MATRIX ==========\n');

  // ===== 1. ADMIN LOGIN GATE =====
  console.log('📋 1. Admin Login Gate (only admin:moderate)');

  const adminTests = [
    { email: 'operator@estateos.test',  label: 'PlatformOperator', expect: 200 },
    { email: 'admin@estateos.test',     label: 'Legacy admin (no profile)', expect: 204 },
    { email: 'verifier-1@estateos.test',label: 'VerificationOperator', expect: 204 },
    { email: 'claim-source-1@estateos.test', label: 'PropertyClaim', expect: 204 },
    { email: 'demand-1@estateos.test',  label: 'PropertyDemand', expect: 204 },
    { email: 'api-buyer-1@estateos.test', label: 'ApiDataBuyer', expect: 204 },
    { email: 'ai-agent@estateos.test',  label: 'AiAgent', expect: 204 },
  ];

  for (const t of adminTests) {
    const page = await context.newPage();
    const { status, body } = await loginViaAPI(page, t.email, 'ADMIN');
    const pass = status === t.expect;
    const msg = pass ? '' : `got ${status} (wanted ${t.expect})${body?.permissions ? ' perms:' + body.permissions : ''}`;
    const adminAccess = t.expect === 200 ? 'allow' : 'deny';
    check(`Admin login: ${t.label} → ${adminAccess}`, pass, msg);
    if (pass && status === 200) {
      check(`  ${t.label} sees admin:moderate`, body.permissions?.includes('admin:moderate'), `got: ${body.permissions}`);
    }
    await page.close();
  }

  // ===== 2. FRONTEND LOGIN GATE =====
  console.log('\n📋 2. Frontend Login Gate');

  const frontendTests = [
    { email: 'operator@estateos.test',  label: 'PlatformOperator', expect: 200 },
    { email: 'admin@estateos.test',     label: 'Legacy admin (no profile)', expect: 204 },
    { email: 'verifier-1@estateos.test',label: 'VerificationOperator', expect: 200 },
    { email: 'claim-source-1@estateos.test', label: 'PropertyClaim', expect: 200 },
    { email: 'demand-1@estateos.test',  label: 'PropertyDemand', expect: 200 },
    { email: 'api-buyer-1@estateos.test', label: 'ApiDataBuyer', expect: 200 },
    { email: 'ai-agent@estateos.test',  label: 'AiAgent', expect: 204 },
  ];

  for (const t of frontendTests) {
    const page = await context.newPage();
    const { status, body } = await loginViaAPI(page, t.email, 'FRONTEND');
    const pass = status === t.expect;
    const msg = pass ? '' : `got ${status} (wanted ${t.expect})`;
    const frontendAccess = t.expect === 200 ? 'allow' : 'deny';
    check(`Frontend login: ${t.label} → ${frontendAccess}`, pass, msg);
    if (pass && status === 200) {
      check(`  ${t.label} has permissions in response`, Array.isArray(body.permissions), typeof body.permissions);
      check(`  ${t.label} has account_profiles in response`, Array.isArray(body.account_profiles), typeof body.account_profiles);
    }
    await page.close();
  }

  // ===== 3. ROUTE GUARD TESTS =====
  console.log('\n📋 3. Route Guard Tests');

  // Pre-login users for token extraction
  const authPages = {};
  for (const [user, appType] of [['operator', 'ADMIN'], ['claim-source-1', 'FRONTEND'], ['demand-1', 'FRONTEND'], ['verifier-1', 'ADMIN'], ['api-buyer-1', 'FRONTEND']]) {
    const p = await apiCtx.newPage();
    await loginViaAPI(p, `${user}@estateos.test`, appType);
    authPages[user] = p;
  }

  const routeTests = [
    { label: 'Ops: Command Center', method: 'GET', path: '/api/v1/ops/command-center',
      user: 'operator', expect: 200 },
    { label: 'Ops: Command Center (demand)', method: 'GET', path: '/api/v1/ops/command-center',
      user: 'demand-1', expect: 403 },
    { label: 'Ops: Properties', method: 'GET', path: '/api/v1/ops/properties',
      user: 'operator', expect: 200 },
    { label: 'Supply: Create Property', method: 'POST', path: '/api/v1/supply/properties',
      user: 'claim-source-1', expect: 400, body: {} },  // 400 = empty body rejected
    { label: 'Supply: Create Property (with valid body)', method: 'POST', path: '/api/v1/supply/properties',
      user: 'claim-source-1', expect: 201,
      body: { title: 'QA Test Property', property_type: 'apartment', address: 'QA Test Address' } },
    { label: 'Supply: Create Property (demand)', method: 'POST', path: '/api/v1/supply/properties',
      user: 'demand-1', expect: 403, body: { title: 'Test' } },
    { label: 'Verification: List Jobs', method: 'GET', path: '/api/v1/verification/jobs',
      user: 'verifier-1', expect: 200 },
    { label: 'Verification: List Jobs (demand)', method: 'GET', path: '/api/v1/verification/jobs',
      user: 'demand-1', expect: 403 },
    { label: 'API Keys: Create (empty body)', method: 'POST', path: '/api/v1/api-keys',
      user: 'api-buyer-1', expect: 400, body: {} },
    { label: 'API Keys: Create (with valid body)', method: 'POST', path: '/api/v1/api-keys',
      user: 'api-buyer-1', expect: 201,
      body: { name: 'QA Test Key', scopes: ['properties:read_public'] } },
    { label: 'API Keys: Create (demand)', method: 'POST', path: '/api/v1/api-keys',
      user: 'demand-1', expect: 403, body: { name: 'Test', scopes: ['properties:read_public'] } },
    { label: 'Billing: Admin Overview', method: 'GET', path: '/api/v1/billing/admin/overview',
      user: 'operator', expect: 200 },
    { label: 'Billing: Admin Overview (api-buyer)', method: 'GET', path: '/api/v1/billing/admin/overview',
      user: 'api-buyer-1', expect: 403 },
    { label: 'Billing: List Plans (public)', method: 'GET', path: '/api/v1/billing/plans',
      user: 'none', expect: 200 },
    { label: 'Billing: Subscriptions (api-buyer)', method: 'GET', path: '/api/v1/billing/subscriptions',
      user: 'api-buyer-1', expect: 200 },
    { label: 'Quality: Public (no auth)', method: 'GET', path: '/api/v1/quality/properties/some-id',
      user: 'none', expect: 400 },  // 400 = returns 400 for invalid ID
    { label: 'Quality: Admin Overview (demand)', method: 'GET', path: '/api/v1/quality/admin/overview',
      user: 'demand-1', expect: 403 },
    { label: 'Data Products (public)', method: 'GET', path: '/api/v1/data-products',
      user: 'none', expect: 200 },
    { label: 'Partners: Admin Applications (operator)', method: 'GET', path: '/api/v1/partners/admin/applications',
      user: 'operator', expect: 200 },
    { label: 'Partners: Admin Applications (api-buyer)', method: 'GET', path: '/api/v1/partners/admin/applications',
      user: 'api-buyer-1', expect: 403 },
    { label: 'Pilot: Metrics (operator)', method: 'GET', path: '/api/v1/pilot/metrics',
      user: 'operator', expect: 200 },
    { label: 'Pilot: Metrics (claim-source)', method: 'GET', path: '/api/v1/pilot/metrics',
      user: 'claim-source-1', expect: 403 },
    { label: 'Seed (operator) — already seeded', method: 'POST', path: '/api/v1/estateos/seed',
      user: 'operator', expect: 400 },  // 400 = seed already completed
    { label: 'Seed (demand)', method: 'POST', path: '/api/v1/estateos/seed',
      user: 'demand-1', expect: 403 },
    { label: 'Health (public)', method: 'GET', path: '/api/v1/estateos/health',
      user: 'none', expect: 200 },
  ];

  for (const r of routeTests) {
    try {
      let resp;
      if (r.user === 'none') {
        resp = await apiCtx.request.fetch(`${API_BASE}${r.path}`, {
          method: r.method,
          headers: { 'Content-Type': 'application/json' },
          data: r.body || (r.method === 'POST' ? {} : undefined),
          timeout: 60000,
        });
      } else {
        const userEmail = `${r.user}@estateos.test`;
        resp = await authFetch(apiCtx, userEmail, r.path, {
          method: r.method,
          data: r.body || (r.method === 'POST' ? {} : undefined),
        });
      }
      const status = resp.status();
      const pass = status === r.expect;
      const msg = pass ? '' : `got ${status} (wanted ${r.expect})`;
      check(r.label, pass, msg);
    } catch (e) {
      check(r.label, false, e.message.substring(0, 80));
    }
  }

  for (const p of Object.values(authPages)) await p.close();

  // ===== 4. ADMIN UI SIDEBAR FILTERING (playwright browser) =====
  console.log('\n📋 4. Admin UI Sidebar Filtering');

  // Login operator via browser
  const adminPage = await context.newPage();
  await adminPage.goto(ADMIN_BASE + '/#/sign-in', { waitUntil: 'networkidle', timeout: 60000 });
  await adminPage.waitForTimeout(5000);
  await adminPage.waitForSelector('input', { timeout: 10000 });
  const inputs = await adminPage.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].fill('operator@estateos.test');
    await inputs[1].fill(PASS);
  }
  const submitBtn = await adminPage.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await adminPage.waitForTimeout(8000);
  }

  // Open sidebar
  const menuBtn = await adminPage.$('button[aria-label="open drawer"]');
  if (menuBtn) await menuBtn.click();
  await adminPage.waitForTimeout(2000);

  // Check sidebar items
  const sidebarTexts = await adminPage.$$eval('.MuiListItemText-primary', els => els.map(e => e.textContent));
  console.log('  Operator sidebar items:', sidebarTexts);

  check('Operator sees EstateOS in sidebar', sidebarTexts.some(t => t === 'EstateOS'), '');
  check('Operator sees Billing in sidebar', sidebarTexts.some(t => t === 'Billing'), '');
  check('Operator sees Property Review', sidebarTexts.some(t => t === 'Property Review'), '');
  check('Operator sees Data Quality', sidebarTexts.some(t => t === 'Data Quality'), '');
  check('Operator sees Partners', sidebarTexts.some(t => t === 'Partners'), '');
  check('Operator sees Pilot', sidebarTexts.some(t => t === 'Pilot'), '');
  check('Operator sees Dashboard', sidebarTexts.some(t => t === 'Dashboard'), '');

  // Close sidebar
  await adminPage.keyboard.press('Escape');
  await adminPage.waitForTimeout(500);

  await adminPage.close();

  // Also try login as verifier-1 via browser (should be denied)
  const verifierAdminCtx = await browser.newContext({ ignoreHTTPSErrors: true });
  const verifierAdminPage = await verifierAdminCtx.newPage();
  await verifierAdminPage.goto(ADMIN_BASE + '/#/sign-in', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await verifierAdminPage.waitForTimeout(5000);
  const vInputs = await verifierAdminPage.$$('input');
  if (vInputs.length >= 2) {
    await vInputs[0].fill('verifier-1@estateos.test');
    await vInputs[1].fill(PASS);
  }
  const vBtn = await verifierAdminPage.$('button[type="submit"]');
  if (vBtn) {
    await vBtn.click();
    await verifierAdminPage.waitForTimeout(8000);
  }
  const stillOnSignin = verifierAdminPage.url().includes('/sign-in');
  check('Verifier denied from admin console', stillOnSignin, `URL: ${verifierAdminPage.url().substring(0, 80)}`);
  await verifierAdminPage.close();

  // ===== 5. FRONTEND UI SIDEBAR FILTERING =====
  console.log('\n📋 5. Frontend UI Sidebar Filtering');

  // Login as claim-source-1 via browser
  const fePage = await context.newPage();
  await fePage.goto(BASE + '/#/sign-in', { waitUntil: 'networkidle', timeout: 60000 });
  await fePage.waitForTimeout(5000);
  await fePage.waitForSelector('input', { timeout: 10000 });
  const feInputs = await fePage.$$('input');
  if (feInputs.length >= 2) {
    await feInputs[0].fill('claim-source-1@estateos.test');
    await feInputs[1].fill(PASS);
  }
  const feBtn = await fePage.$('button[type="submit"]');
  if (feBtn) {
    await feBtn.click();
    await fePage.waitForTimeout(8000);
    await fePage.waitForLoadState('networkidle');
  }

  // Debug localStorage
  const claimLocalData = await fePage.evaluate(() => {
    const raw = localStorage.getItem('mi-fe-user');
    if (!raw) return { error: 'no mi-fe-user' };
    try { const p = JSON.parse(raw); return { permissions: p.permissions, account_profiles: p.account_profiles }; }
    catch (e) { return { error: String(e) }; }
  });
  console.log('  Claim-source localStorage:', JSON.stringify(claimLocalData));

  // Open sidebar
  const feMenuBtn = await fePage.$('button[aria-label="open drawer"]');
  if (feMenuBtn) await feMenuBtn.click();
  await fePage.waitForTimeout(2000);

  const feSidebarTexts = await fePage.$$eval('.MuiListItemText-primary', els => els.map(e => e.textContent));
  console.log('  Claim-source sidebar items:', feSidebarTexts);

  check('Claim-source sees Supply', feSidebarTexts.some(t => t === 'Supply'), '');
  check('Claim-source does NOT see API Buyer', !feSidebarTexts.some(t => t === 'API Buyer'), '');
  check('Claim-source does NOT see Verifier', !feSidebarTexts.some(t => t === 'Verifier'), '');
  check('Claim-source sees Demand', feSidebarTexts.some(t => t === 'Demand'), '');

  await fePage.close();

  // Login as api-buyer-1 (fresh context to avoid localStorage conflicts)
  const buyerCtx = await browser.newContext({ ignoreHTTPSErrors: true });
  const buyerPage = await buyerCtx.newPage();
  await buyerPage.goto(BASE + '/#/sign-in', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await buyerPage.waitForTimeout(5000);
  const buyerInputs = await buyerPage.$$('input');
  if (buyerInputs.length >= 2) {
    await buyerInputs[0].fill('api-buyer-1@estateos.test');
    await buyerInputs[1].fill(PASS);
  }
  const buyerBtn = await buyerPage.$('button[type="submit"]');
  if (buyerBtn) await buyerBtn.click();
  await buyerPage.waitForTimeout(8000);

  // Debug: check localStorage for permissions
  const localData = await buyerPage.evaluate(() => {
    const raw = localStorage.getItem('mi-fe-user');
    if (!raw) return { error: 'no mi-fe-user in localStorage' };
    try {
      const parsed = JSON.parse(raw);
      return { permissions: parsed.permissions, account_profiles: parsed.account_profiles };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log('  API Buyer localStorage:', JSON.stringify(localData));

  // Open sidebar
  const buyerMenuBtn = await buyerPage.$('button[aria-label="open drawer"]');
  if (buyerMenuBtn) await buyerMenuBtn.click();
  await buyerPage.waitForTimeout(2000);

  const buyerSidebarTexts = await buyerPage.$$eval('.MuiListItemText-primary', els => els.map(e => e.textContent));
  console.log('  API Buyer sidebar items:', buyerSidebarTexts);

  check('API Buyer sees API Buyer', buyerSidebarTexts.some(t => t === 'API Buyer'), '');
  check('API Buyer does NOT see Supply', !buyerSidebarTexts.some(t => t === 'Supply'), '');
  check('API Buyer does NOT see Verifier', !buyerSidebarTexts.some(t => t === 'Verifier'), '');

  await buyerCtx.close();

  // ===== RESULTS =====
  console.log(`\n========== RESULTS: ${results.pass} passed, ${results.fail} failed ==========\n`);
  for (const d of results.details) console.log(d);
  console.log(`\n${results.fail > 0 ? 'SOME TESTS FAILED' : 'ALL TESTS PASSED'}`);

  // Cleanup test artifacts
  console.log('\nCleaning up test artifacts...');
  const apiBuyerEmail = 'api-buyer-1@estateos.test';
  const cleanupToken = tokenCache[apiBuyerEmail];
  if (cleanupToken) {
    // Find and delete QA API keys via listing
    try {
      const keysResp = await apiCtx.request.fetch(`${API_BASE}/api/v1/api-keys`, {
        headers: { 'x-access-token': cleanupToken },
        timeout: 30000,
      });
      if (keysResp.status() === 200) {
        const keys = await keysResp.json();
        if (Array.isArray(keys)) {
          for (const k of keys) {
            if (k.name && k.name.startsWith('QA Test ')) {
              await apiCtx.request.fetch(`${API_BASE}/api/v1/api-keys/${k.id}`, {
                method: 'DELETE',
                headers: { 'x-access-token': cleanupToken },
                timeout: 30000,
              });
              console.log(`  Deleted QA API key: ${k.name}`);
            }
          }
        }
      }
    } catch (e) {
      console.log('  API key cleanup note:', e.message.substring(0, 60));
    }
  }

  console.log('\nTo clean database artifacts: MI_DB_URI=<uri> npm run cleanup:qa');

  await browser.close();
})();
