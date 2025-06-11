import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { calculateProductPrices } from "../utils/calculateProductPrices.js";

const createProduct = async (req, res, next) => {
  try {
    const { receipt, code, name, notes } = req.body;

    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      return res
        .status(400)
        .json({ error: true, message: "Product already exists." });
    }

    const newProduct = new Product({
      receipt,
      code,
      name,
      notes,
      created_by: req.userData.userId,
    });

    await newProduct.save();

    return res.status(201).json({
      error: false,
      message: "Product created successfully.",
      data: newProduct,
    });
  } catch (error) {
    error.methodName = createProduct.name;
    next(error);
  }
};

const getAllProductes = async (req, res, next) => {
  try {
    const products = await Product.find({ is_active: true }).lean();

    // const products = await Product.find().lean();

    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const prices = await calculateProductPrices(product);
        return { ...product, prices };
      })
    );

    res.status(200).json({ error: false, data: enrichedProducts });
  } catch (error) {
    error.methodName = getAllProductes.name;
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const product = await Product.findById(id);
    if (!product || !product.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Product not found." });
    }

    const prices = await calculateProductPrices(product);

    res.status(200).json({ error: false, data: { ...product, prices } });
  } catch (error) {
    error.methodName = getProductById.name;
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { receipt, code, name, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const product = await Product.findById(id);
    if (!product || !product.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Product not found." });
    }

    if (receipt !== undefined) {
      product.receipt = receipt;
    }
    if (code !== undefined) {
      product.code = code;
    }
    if (name !== undefined) {
      product.name = name;
    }
    if (notes !== undefined) {
      product.notes = notes;
    }
    product.updated_by = req.userData.userId;

    await product.save();

    res.status(200).json({
      error: false,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    error.methodName = updateProduct.name;
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const product = await Product.findById(id);
    if (!product || !product.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Product not found." });
    }

    product.is_active = false;
    product.updated_by = req.userData.userId;
    await product.save();

    res
      .status(200)
      .json({ error: false, message: "Product deleted successfully." });
  } catch (error) {
    error.methodName = deleteProduct.name;
    next(error);
  }
};

export {
  createProduct,
  getAllProductes,
  getProductById,
  updateProduct,
  deleteProduct,
};
