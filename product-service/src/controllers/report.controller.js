import SaleOrder from "../models/sale-order.model.js";
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

export { StoreandStaffPerformanceReport };
