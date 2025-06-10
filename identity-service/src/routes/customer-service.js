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

router.post("/customer", checkAuth, createCustomer);
router.patch("/customer/:customer_id", checkAuth, editCustomer);
router.delete("/customer/:customer_id", checkAuth, deleteCustomer);
router.get("/customers", checkAuth, getAllCustomer);
router.get("/customer/:customer_id", checkAuth, getCustomerById);
module.exports = router;
