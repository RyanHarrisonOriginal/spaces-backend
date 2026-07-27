import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sources = [
    {
      id: 'youtube',
      name: 'YouTube',
      provider: 'Google',
      description: 'Find videos that match each Thing brief.',
      priceCents: 600,
      billing: 'monthly' as const,
      accent: '#E03131',
      unlocks: ['video' as const],
    },
    {
      id: 'web',
      name: 'Web Search',
      provider: 'Brave / Bing',
      description: 'Pull articles, essays, and references from the open web.',
      priceCents: 400,
      billing: 'monthly' as const,
      accent: '#0B7AD1',
      unlocks: ['article' as const],
    },
    {
      id: 'images',
      name: 'Image Search',
      provider: 'Unsplash + Commons',
      description: 'Stills and reference imagery matched to your brief.',
      priceCents: 300,
      billing: 'monthly' as const,
      accent: '#FFB020',
      unlocks: ['image' as const],
    },
    {
      id: 'research',
      name: 'Wide Gather',
      provider: 'SPACE',
      description:
        'Takes more time and casts a wider net across every source you subscribe to.',
      priceCents: 1200,
      billing: 'monthly' as const,
      accent: '#1FAE5B',
      unlocks: ['video' as const, 'article' as const, 'image' as const],
    },
  ];

  for (const source of sources) {
    await prisma.source.upsert({
      where: { id: source.id },
      create: {
        id: source.id,
        name: source.name,
        provider: source.provider,
        description: source.description,
        priceCents: source.priceCents,
        billing: source.billing,
        accent: source.accent,
        unlocks: {
          create: source.unlocks.map((contentType) => ({ contentType })),
        },
      },
      update: {
        name: source.name,
        provider: source.provider,
        description: source.description,
        priceCents: source.priceCents,
        billing: source.billing,
        accent: source.accent,
        isActive: true,
      },
    });

    for (const contentType of source.unlocks) {
      await prisma.sourceUnlock.upsert({
        where: {
          sourceId_contentType: { sourceId: source.id, contentType },
        },
        create: { sourceId: source.id, contentType },
        update: {},
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
