const Company = require("../models/Company");
const logger = require("../utils/logger");
const { validateCompany } = require("../utils/validation");
const redisClient = require("../utils/redisClient");
require("dotenv").config();

//create new company
const createCompany = async (req, res) => {
  try {
    const { error } = validateCompany(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, code, phone, hotline, address, tax, fax, note } = req.body;

    const company = new Company({
      name,
      code,
      phone,
      hotline,
      address,
      tax,
      fax,
      note,
    });

    await company.save();
    const redisListCompany = "company:all";
    const deleteRedisListCompany = await redisClient.del(redisListCompany);
    const redisKey = `company:${company._id}`;
    const deleteRedis = await redisClient.del(redisKey);
    logger.info("Company saved successfully ", company._id);
    return res.status(201).json({
      success: true,
      message: "Company created successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit company
const editCompany = async (req, res) => {
  try {
    const companyId = req.params.company_id;
    const company = await Company.findById(companyId);
    if (!company) {
      logger.info("Company not found", companyId);
      return res.status(404).json({ message: "Company not found" });
    }
    Object.assign(company, req.body);
    await company.save();

    const redisListCompany = "company:all";
    const deleteRedisListCompany = await redisClient.del(redisListCompany);
    const redisCompany = `company:${companyId}`;
    const deleteRedis = await redisClient.del(redisCompany);
    logger.info("Company edited successfully", companyId);
    return res.json({
      success: true,
      message: "Company edited successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//delete company
const deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.company_id;
    const deletedCompany = await Company.findByIdAndDelete(companyId);
    if (!deletedCompany) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    const redisKey = `company:${companyId}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListCompany = "company:all";
    const deleteRedisListCompany = await redisClient.del(redisListCompany);
    logger.info("Company deleted successfully", department_id);
    return res.json({
      success: true,
      message: "Company deleted successfully",
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
const companyGetAll = async (req, res) => {
  try {
    const redisKey = "company:all";
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }

    const company = await Company.find({}, "_id name code ");
    if (company.length > 0) {
      await redisClient.set(redisKey, JSON.stringify(company));
      await redisClient.expire(redisKey, process.env.REDIS_TTL);
      return res.status(200).json({
        success: true,
        data: company,
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
const companyGetById = async (req, res) => {
  try {
    const company_id = req.params.company_id;
    const redisKey = `company:${company_id}`;
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const company = await Company.findById(
      { _id: company_id },
      "_id name code "
    );

    if (!company) {
      return res.json({
        success: false,
        message: "Company not found",
      });
    }
    await redisClient.set(redisKey, JSON.stringify(company));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    return res.status(200).json({
      success: true,
      data: company,
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
  createCompany,
  editCompany,
  deleteCompany,
  companyGetAll,
  companyGetById,
};
