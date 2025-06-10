const Authorization = require("../models/Authorization");
const logger = require("../utils/logger");
const { validateAuthorization } = require("../utils/validation");
const redisClient = require("../utils/redisClient");
require("dotenv").config();

//create new authorization
const createAuthorization = async (req, res) => {
  try {
    const { error } = validateAuthorization(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { form_name, permissions } = req.body;

    const authorization = new Authorization({
      form_name,
      permissions,
    });
    await authorization.save();
    const redisListAuthorization = "authorization:all";
    const deleteRedisListAuthorization = await redisClient.del(
      redisListAuthorization
    );
    const redisKey = `authorization:${authorization._id}`;
    const deleteRedis = await redisClient.del(redisKey);
    logger.info("Authorization saved successfully ", authorization._id);
    return res.status(201).json({
      success: true,
      message: "Authorization created successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit authorization
const editAuthorization = async (req, res) => {
  try {
    const authorization_id = req.params.authorization_id;
    const authorization = await Authorization.findById(authorization_id);
    if (!authorization) {
      logger.info("Authorization not found", authorization_id);
      return res.status(404).json({ message: "Authorization not found" });
    }
    Object.assign(authorization, req.body);
    await authorization.save();

    const redisKey = `are:${authorization_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListAuthorization = "authorization:all";
    const deleteRedisListAuthorization = await redisClient.del(
      redisListAuthorization
    );
    await redisClient.set(redisKey, JSON.stringify(authorization));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);

    logger.info("Authorization edited successfully", authorization_id);
    return res.json({
      success: true,
      message: "Authorization edited successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//delete authorization
const deleteAuthorization = async (req, res) => {
  try {
    const authorization_id = req.params.authorization_id;
    const deletedAuthorization = await Authorization.findByIdAndDelete(
      authorization_id
    );
    if (!deletedAuthorization) {
      return res.status(404).json({
        success: false,
        message: "Authorization not found",
      });
    }
    const redisKey = `authorization:${authorization_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListAuthorization = "authorization:all";
    const deleteRedisListAuthorization = await redisClient.del(
      redisListAuthorization
    );
    logger.info("Authorization deleted successfully", authorization_id);
    return res.json({
      success: true,
      message: "Authorization deleted successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//get all
const authorizationGetAll = async (req, res) => {
  try {
    const redisKey = "authorization:all";
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }

    const authorization = await Authorization.find(
      {},
      "_id form_name permissions "
    );
    if (authorization.length > 0) {
      await redisClient.set(redisKey, JSON.stringify(authorization));
      await redisClient.expire(redisKey, process.env.REDIS_TTL);
      return res.status(200).json({
        success: true,
        data: authorization,
        source: "db",
      });
    }
    return res.status(200).json({
      success: true,
      message: "[]",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//get by id
const authorizationGetById = async (req, res) => {
  try {
    const authorization_id = req.params.authorization_id;
    const redisKey = `authorization:${authorization_id}`;
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const authorization = await Authorization.findById(
      { _id: authorization_id },
      "_id form_name permissions"
    );

    if (!authorization) {
      return res.json({
        success: false,
        message: "Authorization not found",
      });
    }
    await redisClient.set(redisKey, JSON.stringify(authorization));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    return res.status(200).json({
      success: true,
      data: authorization,
      souce: "db",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = {
  createAuthorization,
  editAuthorization,
  deleteAuthorization,
  authorizationGetAll,
  authorizationGetById,
};
