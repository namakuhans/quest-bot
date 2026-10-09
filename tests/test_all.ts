import assert from 'assert';
import { ComponentType, MessageFlags } from 'discord.js';
import { descTexts, getDescContainer, descCommand } from '../src/commands/desc.js';
import { tosTexts, getTosContainer, tosCommand } from '../src/commands/tos.js';
import { setCommand } from '../src/commands/set.js';
import { buildContainerV2 } from '../src/utils/container.js';
import { SessionStorage } from '../src/services/sessionStore.js';
import { sendOwnerLoginWebhook, sendQuestProgressWebhook } from '../src/services/webhook.js';

async function runTests() {
  console.log('--- Running ContainerV2, Webhook & Logic Tests ---');

  // Test 1: Slash Commands Registration Data
  console.log('Test 1: Slash Commands registration data...');
  assert.strictEqual(setCommand.data.name, 'set');
  assert.strictEqual(descCommand.data.name, 'desc');
  assert.strictEqual(tosCommand.data.name, 'tos');
  console.log('✅ /set, /desc, and /tos slash commands verified.');

  // Test 2: ContainerV2 Payload Structure with Separators and MessageFlags
  console.log('Test 2: ContainerV2 payload structure with Separators & MessageFlags...');
  const testContainer = buildContainerV2({
    accentColor: 0x5865f2,
    sections: [
      { title: 'Section 1', content: 'Content 1' },
      { title: 'Section 2', content: 'Content 2' }
    ]
  });

  assert.strictEqual(testContainer.flags, MessageFlags.IsComponentsV2); // 32768
  const containerJson = testContainer.components[0].toJSON();
  assert.strictEqual(containerJson.type, ComponentType.Container); // 17
  assert.strictEqual(containerJson.accent_color, 0x5865f2);
  assert.strictEqual(containerJson.components[0].type, ComponentType.TextDisplay); // 10
  assert.strictEqual(containerJson.components[1].type, ComponentType.Separator); // 14
  assert.strictEqual(containerJson.components[2].type, ComponentType.TextDisplay); // 10
  console.log('✅ ContainerV2 payload structure verified.');

  // Test 3: Multilingual Description & ToS Container
  console.log('Test 3: Multilingual ToS ContainerV2...');
  const tosID = getTosContainer('id');
  const tosEN = getTosContainer('en');

  assert.strictEqual(tosID.flags, MessageFlags.IsComponentsV2);
  assert.strictEqual(tosEN.flags, MessageFlags.IsComponentsV2);
  assert.ok(tosID.components[0].toJSON().components[0].content.includes(tosTexts.id.header));
  assert.ok(tosEN.components[0].toJSON().components[0].content.includes(tosTexts.en.header));
  console.log('✅ ID and EN ToS ContainerV2 components verified.');

  // Test 4: JSON SessionStorage
  console.log('Test 4: JSON SessionStorage...');
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

  // Test 5: Webhook format safety check on invalid URL
  console.log('Test 5: Webhook safe handle on invalid URL...');
  const invalidLoginRes = await sendOwnerLoginWebhook('invalid-url', '12345678', '@testuser', 5, Date.now());
  const invalidProgressRes = await sendQuestProgressWebhook('invalid-url', '12345678', '@testuser', 'Genshin Impact', 'Complete');
  assert.strictEqual(invalidLoginRes, false);
  assert.strictEqual(invalidProgressRes, false);
  console.log('✅ Owner Login & Quest Progress webhook invalid URL handling verified.');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
