import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { calculateProductPrices } from "../utils/calculateProductPrices.js";
import ProductCategory from "../models/product-category.model.js";
import Tax from "../models/tax.model.js";
import searchingHandler from "../utils/search-handler.js";
import generateAutoCode from "../utils/generateCode.js";

const createProduct = async (req, res, next) => {
  try {
    const {
      category_id,
      recipe,
      name,
      image,
      price,
      tax_rate,
      vat,
      price_after_vat,
      notes,
    } = req.body;

    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      return res
        .status(400)
        .json({ error: true, message: "Product already exists." });
    }

    const code = generateAutoCode("PROD");

    const newProduct = new Product({
      category_id,
      recipe,
      code: code,
      name,
      image,
      price,
      tax_rate,
      vat,
      price_after_vat,
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

const getAllProducts = async (req, res, next) => {
  try {
    const { searchString } = req.query;

    const searching = searchingHandler(searchString, ["code", "name"]);

    const products = await Product.find({ is_active: true, ...searching })
      .populate({
        path: "category_id",
        select: "tax_id code name",
        populate: {
          path: "tax_id",
          select: "code name rate",
        },
      })
      .lean();

    res.status(200).json({ error: false, data: products });
  } catch (error) {
    error.methodName = getAllProducts.name;
    next(error);
  }
};

const getAllProductsByCategories = async (req, res, next) => {
  try {
    const { category_id } = req.params;
    const { searchString } = req.query;

    if (!category_id) {
      return res
        .status(400)
        .json({ error: true, message: "category_id is required." });
    }

    const searching = searchingHandler(searchString, ["code", "name"]);

    const products = await Product.find({
      is_active: true,
      category_id,
      ...searching,
    })
      .populate({
        path: "category_id",
        select: "tax_id code name",
        populate: {
          path: "tax_id",
          select: "code name rate",
        },
      })
      .lean();

    res.status(200).json({ error: false, data: products });
  } catch (error) {
    error.methodName = getAllProductsByCategories.name;
    next(error);
  }
};

// const getAllProductsFromCategories = async (req, res, next) => {
//   try {
//     const categories = await ProductCategory.find({ is_active: true })
//       .select("_id parent_id code name")
//       .populate({ path: "tax_id", select: "name rate" })
//       .lean();

//     const products = await Product.find({ is_active: true });

//     const productMap = {};
//     for (const product of products) {
//       const catId = String(product.category_id);
//       if (!productMap[catId]) productMap[catId] = [];
//       productMap[catId].push(product);
//     }

//     const parentCategories = categories.filter((cat) => !cat.parent_id);

//     const result = parentCategories.map((parent) => {
//       const childCategories = categories
//         .filter((cat) => String(cat.parent_id) === String(parent._id))
//         .map((child) => {
//           return {
//             _id: child._id,
//             code: child.code,
//             name: child.name,
//             products: productMap[String(child._id)] || [],
//           };
//         });

//       return {
//         _id: parent._id,
//         tax_rate: parent.tax_id?.rate || null,
//         code: parent.code,
//         name: parent.name,
//         childCategories,
//       };
//     });

//     // const products = await Product.find().lean();

//     res.status(200).json({ error: false, data: result });
//   } catch (error) {
//     error.methodName = getAllProductes.name;
//     next(error);
//   }
// };

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate({
        path: "category_id",
        select: "tax_id code name",
        populate: {
          path: "tax_id",
          select: "code name rate",
        },
      })
      .populate({
        path: "recipe.category_id",
        select: "code name",
      })
      .populate({
        path: "recipe.item_id",
        select: "code name",
      })
      .populate({
        path: "recipe.unit_id",
        select: "code name",
      })
      .lean();
    if (!product || !product.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Product not found." });
    }

    res.status(200).json({ error: false, data: product });
  } catch (error) {
    error.methodName = getProductById.name;
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      recipe,
      name,
      image,
      price,
      tax_rate,
      vat,
      price_after_vat,
      notes,
    } = req.body;

    const product = await Product.findById(id);
    if (!product || !product.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Product not found." });
    }

    if (category_id !== undefined) {
      product.category_id = category_id;
    }
    if (recipe !== undefined) {
      product.recipe = recipe;
    }
    if (name !== undefined) {
      product.name = name;
    }
    if (image !== undefined) {
      product.image = image;
    }
    if (price !== undefined) {
      product.price = price;
    }
    if (tax_rate !== undefined) {
      product.tax_rate = tax_rate;
    }
    if (vat !== undefined) {
      product.vat = vat;
    }
    if (price_after_vat !== undefined) {
      product.price_after_vat = price_after_vat;
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
  getAllProducts,
  getAllProductsByCategories,
  getProductById,
  updateProduct,
  deleteProduct,
};
