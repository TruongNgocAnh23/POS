const { date } = require("joi");
const Branch = require("../models/Branch");
const logger = require("../utils/logger");
const { validateBranch } = require("../utils/validation");

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

    logger.info("Branch saved successfully", company._id);
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
      logger.info("Branch not found", branch._id);
      return res.status(404).json({ message: "Branch not found" });
    }
    Object.assign(branch, req.body);
    await branch.save();
    logger.info("Branch edited successfully ", branch._id);
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
    const branch = await Branch.find({}, "_id name code ").populate(
      "company",
      "name code"
    );
    if (branch.length > 0) {
      return res.status(200).json({
        success: true,
        data: branch,
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
    return res.status(200).json({
      success: true,
      date: branch,
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
