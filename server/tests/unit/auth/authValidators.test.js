import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateRegisterInput,
  validateLoginInput,
  validateChangePasswordInput,
} from '../../../validators/authValidators.js';
import { ValidationError } from '../../../utils/errors.js';

describe('Auth Validators Unit Tests', () => {
  it('should accept valid registration input', () => {
    const res = validateRegisterInput({
      name: 'Alice Johnson',
      email: 'Alice.J@Example.Com',
      password: 'SecurePassword123!',
    });

    assert.strictEqual(res.name, 'Alice Johnson');
    assert.strictEqual(res.email, 'alice.j@example.com');
    assert.strictEqual(res.password, 'SecurePassword123!');
  });

  it('should reject invalid email in registration', () => {
    assert.throws(
      () => validateRegisterInput({ name: 'Alice', email: 'not-an-email', password: 'password123' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'INVALID_EMAIL');
        return true;
      }
    );
  });

  it('should reject weak password (<8 chars)', () => {
    assert.throws(
      () => validateRegisterInput({ name: 'Alice', email: 'alice@example.com', password: 'short' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'WEAK_PASSWORD');
        return true;
      }
    );
  });

  it('should validate login input', () => {
    const res = validateLoginInput({
      email: 'User@Example.Com',
      password: 'mypassword',
    });

    assert.strictEqual(res.email, 'user@example.com');
    assert.strictEqual(res.password, 'mypassword');
  });

  it('should reject empty password in login', () => {
    assert.throws(
      () => validateLoginInput({ email: 'user@example.com', password: '' }),
      (err) => {
        assert.ok(err instanceof ValidationError);
        assert.strictEqual(err.code, 'EMPTY_PASSWORD');
        return true;
      }
    );
  });

  it('should validate change password input', () => {
    const res = validateChangePasswordInput({
      currentPassword: 'OldPassword123',
      newPassword: 'NewStrongPassword456',
    });

    assert.strictEqual(res.currentPassword, 'OldPassword123');
    assert.strictEqual(res.newPassword, 'NewStrongPassword456');
  });
});
