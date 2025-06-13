import SaleOrder from "../models/sale-order.model.js";
import redisClient from "../utils/redisClient.js";

const reportRevenue = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.body;

    const cacheKey = `report_revenue-${from_date}-${to_date}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        error: false,
        message: "Data from Redis cache",
        data: JSON.parse(cachedData),
      });
    }

    if (!from_date || !to_date) {
      return res.status(400).json({
        error: true,
        message: "Missing 'from' or 'to' query parameters",
      });
    }

    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    const data = await SaleOrder.aggregate([
      /* 1. Lọc đơn hợp lệ */
      {
        $match: {
          created_at: { $gte: fromDate, $lte: toDate },
          isClosed: true,
          isCancel: { $ne: true },
        },
      },
      /* 2. Gom doanh thu theo branch */
      {
        $group: {
          _id: "$branch", // ObjectId chi nhánh
          total: { $sum: "$total" }, // hoặc "$final"
        },
      },
      /* 3. Join sang collection branches */
      {
        $lookup: {
          from: "branches", // tên collection của chi nhánh
          localField: "_id",
          foreignField: "_id",
          as: "branch_info",
        },
      },
      { $unwind: { path: "$branch_info", preserveNullAndEmptyArrays: true } },
      /* 4. Chỉ giữ tên & total */
      {
        $project: {
          _id: 0,
          branch: { $ifNull: ["$branch_info.name", "UNKNOWN"] },
          total: 1,
        },
      },
      /* 5. Sắp xếp theo tên cửa hàng (tuỳ bạn) */
      { $sort: { branch: 1 } },
    ]);

    const result = data.map((d, i) => ({ stt: i + 1, ...d }));

    await redisClient.set(
      cacheKey,
      JSON.stringify(result),
      "EX",
      process.env.REDIS_TTL_REPORT
    );

    res.status(200).json({
      error: false,
      data: result,
    });
  } catch (error) {
    error.methodName = reportRevenue.name;
    next(error);
  }
};

const reportRevenueOfProduct = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.body;

    const cacheKey = `report_revenue-${from_date}-${to_date}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        error: false,
        message: "Data from Redis cache",
        data: JSON.parse(cachedData),
      });
    }

    if (!from_date || !to_date) {
      return res.status(400).json({
        error: true,
        message: "Missing 'from' or 'to' query parameters",
      });
    }

    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    res.status(200).json({
      error: false,
      data: result,
    });
  } catch (error) {
    error.methodName = reportRevenueOfProduct.name;
    next(error);
  }
};

export { reportRevenue };
