const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createBranch,
  editBranch,
  deleteBranch,
  getAllBranch,
  getBranchById,
} = require("../controllers/branch-controller");

router.post("/branch", checkAuth, createBranch);
router.patch("/branch/:branch_id", checkAuth, editBranch);
router.delete("/branch/:branch_id", checkAuth, deleteBranch);
router.get("/branch", checkAuth, getAllBranch);
router.get("/branch/:branch_id", checkAuth, getBranchById);
module.exports = router;
