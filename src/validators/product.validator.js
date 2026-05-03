const { z } = require('zod');

const productSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(0, 'Price must be positive'),
    originalPrice: z.number().optional(),
    sku: z.string().min(1, 'SKU is required'),
    productType: z.enum(['unit', 'part', 'accessory']),
    category: z.string().min(1, 'Category is required'),
    brand: z.string().min(1, 'Brand is required'),
    stock: z.number().optional(),
    images: z.array(z.object({
      url: z.string(),
      isPrimary: z.boolean().optional(),
    })).optional(),
    specs: z.object({
      capacity: z.string().optional(),
      voltage: z.string().optional(),
      powerInput: z.string().optional(),
      coverageArea: z.string().optional(),
      noiseLevel: z.string().optional(),
      refrigerant: z.string().optional(),
      starRating: z.string().optional(),
      compressorType: z.string().optional(),
      dimensions: z.string().optional(),
      weight: z.string().optional(),
    }).optional(),
    features: z.array(z.string()).optional(),
    warranty: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

const productQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    productType: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    minRating: z.coerce.number().optional(),
    inStock: z.coerce.boolean().optional(),
    onSale: z.coerce.boolean().optional(),
    featured: z.coerce.boolean().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { productSchema, productQuerySchema };