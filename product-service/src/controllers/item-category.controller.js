import mongoose from "mongoose";
import ItemCategory from "../models/item-category.model.js";

const createCategory = async (req, res) => {
  try {
    const { parent_id, code, name, notes } = req.body;

    const categoryExists = await ItemCategory.findOne({ code });

    if (categoryExists) {
      return res
        .status(400)
        .json({ error: true, message: "Category already exists." });
    }

    if (parent_id) {
      const parentCategoryExists = await ItemCategory.findById(parent_id);

      if (!parentCategoryExists) {
        return res
          .status(404)
          .json({ error: true, message: "Parent category not found." });
      }
    }

    const newCategory = new ItemCategory({
      parent_id,
      code,
      name,
      notes,
      created_by: req.userData.username,
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
    const categories = await ItemCategory.find({ is_active: true });
    res.status(200).json({
      error: false,
      data: categories,
      user: `test ${JSON.stringify(req.userData)}`,
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
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

    const category = await ItemCategory.findById(id);

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
    const { parent_id, code, name, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid ID format." });
    }

    const category = await ItemCategory.findById(id);

    if (!category || !category.is_active) {
      return res
        .status(404)
        .json({ error: true, message: "Category not found." });
    }

    // Object.assign(category, updateData, { updated_by: "test" });
    if (parent_id !== undefined) {
      category.parent_id = parent_id;
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
    category.updated_by = "test";

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

    const category = await ItemCategory.findById(id);

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
  getCategoryById,
  updateCategory,
  deleteCategory,
};
