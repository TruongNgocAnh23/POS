import express from "express";
import {
  createSaleOrder,
  getSaleOrderById,
  editSaleOrder,
  getPaginatedSaleOrder,
  tableTransfer,
} from "../controllers/sale-order.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createSaleOrder);
router.get("/:id", getSaleOrderById);
router.patch("/:id", editSaleOrder);
// router.get("/", getPaginatedSaleOrder);
// // router.get("/categories", getAllProductsFromCategories);
// router.get("/categories/:category_id", getAllProductsByCategories);
// router.get("/:id", getProductById);
// router.patch("/:id", updateProduct);
// router.delete("/:id", deleteProduct);

export default router;
