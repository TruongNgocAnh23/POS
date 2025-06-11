import Redis from "ioredis";
import { logger } from "../utils/logger.js"; // chú ý thêm .js nếu dùng ESM

// Redis mặc định chạy ở redis://127.0.0.1:6379 nếu không có biến môi trường
const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);

redisClient.on("error", (err) => logger.error("Redis error:", err));
redisClient.on("connect", () => logger.info("Redis connected"));

export default redisClient;
