const Table = require("../models/Table");
const logger = require("../utils/logger");
const { validateTable } = require("../utils/validation");
const redisClient = require("../utils/redisClient");
require("dotenv").config();

//create new table
const createTable = async (req, res) => {
  try {
    const { error } = validateTable(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, code, note, status, area } = req.body;

    const table = new Table({
      name,
      code,
      note,
      status,
      area,
    });

    await table.save();

    const redisListTable = "table:all";
    const deleteRedisListTable = await redisClient.del(redisListTable);
    const redisKey = `table:${table._id}`;
    const deleteRedis = await redisClient.del(redisKey);
    await redisClient.set(redisKey, JSON.stringify(table));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);

    logger.info("Table saved successfully", table._id);
    return res.status(201).json({
      success: true,
      message: "Table created successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit table
const editTable = async (req, res) => {
  try {
    const table_id = req.params.table_id;
    const table = await Table.findById(table_id);
    if (!table) {
      logger.info("Table not found", table_id);
      return res.status(404).json({ message: "Table not found" });
    }
    Object.assign(table, req.body);
    await table.save();
    //delete old table in redis
    const redisKey = `table:${table_id}`;
    const deleteRedis = await redisClient.del(redisKey);

    //add new table in redis
    await redisClient.set(redisKey, JSON.stringify(table));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    const redisListTable = "table:all";
    await redisClient.del(redisListTable);
    logger.info("Table edited successfully ", table_id);
    return res.json({
      success: true,
      message: "Table edited successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//delete table
const deleteTable = async (req, res) => {
  try {
    const table_id = req.params.table_id;
    const deletedTable = await Table.findByIdAndDelete(table_id);
    if (!deletedTable) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }
    const redisKey = `table:${table_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListTable = "table:all";
    const deleteRedisListTable = await redisClient.del(redisListTable);
    logger.info("Table deleted successfully", table_id);
    return res.json({
      success: true,
      message: "Table deleted successfully",
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
const tableGetAll = async (req, res) => {
  try {
    const redisKey = "table:all";
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const table = await Table.find({}, "_id name code status ");

    if (table.length > 0) {
      await redisClient.set(redisKey, JSON.stringify(table));
      await redisClient.expire(redisKey, process.env.REDIS_TTL);
      return res.status(200).json({
        success: true,
        data: table,
        source: "db",
      });
    }
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//get by id
const tableGetById = async (req, res) => {
  try {
    const table_id = req.params.table_id;
    const redisKey = `table:${table_id}`;
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const table = await Table.findById({ _id: table_id });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }
    await redisClient.set(redisKey, JSON.stringify(table));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    return res.status(200).json({
      success: true,
      data: table,
      source: "db",
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
  createTable,
  editTable,
  deleteTable,
  tableGetAll,
  tableGetById,
};
