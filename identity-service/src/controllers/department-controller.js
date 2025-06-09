const Department = require("../models/Department");
const logger = require("../utils/logger");
const { validateDepartment } = require("../utils/validation");
const redisClient = require("../utils/redisClient");

//create new department
const createDepartment = async (req, res) => {
  try {
    const { error } = validateDepartment(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, code, note, branch } = req.body;

    const department = new Department({
      name,
      code,
      branch,
      note,
    });

    await department.save();

    logger.info("Department saved successfully ", department._id);
    return res.status(201).json({
      success: true,
      message: "Department created successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit department
const editDepartment = async (req, res) => {
  try {
    const department_id = req.params.department_id;
    const department = await Department.findById(department_id);
    if (!department) {
      logger.info("Department not found", department_id);
      return res.status(404).json({ message: "Department not found" });
    }
    Object.assign(department, req.body);
    await department.save();
    //edit redis
    const redisKey = `department:${department_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    await redisClient.set(redisKey, JSON.stringify(department));
    await redisClient.expire(redisKey, 3600); // TTL 1 giờ

    logger.info("Department edited successfully", department._id);
    return res.json({
      success: true,
      message: "Department edited successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//delete department
const deleteDepartment = async (req, res) => {
  try {
    const department_id = req.params.department_id;
    const deletedDepartment = await Department.findByIdAndDelete(department_id);
    if (!deletedDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.json({
      success: true,
      message: "Department deleted successfully",
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
const departmentGetAll = async (req, res) => {
  try {
    const redisKey = "department:all";
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }

    const department = await Department.find({}, "_id name code ").populate(
      "branch",
      "_id name code"
    );
    if (department.length > 0) {
      // return res.status(200).json({
      //   success: true,
      //   data: department,
      // });
      await redisClient.set(redisKey, JSON.stringify(department));
      await redisClient.expire(redisKey, 3600); // TTL 1 giờ
      return res.status(200).json({
        success: true,
        data: department,
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
const departmentGetById = async (req, res) => {
  try {
    const department_id = req.params.department_id;
    const redisKey = `department:${department_id}`;
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const department = await Department.findById(
      { _id: department_id },
      "_id name code "
    ).populate("branch", "_id name code");

    if (!department) {
      return res.json({
        success: false,
        message: "Department not found",
      });
    }
    await redisClient.set(redisKey, JSON.stringify(department));
    await redisClient.expire(redisKey, 3600); // TTL 1 giờ
    return res.status(200).json({
      success: true,
      data: department,
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
  createDepartment,
  editDepartment,
  deleteDepartment,
  departmentGetAll,
  departmentGetById,
};
