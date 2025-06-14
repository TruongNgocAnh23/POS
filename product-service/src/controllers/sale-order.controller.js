import SaleOrder from "../models/sale-order.model.js";
import Item from "../models/item.model.js";
import redisClient from "../utils/redisClient.js";
import axiosInstance from "../utils/axiosInstance.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import generateCode from "../utils/generateCode.js";

//create sale order
const createSaleOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { customer, table, details, total, vat, final, branch } = req.body;

    session.startTransaction();

    // 1. Tạo mã code chứng từ
    const code = generateCode("HD");

    // 2. Tạo đơn hàng
    const saleOrder = new SaleOrder({
      code,
      customer,
      table,
      details,
      total,
      vat,
      final,
      branch,
      user: req.userData?.userId,
    });

    await saleOrder.save({ session });

    // 3. Trừ tồn kho nếu có sản phẩm
    for (const prod of details) {
      const product = await Product.findById(prod.product);
      if (!product) {
        throw new Error(`Product not found: ${prod.product}`);
      }

      if (!Array.isArray(product.recipe)) {
        throw new Error(`Product ${prod.product} has no recipe defined.`);
      }
      if (product.recipe.length !== 0) {
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
    }

    // 4. Cập nhật trạng thái bàn
    const tableStatus = {
      status: 2, // 2: Đang có khách
      sale_order: saleOrder._id,
    };

    try {
      await axiosInstance(req.token).patch(`/table/${table}`, tableStatus);
    } catch (axiosError) {
      throw new Error("Cập nhật trạng thái bàn thất bại");
    }

    // 5. Commit & kết thúc
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Sale order created successfully",
      _id: saleOrder._id,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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
      isCancel,
      isClosed,
      cancel_notes,
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
      if (!product) {
        throw new Error(`Product not valid: ${productId}`);
      }
      if (product.recipe.length > 0) {
        for (const component of product.recipe) {
          const itemId = component.item_id;
          const qtyChange = component.quantity * diff;

          if (qtyChange === 0) continue;

          const update =
            qtyChange > 0
              ? { $inc: { "inventories.$[inv].quantity": -qtyChange } } // Trừ
              : {
                  $inc: { "inventories.$[inv].quantity": Math.abs(qtyChange) },
                }; // Cộng

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
    }

    existingOrder.customer = customer;
    existingOrder.table = table;
    existingOrder.details = newDetails;
    existingOrder.total = total;
    existingOrder.vat = vat;
    existingOrder.final = final;
    existingOrder.updatedAt = new Date();
    const tableStatus = {
      status: 1, // trạng thái bàn trống
      sale_order: null,
    };
    if (isCancel) {
      existingOrder.isCancel = isCancel;
      existingOrder.cancel_date = new Date();
      existingOrder.cancel_by = req.userData.userId;
      existingOrder.cancel_notes = cancel_notes;
      const [responseTable] = await Promise.all([
        axiosInstance(req.token).patch(`/table/${table}`, tableStatus),
      ]);
    }
    if (isClosed) {
      existingOrder.isClosed = isClosed;
      existingOrder.closed_date = new Date();
      existingOrder.close_by = req.userData.userId;
      const [responseTable] = await Promise.all([
        axiosInstance(req.token).patch(`/table/${table}`, tableStatus),
      ]);
    }
    await existingOrder.save({ session });

    await session.commitTransaction();
    session.endSession();
    const redisKey = `sale_order:${orderId}`;
    const deleteRedis = await redisClient.del(redisKey);

    return res.status(200).json({
      success: true,
      message: "Edit succecssfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error stack:", err.stack);
    return res.status(500).json({
      success: false,
      message: err.message || "Lỗi hệ thống",
    });
  }
};

//get sale order by id
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

//get all
const getPaginatedSaleOrder = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {}; // nếu sau này bạn muốn lọc theo branch, date, v.v...

    // Lấy danh sách đơn hàng theo page
    const [orders, total] = await Promise.all([
      SaleOrder.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 })
        .select("code user created_at updated_at final customer table")
        .lean(),
      SaleOrder.countDocuments(filter),
    ]);

    // Lấy danh sách id để gọi qua các service khác
    const customerIds = orders
      .map((o) => o.customer?.toString())
      .filter(Boolean);
    const tableIds = orders.map((o) => o.table?.toString()).filter(Boolean);
    const userIds = orders.map((o) => o.user?.toString()).filter(Boolean);

    // Gọi API song song
    const [customers, tables, users] = await Promise.all([
      Promise.all(
        customerIds.map((id) => axiosInstance(req.token).get(`/customer/${id}`))
      ),
      Promise.all(
        tableIds.map((id) => axiosInstance(req.token).get(`/table/${id}`))
      ),
      Promise.all(
        userIds.map((id) => axiosInstance(req.token).get(`/profile/${id}`))
      ),
    ]);

    // Tạo map lookup
    const customerMap = {};
    customers.forEach((r) => {
      customerMap[r.data.data._id] = r.data.data.name;
    });

    const tableMap = {};
    tables.forEach((r) => {
      tableMap[r.data.data._id] = r.data.data.name;
    });

    const userMap = {};
    users.forEach((r) => {
      userMap[r.data.data._id] = {
        first_name: r.data.data.first_name,
        last_name: r.data.data.last_name,
      };
    });

    // Ánh xạ dữ liệu về format cần thiết
    const mappedOrders = orders.map((o) => ({
      _id: o._id,
      code: o.code,
      final: o.final,
      created_at: o.created_at,
      updated_at: o.updated_at,
      customer_name: customerMap[o.customer?.toString()] || "",
      table_name: tableMap[o.table?.toString()] || "",
      user: userMap[o.user?.toString()] || {},
    }));

    res.json({
      success: true,
      data: mappedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    err.methodName = "getSaleOrdersShort";
    next(err);
  }
};

//table transfer
const tableTransfer = async (req, res) => {
  const orderId = req.params.id;
  const { table } = req.body;

  const session = await mongoose.startSession();
  try {
    const existingOrder = await SaleOrder.findById({ orderId }).session(
      session
    );
    if (!existingOrder) {
      return res.status(401).json({
        success: false,
        message: "Sale order not found",
      });
    }
    session.startTransaction();
    saleOrder.table = table;
    await saleOrder.save({ session });
    const newtableStatus = {
      status: 2, // 2 là trạng thái bàn đang có khách
      sale_order: saleOrder._id,
    };
    const currenttableStatus = {
      status: 1, // 1 là trạng thái bàn trống
      sale_order: null,
    };
    const [responseNewTable, responseCurrentTable] = await Promise.all([
      axiosInstance(req.token).patch(`/table/${table}`, newtableStatus),
      axiosInstance(req.token).patch(`/table/${table}`, currenttableStatus),
    ]);

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Table transfered successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};
export {
  createSaleOrder,
  editSaleOrder,
  getSaleOrderById,
  getPaginatedSaleOrder,
  tableTransfer,
};
