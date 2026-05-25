const Customer = require('../models/Customer');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getCustomers = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, search, status } = req.query;

  const query = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { name: regex },
      { phone: regex },
      { address: regex },
      { brand: regex },
      { model: regex },
    ];
  }
  if (status) query.status = status;

  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Customer.countDocuments(query);

  res.json({
    success: true,
    data: { customers },
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const getCustomer = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');
  res.json({ success: true, data: { customer } });
});

const createCustomer = catchAsync(async (req, res) => {
  const { name, phone, email, company, address, brand, model, unit, installDate, service, amount } = req.body;
  if (!name || !phone) {
    throw ApiError.badRequest('Name and phone are required');
  }

  const customer = await Customer.create({
    name, phone, email, company, address, brand, model, unit, installDate,
    service: service || 'Installation',
    amount: amount || 0,
    addedBy: req.user?.name || 'System',
    addedDate: new Date().toISOString().split('T')[0],
  });

  res.status(201).json({ success: true, data: { customer } });
});

const updateCustomer = catchAsync(async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'email', 'company', 'address', 'brand', 'model',
    'unit', 'installDate', 'service', 'amount',
  ];

  const customer = await Customer.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      customer[field] = req.body[field];
    }
  });

  customer.editedBy = req.user?.name || 'System';
  customer.editedDate = new Date().toISOString().split('T')[0];

  await customer.save();
  res.json({ success: true, data: { customer } });
});

const deleteCustomer = catchAsync(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');
  res.json({ success: true, message: 'Customer deleted' });
});

const toggleCustomerStatus = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw ApiError.notFound('Customer not found');

  customer.status = customer.status === 'active' ? 'blocked' : 'active';
  customer.editedBy = req.user?.name || 'System';
  customer.editedDate = new Date().toISOString().split('T')[0];

  await customer.save();
  res.json({ success: true, data: { customer } });
});

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, toggleCustomerStatus };
