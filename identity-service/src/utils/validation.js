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
    gender: Joi.number().optional(),
    birthday: Joi.date().optional(),
    avatar: Joi.string().optional(),
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
    branch: Joi.string().required(),
  });
  return schema.validate(data);
};
const validateTable = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    note: Joi.string().optional(),
    code: Joi.string().optional(),
    status: Joi.number().optional(),
    area: Joi.string().required(),
  });
  return schema.validate(data);
};
const validateCustomer = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    note: Joi.string().optional(),
    code: Joi.string().optional(),
    created_by: Joi.string().required(),
    gender: Joi.number().optional(),
    birthday: Joi.date().optional(),
    avatar: Joi.string().optional(),
  });
  return schema.validate(data);
};

const validatePaymentMethod = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    note: Joi.string().optional(),
    code: Joi.string().optional(),
    branch: Joi.string().required(),
  });
  return schema.validate(data);
};

const validateAuthorization = (data) => {
  const schema = Joi.object({
    form_name: Joi.string().required(),
    permissions: Joi.array()
      .items(
        Joi.object({
          action: Joi.string().required(),
          isActive: Joi.boolean().optional(),
        })
      )
      .optional(),
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
  validateTable,
  validateCustomer,
  validatePaymentMethod,
  validateAuthorization,
};
