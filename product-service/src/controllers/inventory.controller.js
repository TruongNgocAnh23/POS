import mongoose from "mongoose";
import Inventory from "../models/inventory.model.js";
// add new
const createInventory = async (req, res) => {
  try {
    const { code, name, phone, address, notes, branches } = req.body;

    const existingInventory = await Inventory.findOne({ code });
    if (existingInventory) {
      return res
        .status(400)
        .json({ error: true, message: "Inventory already exists." });
    }

    const newInventory = new Inventory({
      code,
      name,
      phone,
      address,
      notes,
      branches,
      created_by: req.userData.userId,
    });

    await newInventory.save();
    res.status(201).json({
      error: false,
      message: "Inventory created successfully.",
      data: newInventory,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
//get all
const getAllInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find({ is_active: true });
    res.status(200).json({ error: false, data: inventories });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
//get by id
const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await Inventory.findById(id);
    if (!inventory || !inventory.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Inventory not found." });
    }

    res.status(200).json({ error: false, data: inventory });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};
//edit
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, phone, address, notes, branches } = req.body;

    const inventory = await Inventory.findById(id);
    if (!inventory || !inventory.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Inventory not found." });
    }

    if (code !== undefined) {
      inventory.code = code;
    }
    if (name !== undefined) {
      inventory.name = name;
    }
    if (phone !== undefined) {
      inventory.phone = phone;
    }
    if (address !== undefined) {
      inventory.address = address;
    }
    if (notes !== undefined) {
      inventory.notes = notes;
    }
    inventory.updated_by = req.userData.userId;
    inventory.branches = branches;
    await inventory.save();
    res.status(200).json({
      error: false,
      message: "Inventory updated successfully.",
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await Inventory.findById(id);
    if (!inventory || !inventory.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Inventory not found." });
    }

    inventory.is_active = false;
    inventory.updated_by = req.userData.userId;
    await inventory.save();

    res.status(200).json({
      error: false,
      message: "Inventory deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

export {
  createInventory,
  getAllInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
};
