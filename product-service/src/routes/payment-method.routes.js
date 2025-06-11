import express from "express";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
} from "../controllers/payment-method.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createPaymentMethod);
router.get("/", getAllPaymentMethods);
router.get("/:id", getPaymentMethodById);
router.patch("/:id", updatePaymentMethod);
router.delete("/:id", deletePaymentMethod);

export default router;
