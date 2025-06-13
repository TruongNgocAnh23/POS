import express from "express";
import {
  reportRevenue,
  reportRevenueOfProduct,
} from "../controllers/thanhnt-report.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/revenue", reportRevenue);
router.get("/revenue-of-products", reportRevenueOfProduct);

export default router;
