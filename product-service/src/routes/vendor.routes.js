import express from "express";
import {
  createVendor,
  deleteVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
} from "../controllers/vendor.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createVendor);
router.get("/", getAllVendors);
router.get("/:id", getVendorById);
router.patch("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
