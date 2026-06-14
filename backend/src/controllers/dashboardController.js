const Application = require('../models/Application');

// Helper to get month name
const getMonthName = (monthNumber) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNumber - 1] || '';
};

// @desc    Get dashboard metrics & analytics
// @route   GET /api/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Cards Metrics
    const totalApplications = await Application.countDocuments({});
    const todayApplications = await Application.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });
    const newApplications = await Application.countDocuments({ status: 'New' });
    const shortlistedApplications = await Application.countDocuments({ status: 'Shortlisted' });
    const rejectedApplications = await Application.countDocuments({ status: 'Rejected' });
    const selectedApplications = await Application.countDocuments({ status: 'Selected' });

    // Analytics: Monthly application chart (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAggregate = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    // Format Monthly Stats (ensure zero counts for months with no applications)
    const monthlyStats = [];
    const tempDate = new Date(sixMonthsAgo);
    const today = new Date();

    while (tempDate <= today) {
      const year = tempDate.getFullYear();
      const month = tempDate.getMonth() + 1; // JS month is 0-indexed, Mongo is 1-indexed

      const matched = monthlyAggregate.find(
        (item) => item._id.year === year && item._id.month === month
      );

      monthlyStats.push({
        name: `${getMonthName(month)} ${year.toString().slice(-2)}`,
        applications: matched ? matched.count : 0,
      });

      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    // Analytics: Position-wise application chart
    const positionAggregate = await Application.aggregate([
      {
        $group: {
          _id: '$preferredJobRole',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10, // Top 10 positions
      },
    ]);

    const positionStats = positionAggregate.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // Analytics: Status distribution chart
    const statusAggregate = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = statusAggregate.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // Ensure all standard statuses exist in distribution for consistency on the UI
    const defaultStatuses = [
      'New',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Selected',
      'Rejected',
    ];
    defaultStatuses.forEach((status) => {
      const exists = statusStats.some((item) => item.name === status);
      if (!exists) {
        statusStats.push({ name: status, value: 0 });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        cards: {
          total: totalApplications,
          today: todayApplications,
          new: newApplications,
          shortlisted: shortlistedApplications,
          rejected: rejectedApplications,
          selected: selectedApplications,
        },
        charts: {
          monthly: monthlyStats,
          position: positionStats,
          status: statusStats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
