import express from "express";
import {
  StoreandStaffPerformanceReport,
  TotalRevenueReport,
} from "../controllers/report.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/StoreandStaffPerformanceReport", StoreandStaffPerformanceReport);
router.get("/TotalRevenueReport", TotalRevenueReport);

export default router;
