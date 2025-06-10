const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  createAuthorization,
  editAuthorization,
  deleteAuthorization,
  authorizationGetAll,
  authorizationGetById,
} = require("../controllers/authorization-controller");

router.post("/authorization", checkAuth, createAuthorization);
router.patch("/authorization/:authorization_id", checkAuth, editAuthorization);
router.delete(
  "/authorization/:authorization_id",
  checkAuth,
  deleteAuthorization
);
router.get("/authorizations", checkAuth, authorizationGetAll);
router.get("/authorization/:authorization_id", checkAuth, authorizationGetById);
module.exports = router;
