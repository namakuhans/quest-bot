import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  FileBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} from 'discord.js';

export interface SectionBlock {
  title?: string;
  content: string;
}

export function buildContainerV2(options: {
  accentColor?: number;
  sections: SectionBlock[];
  actionRows?: ActionRowBuilder<any>[];
  attachmentUrl?: string;
  useMediaGallery?: boolean;
}) {
  const container = new ContainerBuilder();

  if (options.accentColor) {
    container.setAccentColor(options.accentColor);
  }

  // Add Media Gallery or File Component if attachmentUrl is specified
  if (options.attachmentUrl) {
    if (options.useMediaGallery) {
      const mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(options.attachmentUrl)
      );
      container.addMediaGalleryComponents(mediaGallery);
    } else {
      const fileComponent = new FileBuilder().setURL(options.attachmentUrl);
      container.addFileComponents(fileComponent);
    }

    const separator = new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Large)
      .setDivider(true);
    container.addSeparatorComponents(separator);
  }

  options.sections.forEach((section, index) => {
    let text = section.content;
    if (section.title) {
      text = `### ${section.title}\n${text}`;
    }

    const textDisplay = new TextDisplayBuilder().setContent(text);
    container.addTextDisplayComponents(textDisplay);

    // Add large spacing separator between sections
    if (index < options.sections.length - 1) {
      const separator = new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Large)
        .setDivider(true);
      container.addSeparatorComponents(separator);
    }
  });

  if (options.actionRows && options.actionRows.length > 0) {
    // Add separator before action row
    const separator = new SeparatorBuilder()
      .setSpacing(SeparatorSpacingSize.Large)
      .setDivider(true);
    container.addSeparatorComponents(separator);

    for (const row of options.actionRows) {
      container.addActionRowComponents(row);
    }
  }

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}
