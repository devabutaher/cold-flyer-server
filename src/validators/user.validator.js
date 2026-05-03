const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(10).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', null]).optional(),
  }),
});

const addAddressSchema = z.object({
  body: z.object({
    label: z.string().default('Home'),
    isDefault: z.boolean().default(false),
    fullName: z.string().min(1),
    phone: z.string().min(10),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('USA'),
    instructions: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

const updateAddressSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    label: z.string().optional(),
    isDefault: z.boolean().optional(),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    instructions: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

module.exports = { updateProfileSchema, addAddressSchema, updateAddressSchema };