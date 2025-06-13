import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.config.js";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlerware/error-handler.middleware.js";
import { logger } from "./utils/logger.js";
import vendorRoutes from "./routes/vendor.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import itemCategoryRoutes from "./routes/item-category.routes.js";
import itemRoutes from "./routes/item.routes.js";
import unitRoutes from "./routes/unit.routes.js";
import taxRoutes from "./routes/tax.routes.js";
import productCategoryRoutes from "./routes/product-category.routes.js";
import productRoutes from "./routes/product.routes.js";
import paymentMethodRoutes from "./routes/payment-method.routes.js";
import saleOrderRoutes from "./routes/sale-order.routes.js";
import purchaseOrderRoutes from "./routes/purchase-order.routes.js";
import ReportRoutes from "./routes/report.routes.js";
import thanhntReportRoutes from "./routes/thanhnt-report.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json({ limit: "5mb" }));
app.use(helmet());
app.use(
  cors({
    // origin: "http://localhost:xxxx",
    // credentials: true
  })
);
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 999999,
  message: "Too many requests.",
  headers: true,
});

app.use(globalLimiter);

app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/inventories", inventoryRoutes);
app.use("/api/v1/item-categories", itemCategoryRoutes);
app.use("/api/v1/items", itemRoutes);
app.use("/api/v1/units", unitRoutes);
app.use("/api/v1/taxes", taxRoutes);
app.use("/api/v1/product-categories", productCategoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/payment-methods", paymentMethodRoutes);
app.use("/api/v1/sale-order", saleOrderRoutes);
app.use("/api/v1/purchase-orders", purchaseOrderRoutes);
app.use("/api/v1/reports", ReportRoutes);
app.use("/api/v1/thanhnt-reports", thanhntReportRoutes);

app.use(errorHandler);

app.listen(port, async () => {
  console.log(`http://localhost:${port}`);
  logger.info(`Customer service running on port: http://localhost:${port}`);
  await connectDB();
});

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason", reason);
});
