import mongoose from "mongoose";
import Tax from "../models/tax.model.js";

const createTax = async (req, res, next) => {
  try {
    const { code, name, rate, notes } = req.body;

    const existingTax = await Tax.findOne({ code });
    if (existingTax) {
      return res
        .status(400)
        .json({ error: true, message: "Tax already exists." });
    }

    const newTax = new Tax({
      code,
      name,
      rate,
      notes,
      created_by: req.userData.userId,
    });

    await newTax.save();

    return res.status(201).json({
      error: false,
      message: "Tax created successfully.",
      data: newTax,
    });
  } catch (error) {
    error.methodName = createTax.name;
    next(error);
  }
};

const getAllTaxes = async (req, res, next) => {
  try {
    const taxes = await Tax.find({ is_active: true });

    res.status(200).json({ error: false, data: taxes });
  } catch (error) {
    error.methodName = getAllTaxes.name;
    next(error);
  }
};

const getTaxById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const tax = await Tax.findById(id);
    if (!tax || !tax.is_active) {
      return res.status(404).json({ error: true, message: "Tax not found." });
    }

    res.status(200).json({ error: false, data: tax });
  } catch (error) {
    error.methodName = getTaxById.name;
    next(error);
  }
};

const updateTax = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, rate, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const tax = await Tax.findById(id);
    if (!tax || !tax.is_active) {
      return res.status(404).json({ error: true, message: "Tax not found." });
    }

    if (code !== undefined) {
      tax.code = code;
    }
    if (name !== undefined) {
      tax.name = name;
    }
    if (rate !== undefined) {
      tax.rate = rate;
    }
    if (notes !== undefined) {
      tax.notes = notes;
    }
    tax.updated_by = req.userData.userId;

    await tax.save();

    res
      .status(200)
      .json({ error: false, message: "Tax updated successfully.", data: tax });
  } catch (error) {
    error.methodName = updateTax.name;
    next(error);
  }
};

const deleteTax = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const tax = await Tax.findById(id);
    if (!tax || !tax.is_active) {
      return res.status(404).json({ error: true, message: "Tax not found." });
    }

    tax.is_active = false;
    tax.updated_by = req.userData.userId;
    await tax.save();

    res
      .status(200)
      .json({ error: false, message: "Tax deleted successfully." });
  } catch (error) {
    error.methodName = deleteTax.name;
    next(error);
  }
};

export { createTax, getAllTaxes, getTaxById, updateTax, deleteTax };
