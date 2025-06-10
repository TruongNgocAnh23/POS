const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createArea,
  editArea,
  deleteArea,
  areaGetAll,
  areaGetById,
} = require("../controllers/area-controller");

router.post("/area", checkAuth, createArea);
router.patch("/area/:area_id", checkAuth, editArea);
router.delete("/area/:area_id", checkAuth, deleteArea);
router.get("/areas", checkAuth, areaGetAll);
router.get("/area/:area_id", checkAuth, areaGetById);
module.exports = router;
