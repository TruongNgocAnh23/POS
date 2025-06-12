import mongoose from "mongoose";
import PurchaseOrder from "../models/purchase-order.model.js";

const createPurchaseOrder = async (req, res) => {
  try {
    const { code, vendor_id, inventory_id, items, notes } = req.body;

    const existingPurchaseOrder = await PurchaseOrder.findOne({ code });
    if (existingPurchaseOrder) {
      return res
        .status(400)
        .json({ error: true, message: "PurchaseOrder already exists." });
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

    return res.status(201).json({
      error: false,
      message: "PurchaseOrder created successfully.",
      data: newPurchaseOrder,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const getAllPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ is_active: true });

    return res.status(200).json({ error: false, data: purchaseOrders });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
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

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder || !purchaseOrder.is_active) {
      return res.status(404).json({
        error: true,
        message: "PurchaseOrder not found.",
      });
    }

    return res.status(200).json({ error: false, data: purchaseOrder });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, notes } = req.body;

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
        message: "PurchaseOrder not found.",
      });
    }

    if (code !== undefined) {
      purchaseOrder.code = code;
    }
    if (name !== undefined) {
      purchaseOrder.name = name;
    }
    if (symbol !== undefined) {
      purchaseOrder.symbol = symbol;
    }
    if (notes !== undefined) {
      purchaseOrder.notes = notes;
    }
    purchaseOrder.updated_by = req.userData.userId;

    await purchaseOrder.save();

    return res.status(200).json({
      error: false,
      message: "PurchaseOrder updated successfully.",
      data: purchaseOrder,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
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
        message: "PurchaseOrder not found.",
      });
    }

    purchaseOrder.is_active = false;
    purchaseOrder.updated_by = req.userData.userId;
    await purchaseOrder.save();

    return res
      .status(200)
      .json({ error: false, message: "PurchaseOrder deleted successfully." });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

export {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
};
