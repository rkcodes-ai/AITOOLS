import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../../utils/jwt.js';

describe('JWT Utilities Unit Tests', () => {
  const sampleUser = {
    _id: '64f1a2b3c4d5e6f7a8b9c0d1',
    name: 'Alice User',
    email: 'alice@example.com',
    role: 'user',
  };

  it('should generate and verify valid access token', () => {
    const token = generateAccessToken(sampleUser);
    assert.strictEqual(typeof token, 'string');
    assert.ok(token.length > 20);

    const decoded = verifyToken(token);
    assert.ok(decoded);
    assert.strictEqual(decoded.sub, sampleUser._id);
    assert.strictEqual(decoded.name, sampleUser.name);
    assert.strictEqual(decoded.email, sampleUser.email);
    assert.strictEqual(decoded.role, 'user');
  });

  it('should generate and verify valid refresh token', () => {
    const token = generateRefreshToken(sampleUser);
    assert.strictEqual(typeof token, 'string');

    const decoded = verifyToken(token);
    assert.ok(decoded);
    assert.strictEqual(decoded.sub, sampleUser._id);
    assert.strictEqual(decoded.type, 'refresh');
  });

  it('should return null for tampered or invalid token', () => {
    const invalidToken = 'invalid.token.signature';
    const decoded = verifyToken(invalidToken);
    assert.strictEqual(decoded, null);
  });
});
