import express from "express";
import {
  createItem,
  getItemById,
  updateItem,
  deleteItem,
  getAllItems,
  updateItemToInventory,
  deletedItemFromInventory,
} from "../controllers/item.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createItem);
router.get("/", getAllItems);
router.get("/:id", getItemById);
router.patch("/:id", updateItem);
router.delete("/:id", deleteItem);
router.patch("/update-item-to-inventories/:id", updateItemToInventory);
router.delete("/delete-item-from-inventories/:id", deletedItemFromInventory);

export default router;
