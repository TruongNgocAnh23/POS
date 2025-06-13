import SaleOrder from "../models/sale-order.model.js";
import redisClient from "../utils/redisClient.js";
import axiosInstance from "../utils/axiosInstance.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

//Store and Staff Performance Report
const StoreandStaffPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, userId, branch } = req.query;
    const filter = {};

    // Lọc theo khoảng thời gian
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.created_at.$lte = end;
      }
    }

    // Lọc theo nhiều user
    if (userId && userId.length > 0) {
      filter.user = { $in: userId };
    }

    // Lọc theo nhiều branch
    if (branch && branch.length > 0) {
      filter.branch = { $in: branch };
    }

    filter.isClosed = true;
    const orders = await SaleOrder.find(
      filter,
      "code final close_by closed_date total details.quantity customer"
    )
      .populate("details.product", "name code price vat price_after_vat")
      .sort({ created_at: -1 });

    const [responseCustomer] = await Promise.all([
      axiosInstance(req.token).get(`/customers`),
    ]);
    if (orders.length > 0) {
      const [responseCustomer] = await Promise.all([
        axiosInstance(req.token).get(`/customers`),
      ]);
      const customers = responseCustomer.data.data;

      const mappedOrders = orders.map((order) => {
        const customerInfo = customers.find(
          (c) => c._id?.toString() === order.customer?.toString()
        );
        return {
          _id: order._id,
          code: order.code,
          total: order.total,
          final: order.final,
          close_by: order.close_by,
          closed_date: order.closed_date,
          customer: customerInfo?.name || null,
          products: order.details.map((item) => ({
            _id: item.product?._id,
            name: item.product?.name,
            price: item.product?.price,
            vat: item.product?.vat,
            price_after_vat:
              (item.product?.price + item.product?.vat) * item.quantity || 0,
            quantity: item.quantity,
          })),
        };
      });
      return res.status(200).json({ success: true, data: mappedOrders });
    }
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching report",
      error: error.message,
    });
  }
};

const TotalRevenueReport = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;

    // const cacheKey = `report_revenue-${from_date}-${to_date}`;
    // const cachedData = await redisClient.get(cacheKey);
    // if (cachedData) {
    //   return res.status(200).json({
    //     error: false,
    //     message: "Data from Redis cache",
    //     data: JSON.parse(cachedData),
    //   });
    // }

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
          total: { $sum: "$final" }, // hoặc "$final"
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

    // await redisClient.set(
    //   cacheKey,
    //   JSON.stringify(result),
    //   "EX",
    //   process.env.REDIS_TTL_REPORT
    // );

    res.status(200).json({
      error: false,
      data: result,
    });
  } catch (error) {
    error.methodName = reportRevenue.name;
    next(error);
  }
};
const CancelledBillsReport = async (req, res) => {
  try {
    const { startDate, endDate, userId, branch } = req.body;
    const filter = {};

    // Lọc theo khoảng thời gian
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.created_at.$lte = end;
      }
    }

    // Lọc theo nhiều user
    if (userId && userId.length > 0) {
      filter.user = { $in: userId };
    }

    // Lọc theo nhiều branch
    if (branch && branch.length > 0) {
      filter.branch = { $in: branch };
    }
    filter.isCancel = true;
    const orders = await SaleOrder.find(
      filter,
      "code final close_by closed_date total details.quantity customer"
    )
      .populate("details.product", "name code price vat price_after_vat")
      .sort({ created_at: -1 });

    const [responseCustomer] = await Promise.all([
      axiosInstance(req.token).get(`/customers`),
    ]);
    if (orders.length > 0) {
      const [responseCustomer] = await Promise.all([
        axiosInstance(req.token).get(`/customers`),
      ]);
      const customers = responseCustomer.data.data;

      const mappedOrders = orders.map((order) => {
        const customerInfo = customers.find(
          (c) => c._id?.toString() === order.customer?.toString()
        );
        return {
          _id: order._id,
          code: order.code,
          total: order.total,
          final: order.final,
          close_by: order.close_by,
          closed_date: order.closed_date,
          customer: customerInfo?.name || null,
          products: order.details.map((item) => ({
            _id: item.product?._id,
            name: item.product?.name,
            price: item.product?.price,
            vat: item.product?.vat,
            price_after_vat:
              (item.product?.price + item.product?.vat) * item.quantity || 0,
            quantity: item.quantity,
          })),
        };
      });
      return res.status(200).json({ success: true, data: mappedOrders });
    }
    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching report",
      error: error.message,
    });
  }
};

const reportRevenueOfProduct = async (req, res, next) => {
  try {
    const { from_date, to_date, branch_id, user_id } = req.query;

    if (!from_date || !to_date) {
      return res.status(400).json({
        error: true,
        message: "Missing 'from' or 'to' query parameters",
      });
    }

    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    // const branchId = new mongoose.Types.ObjectId(branch_id);
    // const userId = new mongoose.Types.ObjectId(user_id);

    /* ----- 1. Xây MATCH động ----- */
    const match = {
      created_at: { $gte: fromDate, $lte: toDate },
      // isClosed: true,
      // isCancel: { $ne: true },
    };
    if (branch_id) match.branch = new mongoose.Types.ObjectId(branch_id);
    if (user_id) match.user = new mongoose.Types.ObjectId(user_id);

    /* ----- 2. Pipeline ----- */
    const data = await SaleOrder.aggregate([
      { $match: match },

      { $unwind: "$details" }, // tách từng SP

      {
        // gộp theo SP + user + branch
        $group: {
          _id: {
            product: "$details.product",
            user: "$user",
            branch: "$branch",
          },
          quantity: { $sum: "$details.quantity" },
          final: { $sum: "$final" },
          lastDate: { $max: "$created_at" },
        },
      },

      /* Join lấy tên product, user, branch */
      {
        $lookup: {
          from: "products",
          localField: "_id.product",
          foreignField: "_id",
          as: "prod",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.user",
          foreignField: "_id",
          as: "usr",
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "_id.branch",
          foreignField: "_id",
          as: "br",
        },
      },
      {
        $set: {
          product_name: { $arrayElemAt: ["$prod.name", 0] },
          username: { $arrayElemAt: ["$usr.user_name", 0] },
          branch_name: { $arrayElemAt: ["$br.name", 0] },
        },
      },

      /* fallback nếu không tìm thấy */
      {
        $project: {
          _id: 0,
          product_name: { $ifNull: ["$product_name", "UNKNOWN"] },
          branch_name: { $ifNull: ["$branch_name", "UNKNOWN"] },
          username: { $ifNull: ["$username", "UNKNOWN"] },
          quantity: 1,
          final: 1,
          lastDate: 1,
        },
      },

      { $sort: { lastDate: -1 } }, // mới nhất trước

      /* MongoDB ≥ 5: đánh STT ngay trong pipeline */
      {
        $setWindowFields: {
          sortBy: { lastDate: -1 },
          output: { stt: { $documentNumber: {} } },
        },
      },
      {
        $project: {
          stt: 1,
          branch_name: 1,
          product_name: 1,
          username: 1,
          quantity: 1,
          final: 1,
        },
      },
    ]);

    res.status(200).json({
      error: false,
      data: data,
    });
  } catch (error) {
    error.methodName = reportRevenueOfProduct.name;
    next(error);
  }
};

export {
  StoreandStaffPerformanceReport,
  TotalRevenueReport,
  CancelledBillsReport,
  reportRevenueOfProduct,
};
