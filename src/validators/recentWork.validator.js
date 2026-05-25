const { z } = require("zod");

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
});

const recentWorkSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    excerpt: z.string().optional(),
    category: z.enum(["Installation", "Maintenance", "Repair", "Commercial", "Residential"]),
    tags: z.array(z.string()).optional(),
    image: imageSchema.optional(),
    clientName: z.string().optional(),
    completionDate: z.string().optional(),
    featured: z.boolean().optional(),
    seo: seoSchema.optional(),
  }),
});

const recentWorkQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    featured: z.coerce.boolean().optional(),
    sortBy: z.enum(["newest", "oldest", "views", "title"]).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { recentWorkSchema, recentWorkQuerySchema };
