import express from "express";
import {
  StoreandStaffPerformanceReport,
  TotalRevenueReport,
  CancelledBillsReport,
  reportRevenueOfProduct,
} from "../controllers/report.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/StoreandStaffPerformanceReport", StoreandStaffPerformanceReport);
router.get("/TotalRevenueReport", TotalRevenueReport);
router.get("/CancelledBillsReport", CancelledBillsReport);
router.get("/ReportRevenueOfProduct", reportRevenueOfProduct);
export default router;
