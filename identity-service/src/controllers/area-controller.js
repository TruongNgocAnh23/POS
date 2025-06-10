const Area = require("../models/Area");
const logger = require("../utils/logger");
const { validateArea } = require("../utils/validation");
const redisClient = require("../utils/redisClient");
require("dotenv").config();

//create new area
const createArea = async (req, res) => {
  try {
    const { error } = validateArea(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, code, note, branch } = req.body;

    const area = new Area({
      name,
      code,
      note,
      branch,
    });
    await area.save();
    const redisListArea = "area:all";
    const deleteRedisListArea = await redisClient.del(redisListArea);
    const redisKey = `area:${area._id}`;
    const deleteRedis = await redisClient.del(redisKey);
    await redisClient.set(redisKey, JSON.stringify(area));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    logger.info("Area saved successfully ", area._id);
    return res.status(201).json({
      success: true,
      message: "Area created successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit area
const editArea = async (req, res) => {
  try {
    const area_id = req.params.area_id;
    const area = await Area.findById(area_id);
    if (!area) {
      logger.info("Area not found", area_id);
      return res.status(404).json({ message: "Area not found" });
    }
    Object.assign(area, req.body);
    await area.save();

    const redisKey = `are:${area_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListArea = "area:all";
    const deleteRedisListArea = await redisClient.del(redisListArea);
    await redisClient.set(redisKey, JSON.stringify(area));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);

    logger.info("Area edited successfully", area_id);
    return res.json({
      success: true,
      message: "Area edited successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//delete area
const deleteArea = async (req, res) => {
  try {
    const areaId = req.params.area_id;
    const deletedArea = await Area.findByIdAndDelete(areaId);
    if (!deletedArea) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }
    const redisKey = `area:${areaId}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListArea = "area:all";
    const deleteRedisListArea = await redisClient.del(redisListArea);
    logger.info("Area deleted successfully", areaId);
    return res.json({
      success: true,
      message: "Area deleted successfully",
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
const areaGetAll = async (req, res) => {
  try {
    const redisKey = "area:all";
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }

    const area = await Area.find({}, "_id name code ").populate(
      "branch",
      "_id name code"
    );
    if (area.length > 0) {
      await redisClient.set(redisKey, JSON.stringify(area));
      await redisClient.expire(redisKey, process.env.REDIS_TTL);
      return res.status(200).json({
        success: true,
        data: area,
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
const areaGetById = async (req, res) => {
  try {
    const area_id = req.params.area_id;
    const redisKey = `area:${area_id}`;
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const area = await Area.findById(
      { _id: area_id },
      "_id name code "
    ).populate("branch", "_id name code");

    if (!area) {
      return res.json({
        success: false,
        message: "Area not found",
      });
    }
    await redisClient.set(redisKey, JSON.stringify(area));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    return res.status(200).json({
      success: true,
      data: area,
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
  createArea,
  editArea,
  deleteArea,
  areaGetAll,
  areaGetById,
};
