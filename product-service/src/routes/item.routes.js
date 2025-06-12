import express from "express";
import {
  createItem,
  getItemById,
  updateItem,
  deleteItem,
  getAllItems,
  updateItemToInventory,
  deletedItemFromInventory,
  testAPI,
} from "../controllers/item.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createItem);
router.get("/", getAllItems);
router.get("/testapi", testAPI);
router.get("/:id", getItemById);
router.patch("/:id", updateItem);
router.delete("/:id", deleteItem);
router.patch("/update-item-to-inventory/:id", updateItemToInventory);
router.delete("/delete-item-from-inventory/:id", deletedItemFromInventory);

export default router;
