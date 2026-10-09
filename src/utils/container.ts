import {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  MessageFlags,
  AnyComponentBuilder
} from 'discord.js';

export function buildContainerV2(options: {
  accentColor?: number;
  content: string;
  actionRows?: ActionRowBuilder<any>[];
}) {
  const container = new ContainerBuilder();

  if (options.accentColor) {
    container.setAccentColor(options.accentColor);
  }

  const textDisplay = new TextDisplayBuilder().setContent(options.content);
  container.addTextDisplayComponents(textDisplay);

  if (options.actionRows && options.actionRows.length > 0) {
    for (const row of options.actionRows) {
      container.addActionRowComponents(row);
    }
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}
