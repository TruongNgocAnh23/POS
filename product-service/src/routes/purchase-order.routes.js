import express from "express";
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
} from "../controllers/purchase-order.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createPurchaseOrder);
router.get("/", getAllPurchaseOrders);
router.get("/:id", getPurchaseOrderById);
router.patch("/:id", updatePurchaseOrder);
router.delete("/:id", deletePurchaseOrder);

export default router;
