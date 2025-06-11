import SaleOrder from "../models/sale-order.model.js";
import redisClient from "../utils/redisClient.js";
import axiosInstance from "../utils/axiosInstance.js";

//create sale order
const createSaleOrder = async (req, res) => {
  try {
    const {
      code,
      customer,
      table,
      details,
      total,
      vat,
      discountPercent,
      discount,
      final,
      customerPayment,
      change,
      payment,
    } = req.body;

    const saleOrder = new SaleOrder({
      code,
      customer,
      table,
      details,
      total,
      vat,
      discountPercent,
      discount,
      final,
      customerPayment,
      change,
      payment,
      user: req.userData.userId,
    });

    await saleOrder.save();

    const redisKey = `sale_order:${saleOrder._id}`;
    await redisClient.set(redisKey, JSON.stringify(saleOrder));
    return res.status(201).json({
      success: true,
      message: "Sale order created successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const editSaleOrder = async (req, res) => {
  try {
    const saleOrderId = req.params.sale_order_id;
    const {
      code,
      customer,
      table,
      details,
      total,
      vat,
      discountPercent,
      discount,
      final,
      customerPayment,
      change,
      payment,
    } = req.body;

    const saleOrder = new SaleOrder({
      code,
      customer,
      table,
      details,
      total,
      vat,
      discountPercent,
      discount,
      final,
      customerPayment,
      change,
      payment,
      user: req.userData.userId,
    });

    await saleOrder.save();

    const redis = `sale_order:${saleOrderId}`;
    const deleteRedis = await redisClient.del(redis);
    const redisKey = `sale_order:${saleOrder._id}`;
    await redisClient.set(redisKey, JSON.stringify(saleOrder));
    return res.status(201).json({
      success: true,
      message: "Sale order edited successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getSaleOrderById = async (req, res, next) => {
  try {
    const saleOrderId = req.params.id;

    const saleOrder = await SaleOrder.findById(saleOrderId).populate(
      "details.product",
      "name code price"
    );

    if (!saleOrder) {
      return res
        .status(404)
        .json({ error: true, message: "Sale order not found." });
    }
    console.log(saleOrder.table);
    console.log(saleOrder.customer);
    console.log(`token: ${req.token}`);
    const responseTable = await axiosInstance(req.token).get(
      `/table/${saleOrder.table}`
    );
    const responseCustomer = await axiosInstance(req.token).get(
      `/customer/${saleOrder.customer}`
    );

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
      })),
      customer: {
        _id: responseCustomer.data._id,
        name: responseCustomer.data.name,
        code: responseCustomer.data.code,
      },
      table: {
        _id: responseTable.data._id,
        name: responseTable.data.name,
        code: responseTable.data.code,
        area: responseTable.data.area,
      },
    };

    return res.status(200).json({ error: false, data: mappedOrder });
  } catch (error) {
    error.methodName = getSaleOrderById.name;
    next(error);
  }
};

export { createSaleOrder, editSaleOrder, getSaleOrderById };
