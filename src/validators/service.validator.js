const { z } = require('zod');

const serviceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Service name is required'),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    serviceType: z.string().min(1, 'Service type is required'),
    basePrice: z.number().min(0, 'Price must be positive'),
    priceType: z.enum(['fixed', 'quote', 'hourly']).optional(),
    duration: z.string().optional(),
    includes: z.array(z.string()).optional(),
    exclusions: z.array(z.string()).optional(),
    requirements: z.string().optional(),
    qualifications: z.string().optional(),
    image: z.string().optional(),
    images: z.array(z.object({
      url: z.string(),
      isPrimary: z.boolean().optional(),
    })).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

const serviceQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    serviceType: z.string().optional(),
    featured: z.coerce.boolean().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { serviceSchema, serviceQuerySchema };