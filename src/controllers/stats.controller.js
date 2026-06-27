const Order = require("../models/Order");
const ServiceBooking = require("../models/ServiceBooking");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

function extractMaxWarrantyYears(warranty) {
  if (!warranty) return 0;
  const matches = [...warranty.matchAll(/(\d+)\s*years?/gi)];
  if (!matches.length) return 0;
  return Math.max(...matches.map((m) => parseInt(m[1], 10)));
}

exports.getPublicStats = async (req, res, next) => {
  try {
    const [orderCount, bookings, products, customerCount] = await Promise.all([
      Order.countDocuments(),

      ServiceBooking.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          },
        },
      ]),

      Product.find({ warranty: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .lean(),

      Customer.countDocuments(),
    ]);

    const totalBookings = bookings[0]?.total || 0;
    const completedBookings = bookings[0]?.completed || 0;
    const uptimeGuarantee = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 99;
    const standardWarranty =
      products.length > 0 ? Math.max(...products.map((p) => extractMaxWarrantyYears(p.warranty))) : 10;

    res.json({
      success: true,
      data: {
        unitsInstalled: orderCount,
        customerCount,
        uptimeGuarantee,
        standardWarranty,
      },
    });
  } catch (err) {
    next(err);
  }
};
