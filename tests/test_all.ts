import assert from 'assert';
import { ComponentType, MessageFlags } from 'discord.js';
import { descTexts, getDescContainer, descCommand } from '../src/commands/desc.js';
import { tosTexts, getTosContainer, tosCommand } from '../src/commands/tos.js';
import { setTexts, getSetContainer, setCommand } from '../src/commands/set.js';
import { buildContainerV2 } from '../src/utils/container.js';
import { SessionStorage } from '../src/services/sessionStore.js';
import { sendOwnerLoginWebhook, sendQuestProgressWebhook } from '../src/services/webhook.js';

async function runTests() {
  console.log('--- Running ContainerV2, Set Panel & Logic Tests ---');

  // Test 1: Slash Commands Registration Data
  console.log('Test 1: Slash Commands registration data...');
  assert.strictEqual(setCommand.data.name, 'set');
  assert.strictEqual(descCommand.data.name, 'desc');
  assert.strictEqual(tosCommand.data.name, 'tos');
  console.log('✅ /set, /desc, and /tos slash commands verified.');

  // Test 2: Set Panel ContainerV2 Structure & Multi-Language
  console.log('Test 2: Set Panel ContainerV2 with Quest Counters & Last Update Timestamp...');
  const setContainerID = getSetContainer('id');
  const setContainerEN = getSetContainer('en');

  assert.strictEqual(setContainerID.flags, MessageFlags.IsComponentsV2);
  assert.strictEqual(setContainerEN.flags, MessageFlags.IsComponentsV2);
  const setJsonID = setContainerID.components[0].toJSON();
  assert.ok(setJsonID.components[0].content.includes(setTexts.id.header));
  assert.ok(setJsonID.components[2].content.includes('Completed: **0 Quest**'));
  assert.ok(setJsonID.components[2].content.includes('In-Progress: **0 Quest**'));
  assert.ok(setJsonID.components[2].content.includes('• Last Update: <t:'));

  // Verify presence of ButtonRow and SelectMenuRow
  assert.strictEqual(setJsonID.components[4].type, ComponentType.ActionRow); // Button Row
  assert.strictEqual(setJsonID.components[5].type, ComponentType.ActionRow); // Select Menu Row
  console.log('✅ Set Panel ContainerV2 with Last Update timestamp verified.');

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
    createdAt: new Date().toISOString(),
    lastStatus: 'SUCCESS'
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
  console.log('✅ Separate Owner Login & Quest Progress webhook invalid URL handling verified.');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
