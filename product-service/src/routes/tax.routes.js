import express from "express";
import {
  createTax,
  deleteTax,
  getAllTaxes,
  getTaxById,
  updateTax,
} from "../controllers/tax.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createTax);
router.get("/", getAllTaxes);
router.get("/:id", getTaxById);
router.patch("/:id", updateTax);
router.delete("/:id", deleteTax);

export default router;
