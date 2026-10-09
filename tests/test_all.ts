import assert from 'assert';
import { ComponentType } from 'discord.js';
import { descTexts, getDescContainer } from '../src/commands/desc.js';
import { buildContainerV2 } from '../src/utils/container.js';
import { SessionStorage } from '../src/services/sessionStore.js';
import { sendWebhookNotification } from '../src/services/webhook.js';

async function runTests() {
  console.log('--- Running ContainerV2 & Logic Tests ---');

  // Test 1: ContainerV2 Payload Structure
  console.log('Test 1: ContainerV2 payload structure verification...');
  const testContainer = buildContainerV2({
    accentColor: 0x5865f2,
    content: 'Test content inside ContainerV2'
  });

  assert.strictEqual(testContainer[0].type, ComponentType.Container); // 17
  assert.strictEqual(testContainer[0].accent_color, 0x5865f2);
  assert.strictEqual(testContainer[0].components[0].type, ComponentType.TextDisplay); // 10
  assert.strictEqual(testContainer[0].components[0].content, 'Test content inside ContainerV2');
  console.log('✅ ContainerV2 payload structure correctly generated.');

  // Test 2: Multilingual Description Container
  console.log('Test 2: Multilingual Description ContainerV2...');
  const containerID = getDescContainer('id');
  const containerEN = getDescContainer('en');

  assert.strictEqual(containerID[0].type, ComponentType.Container);
  assert.strictEqual(containerEN[0].type, ComponentType.Container);
  assert.ok(containerID[0].components[0].content.includes(descTexts.id.title));
  assert.ok(containerEN[0].components[0].content.includes(descTexts.en.title));
  console.log('✅ ID and EN ContainerV2 components verified.');

  // Test 3: JSON SessionStorage
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
