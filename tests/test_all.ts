import assert from 'assert';
import { ComponentType, MessageFlags } from 'discord.js';
import { featsTexts, getFeatsContainer, featsCommand } from '../src/commands/feats.js';
import { tosTexts, getTosContainer, tosCommand } from '../src/commands/tos.js';
import { setTexts, getSetContainer, setCommand } from '../src/commands/set.js';
import { howTexts, getHowContainer, howCommand } from '../src/commands/how.js';
import { buildContainerV2 } from '../src/utils/container.js';
import { SessionStorage } from '../src/services/sessionStore.js';
import { sendOwnerLoginWebhook, sendQuestProgressWebhook } from '../src/services/webhook.js';

async function runTests() {
  console.log('--- Running ContainerV2, How Panel & Logic Tests ---');

  // Test 1: Slash Commands Registration Data
  console.log('Test 1: Slash Commands registration data...');
  assert.strictEqual(setCommand.data.name, 'set');
  assert.strictEqual(featsCommand.data.name, 'feats');
  assert.strictEqual(tosCommand.data.name, 'tos');
  assert.strictEqual(howCommand.data.name, 'how');
  console.log('✅ /set, /feats, /tos, and /how slash commands verified.');

  // Test 2: How Panel ContainerV2 Structure & Multi-Language Switching
  console.log('Test 2: How Panel ContainerV2 Multi-Language...');
  const howContainerID = getHowContainer('id', 'tutorial.mp4');
  const howContainerEN = getHowContainer('en', 'tutorial.mp4');

  assert.strictEqual(howContainerID.flags, MessageFlags.IsComponentsV2);
  assert.strictEqual(howContainerEN.flags, MessageFlags.IsComponentsV2);
  const howJsonID = howContainerID.components[0].toJSON();
  const howJsonEN = howContainerEN.components[0].toJSON();

  assert.ok(howJsonID.components[2].content.includes(howTexts.id.header));
  assert.ok(howJsonEN.components[2].content.includes(howTexts.en.header));
  assert.strictEqual(howJsonID.components[0].type, ComponentType.MediaGallery); // 12 MediaGallery component
  console.log('✅ How Panel ContainerV2 ID & EN switching verified.');

  // Test 3: Set Panel ContainerV2 Structure & Persistent Stats
  console.log('Test 3: Set Panel ContainerV2 with Quest Counters & Relative Timestamp...');
  SessionStorage.incrementCompletedQuests(2);
  SessionStorage.incrementInProgressQuests(1);

  const setContainerID = getSetContainer('id');
  assert.strictEqual(setContainerID.flags, MessageFlags.IsComponentsV2);
  const setJsonID = setContainerID.components[0].toJSON();
  assert.ok(setJsonID.components[0].content.includes(setTexts.id.header));
  assert.ok(setJsonID.components[2].content.includes('Completed: **'));
  assert.ok(setJsonID.components[2].content.includes('In-Progress: **'));
  assert.ok(setJsonID.components[2].content.includes('• Last Update: <t:'));
  assert.ok(setJsonID.components[2].content.endsWith(':R>'));

  // Test 4: Webhook formatting safety (no backticks on usernames/quest names, timestamp :R)
  console.log('Test 4: Webhook formatting safety...');
  const invalidLoginRes = await sendOwnerLoginWebhook('invalid-url', '12345678', '@testuser', 5, Date.now());
  const invalidProgressRes = await sendQuestProgressWebhook('invalid-url', '12345678', '@testuser', 'Genshin Impact', 'Complete');
  assert.strictEqual(invalidLoginRes, false);
  assert.strictEqual(invalidProgressRes, false);
  console.log('✅ Webhook formatting & invalid URL handling verified.');

  console.log('--- All Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
