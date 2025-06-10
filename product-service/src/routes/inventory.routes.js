import express from "express";
import {
  createInventory,
  deleteInventory,
  getAllInventories,
  getInventoryById,
  updateInventory,
} from "../controllers/inventory.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createInventory);
router.get("/", getAllInventories);
router.get("/:id", getInventoryById);
router.patch("/:id", updateInventory);
router.delete("/:id", deleteInventory);

export default router;
