import mongoose from "mongoose";
import ProductCategory from "../models/product-category.model.js";

const createCategory = async (req, res) => {
  try {
    const { parent_id, tax_id, code, name, notes } = req.body;

    const categoryExists = await ProductCategory.findOne({ code });

    if (categoryExists) {
      return res
        .status(400)
        .json({ error: true, message: "Category already exists." });
    }

    if (parent_id) {
      const parentCategoryExists = await ProductCategory.findById(parent_id);

      if (!parentCategoryExists) {
        return res
          .status(404)
          .json({ error: true, message: "Parent category not found." });
      }
    }

    const newCategory = new ProductCategory({
      parent_id,
      tax_id,
      code,
      name,
      notes,
      created_by: req.userData.userId,
    });

    await newCategory.save();
    res.status(201).json({
      error: false,
      message: "Category created successfully.",
      data: newCategory,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find({ is_active: true })
      .populate({
        path: "parent_id",
        select: "name",
      })
      .populate({
        path: "tax_id",
        select: "name rate",
      });
    res.status(200).json({ error: false, data: categories });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const getNestedCategories = async (req, res) => {
  try {
    // 1. Lấy tất cả category
    const allCategories = await ProductCategory.find({ is_active: true })
      .select("-created_at -created_by -updated_at -updated_by -notes")
      .lean();

    // 2. Tách các category cha
    const parentCategories = allCategories.filter((cat) => !cat.parent_id);

    // 3. Gắn các category con vào từng category cha
    const nestedCategories = parentCategories.map((parent) => {
      const children = allCategories.filter(
        (cat) => String(cat.parent_id) === String(parent._id)
      );
      return {
        ...parent,
        childcategory: children,
      };
    });

    res.status(200).json({
      error: false,
      message: "Lấy danh sách phân loại thành công",
      data: nestedCategories,
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "Lỗi server",
      data: null,
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const category = await ProductCategory.findById(id);

    if (!category || !category.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Category not found." });
    }

    res.status(200).json({ error: false, data: category });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // const updateData = req.body;
    const { parent_id, tax_id, code, name, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const category = await ProductCategory.findById(id);

    if (!category || !category.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Category not found." });
    }

    // Object.assign(category, updateData, { updated_by: "test" });
    if (parent_id !== undefined) {
      category.parent_id = parent_id;
    }
    if (tax_id !== undefined) {
      category.tax_id = tax_id;
    }
    if (code !== undefined) {
      category.code = code;
    }
    if (name !== undefined) {
      category.name = name;
    }
    if (notes !== undefined) {
      category.notes = notes;
    }
    category.updated_by = req.userData.userId;

    await category.save();
    res.status(200).json({
      error: false,
      message: "Category updated successfully.",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const category = await ProductCategory.findById(id);

    if (!category || !category.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Category not found." });
    }

    category.is_active = false;
    await category.save();

    res
      .status(200)
      .json({ error: false, message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
};

export {
  createCategory,
  getAllCategories,
  getNestedCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
