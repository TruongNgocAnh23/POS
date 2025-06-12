import mongoose from "mongoose";
import Unit from "../models/unit.model.js";

const createUnit = async (req, res) => {
  try {
    const { code, name, symbol, notes } = req.body;

    const existingUnit = await Unit.findOne({ code });
    if (existingUnit) {
      return res
        .status(400)
        .json({ error: true, message: "Unit already exists." });
    }

    const newUnit = new Unit({
      code,
      name,
      symbol,
      notes,
      created_by: req.userData.userId,
    });

    await newUnit.save();

    return res.status(201).json({
      error: false,
      message: "Unit created successfully.",
      data: newUnit,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const getAllUnits = async (req, res) => {
  try {
    const units = await Unit.find({ is_active: true });

    return res.status(200).json({ error: false, data: units });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findById(id);
    if (!unit || !unit.is_active) {
      return res.status(404).json({
        error: true,
        message: "Unit not found.",
      });
    }

    return res.status(200).json({ error: false, data: unit });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, notes } = req.body;

    const unit = await Unit.findById(id);
    if (!unit || !unit.is_active) {
      return res.status(404).json({
        error: true,
        message: "Unit not found.",
      });
    }

    if (code !== undefined) {
      unit.code = code;
    }
    if (name !== undefined) {
      unit.name = name;
    }
    if (symbol !== undefined) {
      unit.symbol = symbol;
    }
    if (notes !== undefined) {
      unit.notes = notes;
    }
    unit.updated_by = req.userData.userId;

    await unit.save();

    return res.status(200).json({
      error: false,
      message: "Unit updated successfully.",
      data: unit,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findById(id);
    if (!unit || !unit.is_active) {
      return res.status(404).json({
        error: true,
        message: "Unit not found.",
      });
    }

    unit.is_active = false;
    unit.updated_by = req.userData.userId;
    await unit.save();

    return res
      .status(200)
      .json({ error: false, message: "Unit deleted successfully." });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

export { createUnit, getAllUnits, getUnitById, updateUnit, deleteUnit };
