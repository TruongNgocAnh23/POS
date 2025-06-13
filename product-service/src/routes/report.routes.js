import express from "express";
import { StoreandStaffPerformanceReport } from "../controllers/report.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/StoreandStaffPerformanceReport", StoreandStaffPerformanceReport);

export default router;
