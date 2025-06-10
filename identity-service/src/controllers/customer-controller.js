const Customer = require("../models/Customer");
const logger = require("../utils/logger");
const { validateCustomer } = require("../utils/validation");
const redisClient = require("../utils/redisClient");
const { custom } = require("joi");
require("dotenv").config();

//create new customer
const createCustomer = async (req, res) => {
  try {
    const { error } = validateCustomer(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, code, phone, address, note, create_by, loyalty_point } =
      req.body;

    const customer = new Customer({
      name,
      code,
      phone,
      address,
      note,
      loyalty_point,
      create_by,
    });

    await customer.save();

    const redisListCustomer = "customer:all";
    const deleteRedisListCustomer = await redisClient.del(redisListCustomer);
    const redisKey = `customer:${customer._id}`;
    const deleteRedis = await redisClient.del(redisKey);
    await redisClient.set(redisKey, JSON.stringify(customer));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);

    logger.info("Customer saved successfully", customer._id);
    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit customer
const editCustomer = async (req, res) => {
  try {
    const customer_id = req.params.customer_id;
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      logger.info("Customer not found", customer_id);
      return res.status(404).json({ message: "Customer not found" });
    }
    Object.assign(customer, req.body);
    await customer.save();
    //delete old customer in redis
    const redisKey = `customer:${customer_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    //add new customer in redis
    await redisClient.set(redisKey, JSON.stringify(customer));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);

    logger.info("Customer edited successfully ", customer_id);
    return res.json({
      success: true,
      message: "Customer edited successfully",
    });
  } catch (err) {
    logger.error("Error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer_id = req.params.customer_id;
    const deletedCustomer = await Customer.findByIdAndDelete(customer_id);
    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }
    const redisKey = `customer:${customer_id}`;
    const deleteRedis = await redisClient.del(redisKey);
    const redisListCustomer = "customer:all";
    const deleteRedisListCustomer = await redisClient.del(redisListCustomer);
    logger.info("Customer deleted successfully", customer_id);
    return res.json({
      success: true,
      message: "Customer deleted successfully",
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
const getAllCustomer = async (req, res) => {
  try {
    const redisKey = "customer:all";
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const customer = await Customer.find({})
      .populate("created_by", "_id name code")
      .populate("updated_by", "_id name code");
    if (customer.length > 0) {
      await redisClient.set(redisKey, JSON.stringify(customer));
      await redisClient.expire(redisKey, process.env.REDIS_TTL);
      return res.status(200).json({
        success: true,
        data: customer,
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
const getCustomerById = async (req, res) => {
  try {
    const customer_id = req.params.customer_id;
    const redisKey = `customer:${customer_id}`;
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: parsed,
        source: "cache",
      });
    }
    const customer = await Customer.findById({ _id: customer_id })
      .populate("created_by", "_id name code")
      .populate("updated_by", "_id name code");
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }
    await redisClient.set(redisKey, JSON.stringify(customer));
    await redisClient.expire(redisKey, process.env.REDIS_TTL);
    return res.status(200).json({
      success: true,
      data: customer,
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
  createCustomer,
  editCustomer,
  deleteCustomer,
  getAllCustomer,
  getCustomerById,
};
