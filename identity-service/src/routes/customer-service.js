const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createCustomer,
  editCustomer,
  deleteCustomer,
  getAllCustomer,
  getCustomerById,
} = require("../controllers/customer-controller");

router.post("/company", checkAuth, createCompany);
router.patch("/company/:company_id", checkAuth, editCompany);
router.delete("/company/:company_id", checkAuth, deleteCompany);
router.get("/companies", checkAuth, companyGetAll);
router.get("/company/:company_id", checkAuth, companyGetById);
module.exports = router;
