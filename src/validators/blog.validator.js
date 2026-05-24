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

const blogSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Blog title is required"),
    excerpt: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    category: z.enum(["Maintenance", "Buying Guide", "Smart Home", "Tips", "News"]),
    tags: z.array(z.string()).optional(),
    image: imageSchema.optional(),
    featured: z.boolean().optional(),
    seo: seoSchema.optional(),
  }),
});

const blogQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    featured: z.coerce.boolean().optional(),
    sortBy: z.enum(["newest", "oldest", "views", "title"]).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { blogSchema, blogQuerySchema };
