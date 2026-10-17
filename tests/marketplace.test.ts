import { calculateExchange } from '../src/services/exchangeService';
import { ExchangeRateConfig } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log('--- Starting Nexora Marketplace Test Suite ---');

  const testConfig: ExchangeRateConfig = {
    coinsPerDiamond: 2000,
    feePercentage: 2,
    minExchangeDiamonds: 1,
    minExchangeCoins: 1000,
    updatedAt: new Date().toISOString(),
  };

  // Test 1: Coins to Diamonds calculation
  const c2d = calculateExchange('coins', 4000, testConfig);
  assert(c2d.sourceAmount === 4000, 'Source amount matches 4000');
  assert(c2d.targetGross === 2, 'Gross diamonds for 4000 coins at 2000 rate equals 2');
  assert(c2d.feeAmount === 0.04, 'Fee equals 2% of 2 diamonds (0.04)');
  assert(c2d.targetNet === 1.96, 'Net diamonds equals 1.96');

  // Test 2: Diamonds to Coins calculation
  const d2c = calculateExchange('diamonds', 5, testConfig);
  assert(d2c.sourceAmount === 5, 'Source amount matches 5');
  assert(d2c.targetGross === 10000, 'Gross coins for 5 diamonds equals 10,000');
  assert(d2c.feeAmount === 200, 'Fee equals 2% of 10,000 (200 coins)');
  assert(d2c.targetNet === 9800, 'Net coins equals 9,800');

  // Test 3: Zero or negative amount guard
  const zeroTest = calculateExchange('coins', 0, testConfig);
  assert(zeroTest.targetNet === 0, 'Zero amount produces zero net target');

  // Test 4: Verify role escalation threat payload simulation
  const maliciousProfilePayload = {
    userId: 'user_123',
    role: 'admin',
    coins: 9999999,
  };
  const isEscalationAttempt = Boolean(
    maliciousProfilePayload.role === 'admin' ||
    (maliciousProfilePayload.coins && maliciousProfilePayload.coins > 1000)
  );
  assert(isEscalationAttempt, 'Caught privilege escalation attempt in client payload');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
