import express from "express";
import {
  createUnit,
  deleteUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
} from "../controllers/unit.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createUnit);
router.get("/", getAllUnits);
router.get("/:id", getUnitById);
router.patch("/:id", updateUnit);
router.delete("/:id", deleteUnit);

export default router;
