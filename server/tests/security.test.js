import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateUrlForSSRF, isPrivateIPv4, isPrivateIPv6 } from '../utils/urlValidator.js';
import { escapeRegex } from '../validators/postValidators.js';

describe('SSRF Protection & IP Validation Tests', () => {
  it('should identify private IPv4 ranges correctly', () => {
    assert.strictEqual(isPrivateIPv4('127.0.0.1'), true);
    assert.strictEqual(isPrivateIPv4('127.0.1.5'), true);
    assert.strictEqual(isPrivateIPv4('10.0.0.1'), true);
    assert.strictEqual(isPrivateIPv4('10.254.254.254'), true);
    assert.strictEqual(isPrivateIPv4('172.16.0.1'), true);
    assert.strictEqual(isPrivateIPv4('172.31.255.255'), true);
    assert.strictEqual(isPrivateIPv4('192.168.1.1'), true);
    assert.strictEqual(isPrivateIPv4('169.254.169.254'), true); // AWS/GCP Metadata
    assert.strictEqual(isPrivateIPv4('0.0.0.0'), true);
    assert.strictEqual(isPrivateIPv4('8.8.8.8'), false); // Public DNS
    assert.strictEqual(isPrivateIPv4('1.1.1.1'), false); // Public DNS
    assert.strictEqual(isPrivateIPv4('93.184.216.34'), false); // example.com
  });

  it('should identify private IPv6 ranges correctly', () => {
    assert.strictEqual(isPrivateIPv6('::1'), true);
    assert.strictEqual(isPrivateIPv6('fe80::1'), true);
    assert.strictEqual(isPrivateIPv6('fc00::1'), true);
    assert.strictEqual(isPrivateIPv6('::ffff:127.0.0.1'), true);
  });

  it('should reject loopback localhost URLs', async () => {
    const res = await validateUrlForSSRF('http://localhost:8080/api/v1/health');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reason.includes('forbidden') || res.reason.includes('internal'));
  });

  it('should reject direct 127.0.0.1 loopback URLs', async () => {
    const res = await validateUrlForSSRF('http://127.0.0.1:3000/secret');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reason.includes('private, loopback, or cloud metadata'));
  });

  it('should reject AWS / Cloud Metadata endpoint 169.254.169.254', async () => {
    const res = await validateUrlForSSRF('http://169.254.169.254/latest/meta-data/');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reason.includes('private, loopback, or cloud metadata'));
  });

  it('should reject private LAN addresses (10.x and 192.168.x)', async () => {
    const res10 = await validateUrlForSSRF('http://10.0.0.5:8080');
    const res192 = await validateUrlForSSRF('http://192.168.1.1/admin');
    assert.strictEqual(res10.isValid, false);
    assert.strictEqual(res192.isValid, false);
  });

  it('should reject non-HTTP protocols (file:, ftp:, gopher:, javascript:)', async () => {
    const resFile = await validateUrlForSSRF('file:///etc/passwd');
    const resFtp = await validateUrlForSSRF('ftp://files.example.com');
    const resJs = await validateUrlForSSRF('javascript:alert(1)');
    assert.strictEqual(resFile.isValid, false);
    assert.strictEqual(resFtp.isValid, false);
    assert.strictEqual(resJs.isValid, false);
    assert.ok(resFile.reason.includes('Disallowed protocol'));
  });

  it('should accept valid public HTTPS URLs', async () => {
    const res = await validateUrlForSSRF('https://example.com/article/1');
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.sanitizedUrl, 'https://example.com/article/1');
  });
});

describe('MongoDB Input Safety & Regex Sanitization Tests', () => {
  it('should escape all regex special characters', () => {
    const dangerousInput = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(dangerousInput);
    assert.strictEqual(escaped, '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('should neutralize ReDoS pattern attempts', () => {
    const redosPayload = '(a+)+$';
    const escaped = escapeRegex(redosPayload);
    assert.strictEqual(escaped, '\\(a\\+\\)\\+\\$');
    // Ensure it can safely compile as a literal regex
    assert.doesNotThrow(() => new RegExp(escaped, 'i'));
  });
});
