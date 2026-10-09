import assert from 'assert';
import { ComponentType, MessageFlags } from 'discord.js';
import { featsTexts, getFeatsContainer, featsCommand } from '../src/commands/feats.js';
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
  assert.strictEqual(featsCommand.data.name, 'feats');
  assert.strictEqual(tosCommand.data.name, 'tos');
  console.log('✅ /set, /feats, and /tos slash commands verified.');

  // Test 2: Persistent Stats Persistence across calls
  console.log('Test 2: Persistent Quest Stats...');
  SessionStorage.incrementCompletedQuests(5);
  SessionStorage.incrementInProgressQuests(2);
  const stats = SessionStorage.getStats();
  assert.ok(stats.completedQuests >= 5);
  console.log('✅ Persistent stats increment verified.');

  // Test 3: Set Panel ContainerV2 Structure & Multi-Language
  console.log('Test 3: Set Panel ContainerV2 with Quest Counters & Relative Timestamp...');
  const setContainerID = getSetContainer('id');
  const setContainerEN = getSetContainer('en');

  assert.strictEqual(setContainerID.flags, MessageFlags.IsComponentsV2);
  assert.strictEqual(setContainerEN.flags, MessageFlags.IsComponentsV2);
  const setJsonID = setContainerID.components[0].toJSON();
  assert.ok(setJsonID.components[0].content.includes(setTexts.id.header));
  assert.ok(setJsonID.components[2].content.includes('Completed: **'));
  assert.ok(setJsonID.components[2].content.includes('In-Progress: **'));
  assert.ok(setJsonID.components[2].content.includes('• Last Update: <t:'));
  assert.ok(setJsonID.components[2].content.endsWith(':R>'));

  // Test 4: Feats Panel ContainerV2 Multi-Language
  console.log('Test 4: Feats Panel ContainerV2...');
  const featsID = getFeatsContainer('id');
  const featsEN = getFeatsContainer('en');

  assert.strictEqual(featsID.flags, MessageFlags.IsComponentsV2);
  assert.strictEqual(featsEN.flags, MessageFlags.IsComponentsV2);
  assert.ok(featsID.components[0].toJSON().components[0].content.includes(featsTexts.id.header));
  assert.ok(featsEN.components[0].toJSON().components[0].content.includes(featsTexts.en.header));
  console.log('✅ /feats ContainerV2 components verified.');

  // Test 5: Multilingual ToS Container
  console.log('Test 5: Multilingual ToS ContainerV2...');
  const tosID = getTosContainer('id');
  const tosEN = getTosContainer('en');

  assert.strictEqual(tosID.flags, MessageFlags.IsComponentsV2);
  assert.strictEqual(tosEN.flags, MessageFlags.IsComponentsV2);
  assert.ok(tosID.components[0].toJSON().components[0].content.includes(tosTexts.id.header));
  assert.ok(tosEN.components[0].toJSON().components[0].content.includes(tosTexts.en.header));
  console.log('✅ ID and EN ToS ContainerV2 components verified.');

  // Test 6: Webhook format safety check on invalid URL
  console.log('Test 6: Webhook safe handle on invalid URL...');
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
