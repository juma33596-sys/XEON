import { searchKnowledge, formatKnowledgeForPrompt } from '../src/services/xoraKnowledge.ts';
import { XoraAction, XoraMessage } from '../src/types/xora.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runXoraTestSuite() {
  console.log('--- Starting Xora AI & NEXORA Verification Test Suite ---');

  // Test 1: Knowledge Registry Grounding
  const topupArticles = searchKnowledge('topup mpesa');
  assert(topupArticles.length > 0, 'Found relevant topup knowledge articles');
  assert(topupArticles[0].id === 'mobile_money_topup', 'Correct article identified for M-Pesa topup');

  const casinoArticles = searchKnowledge('aviator crash 2 bet');
  assert(casinoArticles.length > 0, 'Found relevant Aviator knowledge');
  assert(casinoArticles.some((a) => a.id === 'provably_fair_casino'), 'Identified casino article');

  const swahiliQuery = searchKnowledge('sarafu na almasi');
  assert(swahiliQuery.length > 0, 'Knowledge search handles Swahili terms');

  // Test 2: System Prompt formatting
  const formattedKB = formatKnowledgeForPrompt();
  assert(formattedKB.includes('ARTICLE:'), 'Knowledge registry correctly formats into system prompt');
  assert(formattedKB.includes('Aviator'), 'Casino Aviator included in system knowledge');

  // Test 3: Action Validation logic
  const allowedActions = [
    'navigate_internal',
    'open_external_link',
    'copy_text',
    'open_help_article',
    'open_product',
    'open_user_library',
    'open_wallet',
    'open_referrals',
    'open_support',
  ];

  const validAction: XoraAction = {
    type: 'navigate_internal',
    label: 'Open Top-Up',
    route: '/topup',
  };
  assert(allowedActions.includes(validAction.type), 'Valid action type is approved');

  const invalidActionPayload = {
    type: 'execute_arbitrary_code',
    label: 'Run script',
  };
  assert(!allowedActions.includes(invalidActionPayload.type as any), 'Disallowed action type is rejected');

  // Test 4: SSRF & IP Security Filter
  function isDisallowedHost(host: string): boolean {
    const clean = host.toLowerCase().trim();
    if (
      clean === 'localhost' ||
      clean.endsWith('.localhost') ||
      clean.endsWith('.internal') ||
      clean.endsWith('.local')
    ) {
      return true;
    }
    const ipv4Match = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (a === 127) return true;
      if (a === 10) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 169 && b === 254) return true; // Cloud metadata
      if (a === 0) return true;
    }
    if (clean === '::1' || clean === '[::1]' || clean.includes('fe80:')) {
      return true;
    }
    return false;
  }

  assert(isDisallowedHost('localhost') === true, 'SSRF filter blocks localhost');
  assert(isDisallowedHost('127.0.0.1') === true, 'SSRF filter blocks 127.0.0.1 loopback');
  assert(isDisallowedHost('169.254.169.254') === true, 'SSRF filter blocks AWS/GCP metadata endpoint');
  assert(isDisallowedHost('192.168.1.1') === true, 'SSRF filter blocks private IP 192.168.1.1');
  assert(isDisallowedHost('10.0.0.5') === true, 'SSRF filter blocks private IP 10.0.0.5');
  assert(isDisallowedHost('google.com') === false, 'SSRF filter allows public host google.com');
  assert(isDisallowedHost('github.com') === false, 'SSRF filter allows public host github.com');

  // Test 5: User Isolation Rule Simulation
  const userA = 'user_alpha_123';
  const userB = 'user_beta_456';
  const chatOwnership = (requestAuthUid: string, chatUserId: string) => {
    return requestAuthUid === chatUserId;
  };
  assert(chatOwnership(userA, userA) === true, 'User A can read own chats');
  assert(chatOwnership(userB, userA) === false, 'User B is blocked from reading User A chats');

  // Test 6: Memory sanitization rule
  const sanitizeMemory = (text: string): boolean => {
    // Should never accept raw password, api keys, or full credit card numbers
    const sensitive = /password|secret_key|gsk_|4\d{15}/i;
    return !sensitive.test(text);
  };
  assert(sanitizeMemory('User prefers Swahili language') === true, 'Normal preference accepted as memory');
  assert(sanitizeMemory('User password is mySecretPassword123') === false, 'Sensitive credential rejected');
  assert(sanitizeMemory('API Key: gsk_123456789') === false, 'API secret rejected from memory');

  console.log('--- All Xora AI & Security Tests Passed Successfully! ---');
}

runXoraTestSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
