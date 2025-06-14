import mongoose from "mongoose";
import PurchaseOrder from "../models/purchase-order.model.js";
import Vendor from "../models/vendor.model.js";
import Inventory from "../models/inventory.model.js";
import Item from "../models/item.model.js";
import redisClient from "../utils/redisClient.js";

const createPurchaseOrder = async (req, res, next) => {
  const { vendor_id, inventory_id, items, notes } = req.body;
  const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    await session.withTransaction(async () => {
      const [existingPurchaseOrder, vendor, inventory] = await Promise.all([
        PurchaseOrder.findOne({ code }),
        Vendor.findById(vendor_id),
        Inventory.findById(inventory_id),
      ]);

      if (existingPurchaseOrder) {
        throw new Error("Purchase order already exists.");
      }
      if (!vendor || !vendor.is_active) {
        throw new Error("Vendor not found.");
      }
      if (!inventory || !inventory.is_active) {
        throw new Error("Inventory not found.");
      }

      /* ---------- 1. Chuẩn hoá danh sách items & cập nhật kho ---------- */
      const purchaseOrderItems = [];

      for (const item of items) {
        const { item_id, quantity, cost } = item;

        const prod = await Item.findById(item_id).session(session);
        if (!prod?.is_active) throw new Error(`Item ${item_id} not found.`);

        // Lấy cost hiện tại trong kho để lưu prev_cost
        const invIdx = prod.inventories.findIndex((v) =>
          v.inventory_id.equals(inventory_id)
        );
        const prev_cost = invIdx !== -1 ? prod.inventories[invIdx].cost : 0;

        /* Cập nhật tồn kho */
        if (invIdx === -1) {
          prod.inventories.push({
            inventory_id,
            branch_id: null,
            quantity,
            cost,
            wholesale_price: 0,
            retail_price: 0,
            updated_at: new Date(),
          });
        } else {
          const entry = prod.inventories[invIdx];
          entry.quantity += quantity;
          if (cost > entry.cost) entry.cost = cost;
          entry.updated_at = new Date();
        }
        prod.updated_by = req.userData.userId;
        await prod.save({ session });

        // Đưa vào list items của PO (kèm prev_cost để phục vụ rollback sau này)
        purchaseOrderItems.push({ item_id, quantity, cost, prev_cost });
      }

      const code = generateCode("NH");

      // Tạo phiếu nhập hàng
      const newPurchaseOrder = new PurchaseOrder({
        code: code,
        vendor_id,
        inventory_id,
        items: purchaseOrderItems,
        notes,
        created_by: req.userData.userId,
      });
      await newPurchaseOrder.save({ session });

      // for (const item of newPurchaseOrder.items) {
      //   const existingItem = await Item.findById(item.item_id);

      //   if (!existingItem || !existingItem.is_active) {
      //     throw new Error(`Item ${existingItem.name} not found.`);
      //   }

      //   // Duyệt từng kho kiểm tra xem item đã tồn tại trong kho hay chưa
      //   const inventoryIndex = existingItem.inventories.findIndex(
      //     (inv) => inv.inventory_id.toString() === inventory._id.toString()
      //   );

      //   if (inventoryIndex === -1) {
      //     // Nếu item không tồn tại trong kho
      //     existingItem.inventories.push({
      //       inventory_id: newPurchaseOrder.inventory_id,
      //       branch_id: null,
      //       quantity: item.quantity,
      //       cost: item.cost,
      //       wholesale_price: 0,
      //       retail_price: 0,
      //       updated_at: new Date(),
      //     });
      //   } else {
      //     // Nếu item tồn tại trong kho thì cập nhật số lượng và nếu cost nhập > cost cũ thì lấy cost nhập
      //     existingItem.inventories[inventoryIndex].quantity += item.quantity;
      //     if (item.cost > existingItem.inventories[inventoryIndex].cost) {
      //       existingItem.inventories[inventoryIndex].cost = item.cost;
      //     }
      //   }
      //   existingItem.updated_by = req.userData.userId;
      //   await existingItem.save({ session });
      // }

      // Cập nhật công nợ cho nhà cung cấp
      // const po = newPurchaseOrder[0]; // create() trả về mảng
      // const debt = (po.total_amount || 0) - (po.total_payment || 0);
      // vendor.total_debt += debt;
      // await vendor.save({ session });

      vendor.total_debt +=
        (newPurchaseOrder.total_amount || 0) -
        (newPurchaseOrder.total_payment || 0);
      await vendor.save({ session });
    });

    await redisClient.del("purchase_orders");

    return res.status(201).json({
      error: false,
      message: "Purchase order created successfully.",
    });
  } catch (error) {
    error.methodName = createPurchaseOrder.name;
    next(error);
  } finally {
    session.endSession();
  }
};

const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const cacheKey = "purchase_orders";
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        error: false,
        message: "Data from Redis cache",
        data: JSON.parse(cachedData),
      });
    }

    const purchaseOrders = await PurchaseOrder.find({ is_active: true });

    await redisClient.set(
      cacheKey,
      JSON.stringify(purchaseOrders),
      "EX",
      process.env.REDIS_TTL
    );

    return res.status(200).json({ error: false, data: purchaseOrders });
  } catch (error) {
    error.methodName = getAllPurchaseOrders.name;
    next(error);
  }
};

const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cacheKey = `purchase_order:${id}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        error: false,
        message: "Data from Redis cache",
        data: JSON.parse(cachedData),
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate({
        path: "vendor_id",
        select: "code name",
      })
      .populate({
        path: "inventory_id",
        select: "code name",
      })
      .populate({
        path: "items.item_id",
        select: "code name",
      })
      .lean();

    if (!purchaseOrder || !purchaseOrder.is_active) {
      return res.status(404).json({
        error: true,
        message: "Purchase order not found.",
      });
    }

    await redisClient.set(
      cacheKey,
      JSON.stringify(purchaseOrder),
      "EX",
      process.env.REDIS_TTL
    );

    return res.status(200).json({ error: false, data: purchaseOrder });
  } catch (error) {
    error.methodName = getPurchaseOrderById.name;
    next(error);
  }
};

const updatePurchaseOrder = async (req, res, next) => {
  const { id } = req.params;
  const { vendor_id, inventory_id, items, notes } = req.body;
  const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    await session.withTransaction(async () => {
      const [purchaseOrder, vendor, inventory] = await Promise.all([
        PurchaseOrder.findById(id).session(session),
        Vendor.findById(vendor_id).session(session),
        Inventory.findById(inventory_id).session(session),
      ]);

      if (!purchaseOrder || !purchaseOrder.is_active) {
        throw new Error("Purchase order not found.");
      }
      if (!vendor || !vendor.is_active) {
        throw new Error("Vendor not found.");
      }
      if (!inventory || !inventory.is_active) {
        throw new Error("Inventory not found.");
      }

      const oldItems = purchaseOrder.items;
      const oldVendorId = purchaseOrder.vendor_id.toString();
      const oldTotalAmount = purchaseOrder.total_amount || 0;

      // --- 1. Rollback tồn kho từ item cũ ---
      for (const oldItem of oldItems) {
        const existingItem = await Item.findById(oldItem.item_id).session(
          session
        );
        if (!existingItem || !existingItem.is_active) {
          throw new Error(`Item ${existingItem.name} not found.`);
        }

        const invIndex = existingItem.inventories.findIndex(
          (inv) =>
            inv.inventory_id.toString() ===
            purchaseOrder.inventory_id.toString()
        );

        if (invIndex !== -1) {
          existingItem.inventories[invIndex].quantity -= oldItem.quantity;
          if (
            oldItem.prev_cost !== undefined &&
            existingItem.inventories[invIndex].cost === oldItem.cost
          ) {
            existingItem.inventories[invIndex].cost = oldItem.prev_cost;
          }
          await existingItem.save({ session });
        }
      }

      // --- 2. Reset items list trong phiếu ---
      purchaseOrder.items = [];

      // --- 3. Thêm lại item mới vào phiếu và cập nhật tồn kho ---
      for (const item of items) {
        const { item_id, quantity, cost } = item;

        const existingItem = await Item.findById(item_id).session(session);
        if (!existingItem || !existingItem.is_active) {
          throw new Error(`Item ${existingItem.name} not found.`);
        }

        // Cập nhật lại tồn kho
        const invIndex = existingItem.inventories.findIndex(
          (inv) => inv.inventory_id.toString() === inventory_id.toString()
        );

        const prevCost =
          invIndex !== -1 ? existingItem.inventories[invIndex].cost : 0;

        if (invIndex === -1) {
          existingItem.inventories.push({
            inventory_id,
            branch_id: null,
            quantity,
            cost,
            prev_cost: prevCost,
            wholesale_price: 0,
            retail_price: 0,
            updated_at: new Date(),
          });
        } else {
          existingItem.inventories[invIndex].quantity += quantity;
          if (cost > existingItem.inventories[invIndex].cost) {
            existingItem.inventories[invIndex].cost = cost;
          }
          existingItem.inventories[invIndex].updated_at = new Date();
        }

        existingItem.updated_by = req.userData.userId;
        await existingItem.save({ session });

        // Thêm vào phiếu
        purchaseOrder.items.push(item);
      }

      // --- 4. Cập nhật thông tin phiếu ---
      if (vendor_id !== undefined) {
        purchaseOrder.vendor_id = vendor_id;
      }
      if (inventory_id !== undefined) {
        purchaseOrder.inventory_id = inventory_id;
      }
      if (notes !== undefined) {
        purchaseOrder.notes = notes;
      }
      purchaseOrder.updated_by = req.userData.userId;
      await purchaseOrder.save({ session });

      // --- 5. Cập nhật công nợ vendor ---
      if (oldVendorId !== vendor_id.toString()) {
        // Cập nhật nếu đổi nhà cung cấp mới
        const [newVendor, oldVendor] = await Promise.all([
          Vendor.findById(vendor_id).session(session),
          Vendor.findById(oldVendorId).session(session),
        ]);

        if (!newVendor) {
          throw new Error("New vendor not found.");
        }
        if (!oldVendor) {
          throw new Error("Old vendor not found.");
        }

        newVendor.total_debt += purchaseOrder.total_amount;
        await newVendor.save({ session });
        oldVendor.total_debt -= oldTotalAmount;
        await oldVendor.save({ session });
      } else {
        // Cập nhật nếu không đổi nhà cung cấp
        const debtDiff = purchaseOrder.total_amount - oldTotalAmount;
        vendor.total_debt += debtDiff;
        await vendor.save({ session });
      }
    });

    // await session.commitTransaction();
    // session.endSession();

    await redisClient.del(`purchase_order:${id}`);
    await redisClient.del("purchase_orders");

    return res.status(200).json({
      error: false,
      message: "PurchaseOrder updated successfully.",
      // data: purchaseOrder,
    });
  } catch (error) {
    error.methodName = updatePurchaseOrder.name;
    next(error);
  } finally {
    await session.endSession();
  }
};

const deletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder || !purchaseOrder.is_active) {
      return res.status(404).json({
        error: true,
        message: "Purchase order not found.",
      });
    }

    if (purchaseOrder.total_payment === 0) {
      return res
        .status(400)
        .json({ error: true, message: "Chưa trả nợ mà đòi xóa dị bạn??" });
    }

    purchaseOrder.is_active = false;
    purchaseOrder.updated_by = req.userData.userId;
    await purchaseOrder.save();

    await redisClient.del(`purchase_order:${id}`);
    await redisClient.del("purchase_orders");

    return res
      .status(200)
      .json({ error: false, message: "Purchase order deleted successfully." });
  } catch (error) {
    error.methodName = deletePurchaseOrder.name;
    next(error);
  }
};

export {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
};
