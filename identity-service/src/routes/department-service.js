const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createDepartment,
  editDepartment,
  deleteDepartment,
} = require("../controllers/department-controller");

router.post("/department", checkAuth, createDepartment);
router.patch("/department/:department_id", checkAuth, editDepartment);
router.delete("/department/:department_id", checkAuth, deleteDepartment);

module.exports = router;
