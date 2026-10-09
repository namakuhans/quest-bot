import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export function createContainerV2(title: string, description: string, components: any[] = []) {
  // Using ContainerV2 structure: ActionRow with components or clean text layout
  const textContent = `### ${title}\n${description}`;
  return {
    content: textContent,
    components: components
  };
}
