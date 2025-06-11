import mongoose from "mongoose";
import Vendor from "../models/vendor.model.js";

const createVendor = async (req, res) => {
  try {
    const { code, name, email, phone, address, notes } = req.body;

    const existingVendor = await Vendor.findOne({ code });
    if (existingVendor) {
      return res
        .status(400)
        .json({ error: true, message: "Vendor already exists." });
    }

    const newVendor = new Vendor({
      code,
      name,
      email,
      phone,
      address,
      notes,
      created_by: req.userData.userId,
    });

    await newVendor.save();

    return res.status(201).json({
      error: false,
      message: "Vendor created successfully.",
      data: newVendor,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ is_active: true });

    return res.status(200).json({ error: false, data: vendors });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: "Invalid ID format.",
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor || !vendor.is_active) {
      return res.status(404).json({
        error: true,
        message: "Vendor not found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Vendor fetched successfully.",
      data: vendor,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, email, phone, address, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: "Invalid ID format.",
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor || !vendor.is_active) {
      return res.status(404).json({
        error: true,
        message: "Vendor not found.",
      });
    }

    if (code !== undefined) {
      vendor.code = code;
    }
    if (name !== undefined) {
      vendor.name = name;
    }
    if (email !== undefined) {
      vendor.email = email;
    }
    if (phone !== undefined) {
      vendor.phone = phone;
    }
    if (address !== undefined) {
      vendor.phone = address;
    }
    if (notes !== undefined) {
      vendor.notes = notes;
    }
    vendor.updated_by = req.userData.userId;

    await vendor.save();

    return res.status(200).json({
      error: false,
      message: "Vendor updated successfully.",
      data: vendor,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: true,
        message: "Invalid ID format.",
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor || !vendor.is_active) {
      return res.status(404).json({
        error: true,
        message: "Vendor not found.",
      });
    }

    vendor.is_active = false;
    vendor.updated_by = req.userData.userId;
    await vendor.save();

    return res
      .status(200)
      .json({ error: false, message: "Vendor deleted successfully." });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
};

export {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};
