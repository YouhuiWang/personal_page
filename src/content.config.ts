import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

const profile = defineCollection({
  loader: glob({ base: './src/content/profile', pattern: '**/*.yaml' }),
  schema: z.object({
    name: z.string(),
    bio: z.object({ zh: z.string(), en: z.string() }),
    location: z.string(),
    email: z.string(),
    github: z.string(),
    socials: z
      .array(z.object({ label: z.string(), url: z.string(), icon: z.string() }))
      .default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.yaml' }),
  schema: z.object({
    title: z.object({ zh: z.string(), en: z.string() }),
    description: z.object({ zh: z.string(), en: z.string() }),
    url: z.string(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
  }),
});

const links = defineCollection({
  loader: glob({ base: './src/content/links', pattern: '**/*.yaml' }),
  schema: z.object({
    label: z.string(),
    description: z.object({ zh: z.string(), en: z.string() }),
    url: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { blog, profile, projects, links };
