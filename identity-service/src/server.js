require("dotenv").config();
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const errorHandler = require("./middleware/errorHandler");
const IdentityRoutes = require("./routes/identity-service");
const CompanyRoutes = require("./routes/company-service");
const BranchRoutes = require("./routes/branch-service");
const DepartmentRoutes = require("./routes/department-service");

const app = express();
const PORT = process.env.PORT || 4001;
//connect to mongodb
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connect to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

//connect to redis
const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded from IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    });
});

const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply this sensitive EndpointsLimiter to routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);
app.use("/api/auth/login", sensitiveEndpointsLimiter);

//Routes
app.use("/api/auth", IdentityRoutes);
app.use("/api/auth", CompanyRoutes);
app.use("/api/auth", BranchRoutes);
app.use("/api/auth", DepartmentRoutes);
//error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity service running on port: ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", {
    reason: reason instanceof Error ? reason.stack : reason,
    promise,
    service: "identity-service",
    timestamp: new Date().toISOString(),
  });
});
