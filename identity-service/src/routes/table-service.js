const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createTable,
  editTable,
  deleteTable,
  tableGetAll,
  tableGetById,
} = require("../controllers/table-controller");

router.post("/table", checkAuth, createTable);
router.patch("/table/:table_id", checkAuth, editTable);
router.delete("/table/:table_id", checkAuth, deleteTable);
router.get("/tables", checkAuth, tableGetAll);
router.get("/table/:table_id", checkAuth, tableGetById);
module.exports = router;
