import { logger } from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res
    .status(500)
    .json({
      error: true,
      message: `Error in ${err.methodName} module: ${err.message}`,
    });
};

export { errorHandler };
