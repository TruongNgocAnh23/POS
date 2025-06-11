import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getNestedCategories,
} from "../controllers/product-category.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createCategory);
router.get("/", getAllCategories);
router.get("/nested", getNestedCategories);
router.get("/:id", getCategoryById);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
