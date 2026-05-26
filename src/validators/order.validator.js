const { z } = require("zod");

const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          product: z.string(),
          quantity: z.number().int().positive(),
          name: z.string().optional(),
          price: z.number().optional(),
        }),
      )
      .optional(),
    shippingAddress: z.any().optional(),
    billingAddress: z.any().optional(),
    paymentMethod: z.string().optional(),
    isPickup: z.boolean().optional(),
    pickupShop: z.string().optional(),
    notes: z.string().optional(),
    couponCode: z.string().optional(),
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "refunded",
      "failed",
    ]),
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
