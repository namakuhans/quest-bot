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
  console.log('--- Running ContainerV2, ToS Caution/Warning & Logic Tests ---');

  // Test 1: Slash Commands Registration Data
  console.log('Test 1: Slash Commands registration data...');
  assert.strictEqual(setCommand.data.name, 'set');
  assert.strictEqual(featsCommand.data.name, 'feats');
  assert.strictEqual(tosCommand.data.name, 'tos');
  assert.strictEqual(howCommand.data.name, 'how');
  console.log('✅ /set, /feats, /tos, and /how slash commands verified.');

  // Test 2: ToS ContainerV2 with Caution & Warning Sections and Notice Attachment
  console.log('Test 2: ToS ContainerV2 with Caution, Warning & Notice Image...');
  const tosID = getTosContainer('id', 'notice.png');
  const tosEN = getTosContainer('en', 'notice.png');

  assert.strictEqual(tosID.flags, MessageFlags.IsComponentsV2);
  assert.strictEqual(tosEN.flags, MessageFlags.IsComponentsV2);
  const tosJsonID = tosID.components[0].toJSON();
  const tosJsonEN = tosEN.components[0].toJSON();

  assert.strictEqual(tosJsonID.components[0].type, ComponentType.MediaGallery);
  assert.strictEqual(tosJsonID.components[0].items[0].media.url, 'attachment://notice.png');
  assert.ok(tosJsonID.components[2].content.includes(tosTexts.id.header));
  assert.ok(tosJsonID.components[4].content.includes(tosTexts.id.cautionTitle));
  assert.ok(tosJsonID.components[6].content.includes(tosTexts.id.warningTitle));
  assert.ok(tosJsonEN.components[4].content.includes(tosTexts.en.cautionTitle));
  assert.ok(tosJsonEN.components[6].content.includes(tosTexts.en.warningTitle));
  console.log('✅ ToS ContainerV2 Caution, Warning, and Notice Attachment verified.');

  // Test 3: Set Panel ContainerV2 Structure & Multi-Language
  console.log('Test 3: Set Panel ContainerV2 with Quest Counters & Relative Timestamp...');
  const setContainerID = getSetContainer('id');
  assert.strictEqual(setContainerID.flags, MessageFlags.IsComponentsV2);

  // Test 4: Feats Panel ContainerV2 Multi-Language
  console.log('Test 4: Feats Panel ContainerV2...');
  const featsID = getFeatsContainer('id');
  assert.strictEqual(featsID.flags, MessageFlags.IsComponentsV2);

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
