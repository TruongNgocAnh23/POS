const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");

const {
  registerUser,
  loginUser,
  // refreshTokenUser,
  logoutUser,
  getUserProfile,
  getAllUser,
} = require("../controllers/identity-controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
// router.post("/refreshtoken", refreshTokenUser);
router.post("/logout", checkAuth, logoutUser);
router.get("/profile/:user_id", checkAuth, getUserProfile);
router.get("/users", checkAuth, getAllUser);
module.exports = router;
