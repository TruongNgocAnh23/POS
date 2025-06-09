const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createCompany,
  editCompany,
  deleteCompany,
  companyGetAll,
  companyGetById,
} = require("../controllers/company-controller");

router.post("/company", checkAuth, createCompany);
router.patch("/company/:company_id", checkAuth, editCompany);
router.delete("/company/:company_id", checkAuth, deleteCompany);
router.get("/companies", checkAuth, companyGetAll);
router.get("/company/:company_id", checkAuth, companyGetById);
module.exports = router;
