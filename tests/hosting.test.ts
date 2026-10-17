import assert from 'assert';
import {
  validateSlug,
  validateAndSanitizeHtml,
  RESERVED_SLUGS,
  BACKEND_HOSTING_PRICE_COINS,
} from '../src/services/hostingService';

console.log('--- Starting NEXORA Hosting Test Suite ---');

// 1. Slug validation tests
console.log('Testing slug validation...');
const validSlug1 = validateSlug('my-portfolio');
assert.strictEqual(validSlug1.valid, true, 'Valid slug should pass');

const validSlug2 = validateSlug('game-123');
assert.strictEqual(validSlug2.valid, true, 'Alphanumeric slug should pass');

const shortSlug = validateSlug('a');
assert.strictEqual(shortSlug.valid, false, 'Single char slug should fail');

const reservedAdmin = validateSlug('admin');
assert.strictEqual(reservedAdmin.valid, false, 'Reserved slug "admin" should fail');

const reservedTopup = validateSlug('topup');
assert.strictEqual(reservedTopup.valid, false, 'Reserved slug "topup" should fail');

const reservedCasino = validateSlug('casino');
assert.strictEqual(reservedCasino.valid, false, 'Reserved slug "casino" should fail');

const invalidChars = validateSlug('my_project!');
assert.strictEqual(invalidChars.valid, false, 'Slug with special characters should fail');

console.log('✓ All slug validation tests passed');

// 2. HTML sanitization & structure wrapping tests
console.log('Testing HTML validation and auto-wrapping...');
const rawSnippet = '<h1>Hello World</h1><p>Welcome to Nexora</p>';
const sanitized = validateAndSanitizeHtml(rawSnippet);
assert.strictEqual(sanitized.valid, true, 'Snippet should be valid');
assert.ok(sanitized.sanitized.includes('<!DOCTYPE html>'), 'Auto-wraps with DOCTYPE');
assert.ok(sanitized.sanitized.includes('<html lang="en">'), 'Auto-wraps with html tag');
assert.ok(sanitized.sanitized.includes('<h1>Hello World</h1>'), 'Preserves user markup');

const fullDoc = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hi</h1></body></html>';
const sanitizedFull = validateAndSanitizeHtml(fullDoc);
assert.strictEqual(sanitizedFull.valid, true);
assert.strictEqual(sanitizedFull.sanitized, fullDoc, 'Full HTML docs are preserved untouched');

console.log('✓ All HTML sanitization and wrapping tests passed');

// 3. Backend pricing configuration
console.log('Testing backend hosting configuration...');
assert.strictEqual(BACKEND_HOSTING_PRICE_COINS, 2500, 'Backend hosting escrow price is 2,500 Coins');
console.log('✓ Backend hosting price verified');

console.log('--- All NEXORA Hosting Tests Passed! ---');
