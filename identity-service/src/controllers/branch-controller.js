const Branch = require("../models/Branch");
const logger = require("../utils/logger");
const { validateBranch } = require("../utils/validation");
const redisClient = require("../utils/redisClient");
require("dotenv").config();

//create new branch
const createBranch = async (req, res) => {
  try {
    const { error } = validateBranch(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, code, phone, hotline, address, tax, fax, note, company } =
      req.body;

    const branch = new Branch({
      name,
      code,
      phone,
      hotline,
      address,
      tax,
      fax,
      note,
      company,
    });

    await branch.save();

    const redisListBranch = "branch:all";
    const deleteRedisListBranch = await redisClient.del(redisListBranch);
    const redisKey = `branch:${branch._id}`;
    const deleteRedis = await redisClient.del(redisKey);
    await redisClient.set(redisKey, JSON.stringify(branch));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);

    logger.info("Branch saved successfully", branch._id);
    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit branch
const editBranch = async (req, res) => {
  try {
    const branch_id = req.params.branch_id;
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      logger.info("Branch not found", branch_id);
      return res.status(404).json({ message: "Branch not found" });
    }
    Object.assign(branch, req.body);
    await branch.save();
    //delete old branch in redis
    const redisKey = `branch:${branch_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    //add new branch in redis
    await redisClient.set(redisKey, JSON.stringify(branch));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);

    logger.info("Branch edited successfully ", branch_id);
    return res.json({
      success: true,
      message: "Branch edited successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//delete branch
const deleteBranch = async (req, res) => {
  try {
    const branch_id = req.params.branch_id;
    const deletedBranch = await Branch.findByIdAndDelete(branch_id);
    if (!deletedBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }
    const redisKey = `branch:${branch_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListArea = "branch:all";
    const deleteRedisListArea = await redisClient.del(redisListArea);
    logger.info("Branch deleted successfully", branch_id);
    return res.json({
      success: true,
      message: "Branch deleted successfully",
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
const getAllBranch = async (req, res) => {
  try {
    const redisKey = "branch:all";
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const branch = await Branch.find({}, "_id name code ").populate(
      "company",
      "name code"
    );
    if (branch.length > 0) {
      await redisClient.set(redisKey, JSON.stringify(branch));
      await redisClient.expire(redisKey, process.env.REDIS_TTL);
      return res.status(200).json({
        success: true,
        data: branch,
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
const getBranchById = async (req, res) => {
  try {
    const branch_id = req.params.branch_id;
    const redisKey = `branch:${branch_id}`;
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const branch = await Branch.findById({ _id: branch_id }).populate(
      "company",
      "name code"
    );
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }
    await redisClient.set(redisKey, JSON.stringify(branch));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    return res.status(200).json({
      success: true,
      date: branch,
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
  createBranch,
  editBranch,
  deleteBranch,
  getAllBranch,
  getBranchById,
};
