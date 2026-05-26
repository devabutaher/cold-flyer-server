const { z } = require("zod");

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(10).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "other", null]).optional(),
  }),
});

const addAddressSchema = z.object({
  body: z.object({
    label: z.string().default("Home"),
    isDefault: z.boolean().default(false),
    fullName: z.string().min(1),
    phone: z.string().min(10),
    district: z.string().min(1),
    thana: z.string().min(1),
    address: z.string().min(1),
    instructions: z.string().optional(),
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
    district: z.string().optional(),
    thana: z.string().optional(),
    address: z.string().optional(),
    instructions: z.string().optional(),
  }),
});

module.exports = { updateProfileSchema, addAddressSchema, updateAddressSchema };
