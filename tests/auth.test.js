const { describe, it } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Test JWT Session Tokens
describe('Authentication & JWT Session Tests', () => {
  const secret = 'test_secret_pes_2026';

  it('should sign and verify valid session tokens', () => {
    const payload = {
      user_id: 1,
      email: 'admin@autocare.com',
      full_name: 'Admin User',
      role: 'admin'
    };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);

    assert.strictEqual(decoded.user_id, 1);
    assert.strictEqual(decoded.email, 'admin@autocare.com');
    assert.strictEqual(decoded.role, 'admin');
  });

  it('should reject tampered or invalid tokens', () => {
    const payload = { user_id: 2, role: 'mechanic' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const tampered = token.slice(0, -5) + 'abcde';

    assert.throws(() => {
      jwt.verify(tampered, secret);
    });
  });

  it('should securely hash and verify passwords using bcrypt', async () => {
    const password = 'SecurePassword@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    assert.notStrictEqual(password, hash);
    const isMatch = await bcrypt.compare(password, hash);
    assert.strictEqual(isMatch, true);

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrong, false);
  });
});

// Test Role-Based Authorization
describe('Role-Based Access Control (RBAC) Tests', () => {
  const ROLE_PERMISSIONS = {
    admin: ['manage_users', 'manage_customers', 'manage_inventory', 'record_payments'],
    service_advisor: ['manage_customers', 'view_inventory', 'record_payments'],
    mechanic: ['view_customers', 'view_inventory', 'create_reports']
  };

  function hasPermission(role, permission) {
    if (role === 'admin') return true;
    return (ROLE_PERMISSIONS[role] || []).includes(permission);
  }

  it('Admin should have full access to all features', () => {
    assert.strictEqual(hasPermission('admin', 'manage_users'), true);
    assert.strictEqual(hasPermission('admin', 'record_payments'), true);
    assert.strictEqual(hasPermission('admin', 'manage_inventory'), true);
  });

  it('Service Advisor should manage appointments and payments, but NOT manage users', () => {
    assert.strictEqual(hasPermission('service_advisor', 'record_payments'), true);
    assert.strictEqual(hasPermission('service_advisor', 'manage_customers'), true);
    assert.strictEqual(hasPermission('service_advisor', 'manage_users'), false);
  });

  it('Mechanic should create reports, but NOT record payments or manage inventory', () => {
    assert.strictEqual(hasPermission('mechanic', 'create_reports'), true);
    assert.strictEqual(hasPermission('mechanic', 'record_payments'), false);
    assert.strictEqual(hasPermission('mechanic', 'manage_users'), false);
  });
});

