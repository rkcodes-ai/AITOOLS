/**
 * AITOOLS — Multi-Tenant Security, Cookie Session & Penetration Audit Suite
 * Verifies HttpOnly cookie authentication, session restoration, logout invalidation,
 * multi-tenant isolation, ID manipulation defenses, RAG boundary security,
 * and malicious upload sanitization.
 */
import http from 'http';

const BASE_ORIGIN = 'http://localhost:8080';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const cleanPath = '/api/v1' + (path.startsWith('/') ? path : '/' + path);
    const url = new URL(cleanPath, BASE_ORIGIN);
    const reqHeaders = { ...headers };
    let postData = null;

    if (body && !(body instanceof Buffer)) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    } else if (body instanceof Buffer) {
      postData = body;
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          try {
            const data = JSON.parse(raw);
            resolve({ status: res.statusCode, headers: res.headers, data });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function sendMultipart(path, filename, fileBuffer, fields = {}, headers = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
    const cleanPath = '/api/v1' + (path.startsWith('/') ? path : '/' + path);
    const url = new URL(cleanPath, BASE_ORIGIN);

    const parts = [];

    for (const [key, value] of Object.entries(fields)) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      ));
    }

    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/plain\r\n\r\n`
    ));
    parts.push(fileBuffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const fullBody = Buffer.concat(parts);

    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBody.length,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, raw });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

// Helper to extract cookie from Set-Cookie header array/string
function extractCookie(setCookieHeaders, cookieName = 'aitools_session') {
  if (!setCookieHeaders) return null;
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const h of headers) {
    if (h.startsWith(`${cookieName}=`)) {
      return h.split(';')[0];
    }
  }
  return null;
}

async function runSecurityAudit() {
  console.log('=====================================================');
  console.log('🔒 STARTING AITOOLS HARDENED SECURITY & COOKIE AUDIT');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✔ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. HttpOnly Cookie Authentication & Session Flow
  console.log('--- 1. HttpOnly Cookie Authentication & Session Flow ---');
  const sessionUserEmail = `cookie_user_${Date.now()}@security.test`;
  const sessionUserPassword = 'CookiePassword123!';

  // Register establishes HttpOnly cookie
  const regRes = await request('POST', '/auth/register', {
    name: 'Cookie Session User',
    email: sessionUserEmail,
    password: sessionUserPassword,
  });

  assert(regRes.status === 201, 'User registration succeeded with 201 Created');
  const setCookieHeader = regRes.headers['set-cookie'];
  assert(setCookieHeader && setCookieHeader.length > 0, 'Server dispatched Set-Cookie header');
  
  const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : setCookieHeader;
  assert(cookieStr.includes('aitools_session='), 'Cookie name is aitools_session');
  assert(cookieStr.toLowerCase().includes('httponly'), 'Cookie contains HttpOnly flag');
  assert(cookieStr.toLowerCase().includes('path=/'), 'Cookie contains explicit Path=/ flag');

  const sessionCookie = extractCookie(setCookieHeader);

  // Authenticate /auth/me purely with Cookie header (NO Authorization header)
  const meCookieRes = await request('GET', '/auth/me', null, {
    Cookie: sessionCookie,
  });
  assert(meCookieRes.status === 200, 'GET /auth/me authenticated purely via HttpOnly cookie (No Authorization header)');
  assert(meCookieRes.data.data.email === sessionUserEmail, 'Hydrated correct user identity from cookie session');

  // Protected route access via cookie alone
  const docsCookieRes = await request('GET', '/documents', null, {
    Cookie: sessionCookie,
  });
  assert(docsCookieRes.status === 200, 'GET /documents accessed purely via HttpOnly session cookie');

  // Logout clears HttpOnly cookie
  const logoutRes = await request('POST', '/auth/logout', null, {
    Cookie: sessionCookie,
  });
  assert(logoutRes.status === 200, 'POST /auth/logout succeeded with 200 OK');
  const logoutSetCookie = logoutRes.headers['set-cookie'];
  const logoutCookieStr = Array.isArray(logoutSetCookie) ? logoutSetCookie.join('; ') : logoutSetCookie;
  assert(
    logoutCookieStr && (logoutCookieStr.includes('aitools_session=;') || logoutCookieStr.toLowerCase().includes('expires=thu, 01 jan 1970')),
    'Logout dispatched Set-Cookie invalidation with expired timestamp'
  );

  // Subsequent request without valid cookie is rejected
  const meAfterLogout = await request('GET', '/auth/me', null, {});
  assert(meAfterLogout.status === 401, 'Unauthenticated GET /auth/me correctly rejected with 401 UNAUTHORIZED');

  // 2. Multi-Tenant Identities & ID Manipulation
  console.log('\n--- 2. Multi-Tenant User Isolation & ID Manipulation Audit ---');
  const userAEmail = `victim_${Date.now()}@security.test`;
  const userBEmail = `attacker_${Date.now()}@security.test`;
  const userPassword = 'SecurityPassword123!';

  const regA = await request('POST', '/auth/register', {
    name: 'Victim User A',
    email: userAEmail,
    password: userPassword,
  });
  const cookieA = extractCookie(regA.headers['set-cookie']);
  const tokenA = regA.data.data.accessToken;
  const userAId = regA.data.data.user.id;

  const regB = await request('POST', '/auth/register', {
    name: 'Attacker User B',
    email: userBEmail,
    password: userPassword,
  });
  const cookieB = extractCookie(regB.headers['set-cookie']);
  const tokenB = regB.data.data.accessToken;
  const userBId = regB.data.data.user.id;

  assert(cookieA && cookieB && userAId !== userBId, 'Created two strictly isolated user identities with separate session cookies');

  // User A Uploads Secret Document
  const secretContent = Buffer.from(
    'CONFIDENTIAL REPORT: The top secret deployment key is PROJECT_APOLLO_KEY_7749. Do not share with unauthorized users.'
  );

  const docUploadA = await sendMultipart(
    '/documents',
    'secret_apollo.txt',
    secretContent,
    { name: 'Confidential Apollo Plan' },
    { Cookie: cookieA }
  );
  const docAId = docUploadA.data.data.id || docUploadA.data.data._id;
  assert(docUploadA.status === 201 && docAId, 'User A uploaded confidential document via session cookie');

  // Attacker User B attempts to access Document A details
  const bGetDocA = await request('GET', `/documents/${docAId}`, null, {
    Cookie: cookieB,
  });
  assert(bGetDocA.status === 404, 'User B blocked from GET /documents/:id of User A (Returns 404 NOT FOUND)');

  // Attacker User B attempts to delete Document A
  const bDeleteDocA = await request('DELETE', `/documents/${docAId}`, null, {
    Cookie: cookieB,
  });
  assert(bDeleteDocA.status === 404, 'User B blocked from DELETE /documents/:id of User A (Returns 404 NOT FOUND)');

  // Attacker User B attempts to retry processing Document A
  const bRetryDocA = await request('POST', `/documents/${docAId}/retry`, null, {
    Cookie: cookieB,
  });
  assert(bRetryDocA.status === 404, 'User B blocked from retry processing of User A (Returns 404 NOT FOUND)');

  // 3. RAG Retrieval Boundary Cross Attack
  console.log('\n--- 3. RAG Knowledge Isolation & Boundary Cross Audit ---');
  const bRagQuery = await request(
    'POST',
    '/documents/chat',
    {
      question: 'What is the top secret deployment key?',
      documentIds: [docAId],
    },
    { Cookie: cookieB }
  );

  assert(bRagQuery.status === 200, 'RAG endpoint responded');
  assert(
    !JSON.stringify(bRagQuery.data).includes('PROJECT_APOLLO_KEY_7749'),
    'User B RAG query CANNOT extract confidential information from User A document'
  );
  assert(
    bRagQuery.data.data.sources.length === 0,
    'User B received 0 source citations from unauthorized document'
  );

  // 4. Knowledge Collection ID Manipulation
  console.log('\n--- 4. Knowledge Collections & Search ID Manipulation Audit ---');
  const colCreateA = await request(
    'POST',
    '/knowledge/collections',
    {
      name: 'User A Secret Collection',
      description: 'Private collection belonging to User A',
      documentIds: [docAId],
    },
    { Cookie: cookieA }
  );
  const colAId = colCreateA.data.data.id || colCreateA.data.data._id;
  assert(colCreateA.status === 201 && colAId, 'User A created private knowledge collection');

  // User B attempts to read Collection A
  const bGetColA = await request('GET', `/knowledge/collections/${colAId}`, null, {
    Cookie: cookieB,
  });
  assert(bGetColA.status === 404, 'User B blocked from GET /knowledge/collections/:id of User A (404 NOT FOUND)');

  // User B attempts to update Collection A
  const bUpdateColA = await request(
    'PUT',
    `/knowledge/collections/${colAId}`,
    { name: 'Hacked Collection Name' },
    { Cookie: cookieB }
  );
  assert(bUpdateColA.status === 404, 'User B blocked from PUT /knowledge/collections/:id of User A (404 NOT FOUND)');

  // User B attempts to delete Collection A
  const bDeleteColA = await request('DELETE', `/knowledge/collections/${colAId}`, null, {
    Cookie: cookieB,
  });
  assert(bDeleteColA.status === 404, 'User B blocked from DELETE /knowledge/collections/:id of User A (404 NOT FOUND)');

  // User B attempts hybrid search targeting User A collection
  const bSearchColA = await request(
    'POST',
    '/knowledge/search',
    {
      query: 'secret deployment key',
      collectionId: colAId,
    },
    { Cookie: cookieB }
  );
  assert(bSearchColA.status === 404, 'User B blocked from searching User A collection (404 NOT FOUND)');

  // 5. Generation History ID Manipulation
  console.log('\n--- 5. AI Generation History ID Manipulation Audit ---');
  await request(
    'POST',
    '/ai/summarize',
    {
      text: 'Confidential strategic research notes for quarterly AI product releases.',
      actionType: 'summarize',
    },
    { Cookie: cookieA }
  );

  const historyListA = await request('GET', '/generations', null, {
    Cookie: cookieA
  });
  const genAItem = Array.isArray(historyListA.data.data) ? historyListA.data.data[0] : null;
  const genAId = genAItem ? (genAItem.id || genAItem._id) : null;

  if (genAId) {
    const bGetGenA = await request('GET', `/generations/${genAId}`, null, {
      Cookie: cookieB,
    });
    assert(bGetGenA.status === 404, 'User B blocked from GET /generations/:id of User A (404 NOT FOUND)');

    const bDeleteGenA = await request('DELETE', `/generations/${genAId}`, null, {
      Cookie: cookieB,
    });
    assert(bDeleteGenA.status === 404, 'User B blocked from DELETE /generations/:id of User A (404 NOT FOUND)');
  }

  // 6. Path Traversal File Upload Sanitization
  console.log('\n--- 6. Path Traversal & Malicious File Upload Sanitization ---');
  const traversalUpload = await sendMultipart(
    '/documents',
    '../../../../etc/passwd',
    Buffer.from('Root configuration traversal attempt'),
    { name: 'Path Traversal Test' },
    { Cookie: cookieB }
  );
  assert(traversalUpload.status === 201, 'Document upload handled sanitized filename safely');
  const storageKey = traversalUpload.data.data.storageKey;
  assert(
    storageKey && !storageKey.includes('..') && !storageKey.includes('/') && !storageKey.includes('\\'),
    'Storage key is safely hashed and contains no directory traversal sequences'
  );

  // 7. JWT Signature Tampering & Expiry Audit (Backward compatibility for API consumers)
  console.log('\n--- 7. Bearer Token Verification & Tampering Audit ---');
  const parts = tokenA.split('.');
  const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature12345`;

  const tamperedReq = await request('GET', '/auth/me', null, {
    Authorization: `Bearer ${tamperedToken}`,
  });
  assert(tamperedReq.status === 401, 'Tampered Bearer token rejected with 401 UNAUTHORIZED');

  const validBearerReq = await request('GET', '/auth/me', null, {
    Authorization: `Bearer ${tokenA}`,
  });
  assert(validBearerReq.status === 200, 'Valid Bearer token supported for non-browser API clients (Backward Compatibility)');

  console.log('\n=====================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
