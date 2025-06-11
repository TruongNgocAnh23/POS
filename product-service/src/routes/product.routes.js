import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProductes,
  getProductById,
  updateProduct,
} from "../controllers/product.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createProduct);
router.get("/", getAllProductes);
router.get("/:id", getProductById);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
