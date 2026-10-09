import assert from 'assert';
import { setCommand } from '../src/commands/set.js';
import { descCommand, descTexts } from '../src/commands/desc.js';
import { SessionStorage } from '../src/services/sessionStore.js';
import { sendWebhookNotification } from '../src/services/webhook.js';

async function runTests() {
  console.log('--- Running Tests ---');

  // Test 1: Command Data Structures
  console.log('Test 1: Slash Commands registration data...');
  assert.strictEqual(setCommand.data.name, 'set');
  assert.strictEqual(descCommand.data.name, 'desc');
  console.log('✅ Slash command names verified.');

  // Test 2: Multilingual Description Texts
  console.log('Test 2: Multilingual Texts...');
  assert.ok(descTexts.id.title.length > 0);
  assert.ok(descTexts.en.title.length > 0);
  console.log('✅ ID and EN texts verified.');

  // Test 3: SessionStorage operations
  console.log('Test 3: JSON SessionStorage...');
  const testUser = {
    userId: 'test_user_123',
    token: 'test_token_abc',
    webhookUrl: 'https://discord.com/api/webhooks/test',
    createdAt: new Date().toISOString()
  };
  SessionStorage.saveSession(testUser);
  const sessions = SessionStorage.getSessions();
  const found = sessions.find((s) => s.userId === 'test_user_123');
  assert.ok(found);
  assert.strictEqual(found?.token, 'test_token_abc');
  SessionStorage.removeSession('test_user_123');
  const sessionsAfterDelete = SessionStorage.getSessions();
  assert.strictEqual(sessionsAfterDelete.find((s) => s.userId === 'test_user_123'), undefined);
  console.log('✅ SessionStorage save and remove verified.');

  // Test 4: Webhook format safety check
  console.log('Test 4: Webhook safe handle on invalid URL...');
  const invalidResult = await sendWebhookNotification('invalid-url', 'User#0000', 'Test Quest');
  assert.strictEqual(invalidResult, false);
  console.log('✅ Webhook invalid URL handling verified.');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
