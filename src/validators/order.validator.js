const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product: z.string(),
      quantity: z.number().min(1),
      variant: z.object({
        variantId: z.string().optional(),
        options: z.array(z.object({
          label: z.string(),
          value: z.string(),
        })).optional(),
      }).optional(),
    })).min(1, 'At least one item is required'),
    shippingAddress: z.object({
      fullName: z.string().min(1),
      phone: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().optional(),
      instructions: z.string().optional(),
    }).optional(),
    billingAddress: z.object({
      fullName: z.string().min(1),
      phone: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().optional(),
    }).optional(),
    paymentMethod: z.enum(['card', 'paypal', 'bank_transfer', 'cod', 'wallet']).optional(),
    isPickup: z.boolean().optional(),
    pickupShop: z.string().optional(),
    notes: z.string().optional(),
    couponCode: z.string().optional(),
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'failed']),
    note: z.string().optional(),
  }),
});

const orderQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

module.exports = { createOrderSchema, updateOrderStatusSchema, orderQuerySchema };