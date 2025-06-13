import SaleOrder from "../models/sale-order.model.js";
import Item from "../models/item.model.js";
import redisClient from "../utils/redisClient.js";
import axiosInstance from "../utils/axiosInstance.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

//Store and Staff Performance Report
const StoreandStaffPerformanceReport = async (req, res, next) => {
  try {
    // const redisKeySaleOrder = `sale_order:${saleOrderId}`;
    // const cachedData = await redisClient.get(redisKeySaleOrder);
    // if (cachedData) {
    //   const parsed = JSON.parse(cachedData);
    //   return res.status(200).json({
    //     success: true,
    //     data: parsed,
    //     source: "cache",
    //   });
    // }
    const saleOrder = await SaleOrder.findById(saleOrderId).populate(
      "details.product",
      "name code price tax_rate vat price_after_vat"
    );
    if (!saleOrder) {
      return res
        .status(404)
        .json({ error: true, message: "Sale order not found." });
    }

    const tableId = saleOrder.table?.toString?.();
    const customerId = saleOrder.customer?.toString?.();
    const userId = saleOrder.user?.toString?.();
    const [responseTable, responseCustomer, responseUser] = await Promise.all([
      axiosInstance(req.token).get(`/table/${tableId}`),
      axiosInstance(req.token).get(`/customer/${customerId}`),
      axiosInstance(req.token).get(`/profile/${userId}`),
    ]);
    const mappedOrder = {
      _id: saleOrder._id,
      code: saleOrder.code,
      total: saleOrder.total,
      vat: saleOrder.vat,
      discountPercent: saleOrder.discountPercent,
      discount: saleOrder.discount,
      final: saleOrder.final,
      customerPayment: saleOrder.customerPayment,
      change: saleOrder.change,
      payment: saleOrder.payment,
      notes: saleOrder.notes,
      products: saleOrder.details.map((item) => ({
        product_id: item.product._id,
        name: item.product.name,
        code: item.product.code,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        isServed: item.isServed,
        vat_rate: item.product.tax_rate,
        vat: item.product.vat,
        price_after_vat: item.product.price_after_vat,
      })),
      customer: {
        name: responseCustomer.data.data.name,
        customer_id: responseCustomer.data.data._id,
      },
      table: {
        name: responseTable.data.data.name,
        table_id: responseTable.data.data._id,
        area_id: responseTable.data.data.area._id,
        area_name: responseTable.data.data.area.name,
      },
      user: {
        user_id: responseUser.data.data._id,
        first_name: responseUser.data.data.first_name,
        last_name: responseUser.data.data.last_name,
      },
    };
    const redisKey = `sale_order:${mappedOrder._id}`;
    await redisClient.set(redisKey, JSON.stringify(mappedOrder));
    return res
      .status(200)
      .json({ error: false, data: mappedOrder, source: "db" });
  } catch (error) {
    error.methodName = getSaleOrderById.name;
    next(error);
  }
};

export {
  createSaleOrder,
  editSaleOrder,
  getSaleOrderById,
  getPaginatedSaleOrder,
};
