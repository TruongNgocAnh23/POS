import SaleOrder from "../models/sale-order.model.js";
import Item from "../models/item.model.js";
import redisClient from "../utils/redisClient.js";
import axiosInstance from "../utils/axiosInstance.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

//create sale order
const createSaleOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { code, customer, table, details, total, vat, final, branch } =
      req.body;

    session.startTransaction();
    // 1. Tạo saleOrder
    const saleOrder = new SaleOrder({
      code,
      customer,
      table,
      details,
      total,
      vat,
      final,
      branch,
      user: req.userData.userId,
    });

    await saleOrder.save({ session });

    for (const prod of details) {
      const product = await Product.findById(prod.product);

      if (!product) {
        throw new Error(`Product not found: ${prod.product}`);
      }

      if (!Array.isArray(product.recipe) || product.recipe.length === 0) {
        throw new Error(`Product ${prod.product} has no recipe defined.`);
      }

      for (const component of product.recipe) {
        const itemId = component.item_id;
        const quantity = component.quantity * prod.quantity;

        const updated = await Item.findOneAndUpdate(
          {
            _id: itemId,
            inventories: {
              $elemMatch: {
                branch_id: branch,
                quantity: { $gte: quantity },
              },
            },
          },
          {
            $inc: {
              "inventories.$[inv].quantity": -quantity,
            },
            $set: {
              "inventories.$[inv].updated_at": new Date(),
            },
          },
          {
            new: true,
            session,
            arrayFilters: [
              {
                "inv.branch_id": branch,
                "inv.quantity": { $gte: quantity },
              },
            ],
          }
        );
        if (!updated) {
          throw new Error(`Không đủ tồn kho cho nguyên liệu ${itemId}`);
        }
      }
    }
    const tableStatus = {
      status: 2,
    };
    const [responseTable] = await Promise.all([
      axiosInstance(req.token).patch(`/table/${table}`, tableStatus),
    ]);
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Sale order created successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

//edit sale order
const editSaleOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const orderId = req.params.id;
    const {
      customer,
      table,
      details: newDetails,
      total,
      vat,
      final,
      branch,
    } = req.body;

    session.startTransaction();

    const existingOrder = await SaleOrder.findById(orderId).session(session);
    if (!existingOrder) throw new Error("Sale order not found!");

    const oldDetails = existingOrder.details;

    // Helper: convert to map {productId: quantity}
    const mapDetails = (details) => {
      const map = new Map();
      for (const d of details) {
        map.set(d.product.toString(), d.quantity);
      }
      return map;
    };

    const oldMap = mapDetails(oldDetails);
    const newMap = mapDetails(newDetails);

    const productIds = new Set([...oldMap.keys(), ...newMap.keys()]);

    for (const productId of productIds) {
      const oldQty = oldMap.get(productId) || 0;
      const newQty = newMap.get(productId) || 0;
      const diff = newQty - oldQty;

      if (diff === 0) continue;

      const product = await Product.findById(productId);
      if (!product || !Array.isArray(product.recipe)) {
        throw new Error(`Product not valid: ${productId}`);
      }

      for (const component of product.recipe) {
        const itemId = component.item_id;
        const qtyChange = component.quantity * diff;

        if (qtyChange === 0) continue;

        const update =
          qtyChange > 0
            ? { $inc: { "inventories.$[inv].quantity": -qtyChange } } // Trừ
            : { $inc: { "inventories.$[inv].quantity": Math.abs(qtyChange) } }; // Cộng

        const updated = await Item.findOneAndUpdate(
          {
            _id: itemId,
            inventories: {
              $elemMatch: {
                branch_id: branch,
                ...(qtyChange > 0 ? { quantity: { $gte: qtyChange } } : {}),
              },
            },
          },
          {
            ...update,
            $set: { "inventories.$[inv].updated_at": new Date() },
          },
          {
            session,
            arrayFilters: [{ "inv.branch_id": branch }],
            new: true,
          }
        );

        if (!updated && qtyChange > 0) {
          throw new Error(`Không đủ tồn kho cho nguyên liệu ${itemId}`);
        }
      }
    }

    existingOrder.customer = customer;
    existingOrder.table = table;
    existingOrder.details = newDetails;
    existingOrder.total = total;
    existingOrder.vat = vat;
    existingOrder.final = final;
    existingOrder.updatedAt = new Date();
    await existingOrder.save({ session });

    // 3. Cập nhật trạng thái bàn
    await axiosInstance(req.token).patch(`/table/${table}`, { status: 2 });

    await session.commitTransaction();
    session.endSession();
    const redisKey = `sale_order:${orderId}`;
    console.log(redisKey);
    const deleteRedis = await redisClient.del(redisKey);
    return res.status(200).json({
      success: true,
      message: "Edit succecssfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: err.message || "Lỗi hệ thống",
    });
  }
};

const getSaleOrderById = async (req, res, next) => {
  try {
    const saleOrderId = req.params.id;
    const redisKeySaleOrder = `sale_order:${saleOrderId}`;
    const cachedData = await redisClient.get(redisKeySaleOrder);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const saleOrder = await SaleOrder.findById(saleOrderId).populate(
      "details.product",
      "name code price"
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
    console.log(tableId);
    console.log(customerId);
    console.log(userId);
    console.log(`token: ${req.token}`);
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

// const test = async (req, res, next) => {
//   try {
//     const [responseTable] = await Promise.all([
//       axiosInstance(req.token).get(`/table/6847b05bf69493ecbfc1fd37`),
//     ]);
//     return res.status(200).json({ error: false, data: responseTable.data });
//   } catch (error) {
//     next(error);
//   }
// };

export { createSaleOrder, editSaleOrder, getSaleOrderById };
