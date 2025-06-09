const Joi = require("joi");
const Company = require("../models/Company");

//user
const validateRegistration = (data) => {
  const schema = Joi.object({
    user_name: Joi.string().required(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().optional(),
    role: Joi.array().required(),
  });
  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    user_name: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

const validateLogout = (data) => {
  const schema = Joi.object({
    refreshtoken: Joi.string().required(),
  });
  return schema.validate(data);
};
//company
const validateCompany = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    tax: Joi.string().optional(),
    fax: Joi.string().optional(),
    hotline: Joi.string().optional(),
    note: Joi.string().optional(),
    code: Joi.string().optional(),
  });
  return schema.validate(data);
};
//branch
const validateBranch = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    company: Joi.string().required(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    tax: Joi.string().optional(),
    fax: Joi.string().optional(),
    hotline: Joi.string().optional(),
    note: Joi.string().optional(),
    code: Joi.string().optional(),
  });
  return schema.validate(data);
};
//department
const validateDepartment = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    branch: Joi.string().required(),
    note: Joi.string().optional(),
    code: Joi.string().optional(),
  });
  return schema.validate(data);
};
const validateArea = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    note: Joi.string().optional(),
    code: Joi.string().optional(),
  });
  return schema.validate(data);
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateLogout,
  validateCompany,
  validateBranch,
  validateDepartment,
  validateArea,
};
