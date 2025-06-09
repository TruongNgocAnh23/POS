const Company = require("../models/Area");
const logger = require("../utils/logger");
const { validateArea } = require("../utils/validation");
const redisClient = require("../utils/redisClient");
const Area = require("../models/Area");

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

    const { name, code, note } = req.body;

    const area = new Area({
      name,
      code,
      note,
    });
    await area.save();
    logger.info("Area saved successfully ", company._id);
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
    await redisClient.expire(redisKey, 3600); // TTL 1 giờ

    logger.info("Area edited successfully", company._id);
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
      await redisClient.expire(redisKey, 3600); // TTL 1 giờ
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
    await redisClient.expire(redisKey, 3600); // TTL 1 giờ  await redisClient.set(redisKey, JSON.stringify(department));
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
