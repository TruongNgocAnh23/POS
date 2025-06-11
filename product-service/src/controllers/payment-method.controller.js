import mongoose from "mongoose";
import PaymentMethod from "../models/payment-method.model.js";
import { logger } from "../utils/logger.js";

const createPaymentMethod = async (req, res, next) => {
  try {
    const { code, name, rate, notes } = req.body;

    const existingPaymentMethod = await PaymentMethod.findOne({ code });
    if (existingPaymentMethod) {
      return res
        .status(400)
        .json({ error: true, message: "Payment method already exists." });
    }

    const newPaymentMethod = new PaymentMethod({
      code,
      name,
      notes,
      created_by: req.userData.userId,
    });

    await newPaymentMethod.save();

    return res.status(201).json({
      error: false,
      message: "Payment method created successfully.",
      data: newPaymentMethod,
    });
  } catch (error) {
    error.methodName = createPaymentMethod.name;
    next(error);
  }
};

const getAllPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await PaymentMethod.find({ is_active: true });

    res.status(200).json({ error: false, data: paymentMethods });
  } catch (error) {
    error.methodName = getAllPaymentMethods.name;
    next(error);
  }
};

const getPaymentMethodById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const tax = await PaymentMethod.findById(id);
    if (!tax || !tax.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Payment method not found." });
    }

    res.status(200).json({ error: false, data: tax });
  } catch (error) {
    error.methodName = getPaymentMethodById.name;
    next(error);
  }
};

const updatePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const tax = await PaymentMethod.findById(id);
    if (!tax || !tax.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Payment method not found." });
    }

    if (code !== undefined) {
      tax.code = code;
    }
    if (name !== undefined) {
      tax.name = name;
    }
    if (notes !== undefined) {
      tax.notes = notes;
    }
    tax.updated_by = req.userData.userId;

    await tax.save();

    res.status(200).json({
      error: false,
      message: "Payment method updated successfully.",
      data: tax,
    });
  } catch (error) {
    error.methodName = updatePaymentMethod.name;
    next(error);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const tax = await PaymentMethod.findById(id);
    if (!tax || !tax.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Payment method not found." });
    }

    tax.is_active = false;
    tax.updated_by = req.userData.userId;
    await tax.save();

    res
      .status(200)
      .json({ error: false, message: "Payment method deleted successfully." });
  } catch (error) {
    error.methodName = deletePaymentMethod.name;
    next(error);
  }
};

export {
  createPaymentMethod,
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
};
