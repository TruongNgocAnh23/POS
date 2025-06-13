import SaleOrder from "../models/sale-order.model.js";
import Item from "../models/item.model.js";
import redisClient from "../utils/redisClient.js";
import axiosInstance from "../utils/axiosInstance.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

//Store and Staff Performance Report
const StoreandStaffPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, userId, branch, isClosed } = req.body;

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
    if (typeof isClosed === "boolean") {
      filter.isClosed = isClosed;
    }
    const orders = await SaleOrder.find(filter)
      .populate("user", "first_name last_name")
      .populate("branch", "name code")
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sale orders",
      error: error.message,
    });
  }
};

export { StoreandStaffPerformanceReport };
