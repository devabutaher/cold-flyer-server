const catchAsync = require('../../utils/catchAsync');
const { getDashboardStats, getSalesAnalytics, getServiceAnalytics } = require('../../services/analytics.service');

const getDashboard = catchAsync(async (req, res) => {
  const stats = await getDashboardStats();
  res.json({ success: true, data: stats });
});

const getAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const [sales, services] = await Promise.all([
    getSalesAnalytics(start, end),
    getServiceAnalytics(start, end),
  ]);

  res.json({ success: true, data: { sales, services } });
});

module.exports = { getDashboard, getAnalytics };
