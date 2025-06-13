import express from "express";
import { reportRevenue } from "../controllers/thanhnt-report.controller.js";
import { protectRoute } from "../middlerware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/revenue", reportRevenue);

export default router;
