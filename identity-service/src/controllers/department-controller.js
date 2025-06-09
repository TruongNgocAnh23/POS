const Department = require("../models/Department");
const logger = require("../utils/logger");
const { validateDepartment } = require("../utils/validation");

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
      logger.info("Department not found", department._id);
      return res.status(404).json({ message: "Department not found" });
    }
    Object.assign(department, req.body);
    await department.save();
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

module.exports = {
  createDepartment,
  editDepartment,
  deleteDepartment,
};
