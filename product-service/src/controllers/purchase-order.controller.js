import mongoose from "mongoose";
import PurchaseOrder from "../models/purchase-order.model.js";
import Vendor from "../models/vendor.model.js";

const createPurchaseOrder = async (req, res) => {
  try {
    const { code, vendor_id, inventory_id, items, notes } = req.body;

    const existingPurchaseOrder = await PurchaseOrder.findOne({ code });
    if (existingPurchaseOrder) {
      return res
        .status(400)
        .json({ error: true, message: "Purchase order already exists." });
    }

    const newPurchaseOrder = new PurchaseOrder({
      code,
      vendor_id,
      inventory_id,
      items,
      notes,
      created_by: req.userData.userId,
    });

    await newPurchaseOrder.save();

    const vendor = await Vendor.findById(newPurchaseOrder.vendor_id);
    vendor.debt +=
      newPurchaseOrder.total_amount - newPurchaseOrder.total_payment;
    await vendor.save();

    return res.status(201).json({
      error: false,
      message: "Purchase order created successfully.",
      data: newPurchaseOrder,
    });
  } catch (error) {
    error.methodName = createPurchaseOrder.name;
    next(error);
  }
};

const getAllPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ is_active: true });

    return res.status(200).json({ error: false, data: purchaseOrders });
  } catch (error) {
    error.methodName = getAllPurchaseOrders.name;
    next(error);
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: "Invalid ID format.",
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

    return res.status(200).json({ error: false, data: purchaseOrder });
  } catch (error) {
    error.methodName = getPurchaseOrderById.name;
    next(error);
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, vendor_id, inventory_id, items, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: "Invalid ID format.",
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder || !purchaseOrder.is_active) {
      return res.status(404).json({
        error: true,
        message: "Purchase order not found.",
      });
    }

    const originalTotalAmount = purchaseOrder.total_amount || 0;
    const originalVendorId = purchaseOrder.vendor_id.toString();

    // Cập nhật phiếu nhập hàng
    if (code !== undefined) {
      purchaseOrder.code = code;
    }
    if (vendor_id !== undefined) {
      purchaseOrder.vendor_id = vendor_id;
    }
    if (inventory_id !== undefined) {
      purchaseOrder.inventory_id = inventory_id;
    }
    if (notes !== undefined) {
      purchaseOrder.notes = notes;
    }
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item.item_id) {
          const existingItem = purchaseOrder.items.id(item.item_id);
          if (existingItem) {
            existingItem.set(item);
          } else {
            purchaseOrder.items.push(item);
          }
        }
      });
    }
    purchaseOrder.updated_by = req.userData.userId;
    await purchaseOrder.save();

    // Cập nhật lại công nợ của nhà cung cấp
    const updatedTotalAmount = purchaseOrder.total_amount - originalTotalAmount;

    if (purchaseOrder.vendor_id.toString() !== originalVendorId) {
      // Cập nhật nếu đổi nhà cung cấp mới
      const newVendor = await Vendor.findById(purchaseOrder.vendor_id);
      const oldVendor = await Vendor.findById(originalVendorId);

      if (!newVendor) {
        return res
          .status(404)
          .json({ error: true, message: "New vendor not found." });
      }
      if (!oldVendor) {
        return res
          .status(404)
          .json({ error: true, message: "Old vendor not found." });
      }

      newVendor.total_debt += purchaseOrder.total_amount;
      await newVendor.save();
      oldVendor.total_debt -= originalTotalAmount;
      await oldVendor.save();
    } else {
      // Cập nhật nếu không đổi nhà cung cấp
      const vendor = await Vendor.findById(purchaseOrder.vendor_id);
      if (!vendor) {
        return res
          .status(404)
          .json({ error: true, message: "Vendor not found." });
      }
      vendor.total_debt += updatedTotalAmount;
      await vendor.save();
    }

    return res.status(200).json({
      error: false,
      message: "PurchaseOrder updated successfully.",
      data: purchaseOrder,
    });
  } catch (error) {
    error.methodName = updatePurchaseOrder.name;
    next(error);
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: "Invalid ID format.",
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder || !purchaseOrder.is_active) {
      return res.status(404).json({
        error: true,
        message: "Purchase order not found.",
      });
    }

    purchaseOrder.is_active = false;
    purchaseOrder.updated_by = req.userData.userId;
    await purchaseOrder.save();

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
