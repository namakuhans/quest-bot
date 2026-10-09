import { ComponentType } from 'discord.js';

export interface TextDisplayComponent {
  type: ComponentType.TextDisplay; // 10
  content: string;
}

export interface SeparatorComponent {
  type: ComponentType.Separator; // 14
}

export interface ContainerComponent {
  type: ComponentType.Container; // 17
  accent_color?: number;
  components: any[];
}

export function buildContainerV2(options: {
  accentColor?: number;
  content: string;
  actionRows?: any[];
}): any[] {
  const innerComponents: any[] = [
    {
      type: ComponentType.TextDisplay,
      content: options.content
    }
  ];

  if (options.actionRows && options.actionRows.length > 0) {
    for (const row of options.actionRows) {
      innerComponents.push(row.toJSON ? row.toJSON() : row);
    }
  }

  const container: ContainerComponent = {
    type: ComponentType.Container,
    ...(options.accentColor ? { accent_color: options.accentColor } : {}),
    components: innerComponents
  };

  return [container];
}
