const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createCompany,
  editCompany,
  deleteCompany,
} = require("../controllers/company-controller");

router.post("/company", checkAuth, createCompany);
router.patch("/company/:company_id", checkAuth, editCompany);
router.delete("/company/:company_id", checkAuth, deleteCompany);

module.exports = router;
