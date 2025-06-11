const logger = require("../utils/logger");
const {
  validateRegistration,
  validateLogin,
  validateLogout,
} = require("../utils/validation");
const User = require("../models/User");
const Authorization = require("../models/Authorization");
const RefreshToken = require("../models/RefreshToken");
const generateTokens = require("../utils/generateToken");

//register
const registerUser = async (req, res) => {
  logger.info("Resgistration endpoint hit...");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const {
      user_name,
      password,
      first_name,
      last_name,
      role,
      gender,
      birthday,
      avatar,
    } = req.body;
    let user = await User.findOne({ user_name });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    user = new User({
      user_name,
      password,
      first_name,
      last_name,
      role,
      gender,
      birthday,
      avatar,
    });
    await user.save();
    logger.info("User saved successfully", user._id);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (err) {
    logger.error("Registration error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Login
const loginUser = async (req, res) => {
  logger.info("Login end point hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { user_name, password } = req.body;
    let user = await User.findOne({ user_name })
      .populate("role.company", "_id name code address")
      .populate("role.branch", "_id name code address")
      .populate("role.department", "_id name code");
    if (!user) {
      logger.warn("Invalid user");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }
    const { accessToken, refreshToken } = await generateTokens(user);

    const authorizationRaw = await Authorization.find(
      {
        "permissions.users.user": user._id,
        "permissions.isActive": true,
      },
      "form_name permissions.action permissions.users.user"
    ).lean();
    if (authorizationRaw.length > 0) {
      const filteredAuthorization = authorizationRaw
        .map((auth) => {
          const filteredPermissions = auth.permissions
            .map((permission) => {
              const filteredUsers = permission.users.filter(
                (u) => u.user.toString() === user._id.toString()
              );
              return filteredUsers.length > 0
                ? {
                    ...permission,
                    users: filteredUsers,
                  }
                : null;
            })
            .filter(Boolean);

          return {
            ...auth,
            permissions: filteredPermissions,
          };
        })
        .filter((auth) => auth.permissions.length > 0);

      return res.status(201).json({
        success: true,
        accesstoken: accessToken,
        refreshtoken: refreshToken,
        user_id: user._id,
        role: [user.role, filteredAuthorization],
        // authorization: filteredAuthorization,
      });
    }
    return res.status(201).json({
      success: true,
      accesstoken: accessToken,
      refreshtoken: refreshToken,
      user_id: user._id,
      role: user.role,
      authorization: [],
    });
  } catch (err) {
    logger.error("Login error occured", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// Refresh token
// const refreshTokenUser = async (req, res) => {
//   logger.info("Refresh token endpoint hit...");
//   try {
//     const { refreshToken } = req.body;
//     if (!refreshToken) {
//       logger.warn("Refresh token misssing");
//       return res.status(400).json({
//         success: false,
//         message: "Refresh token misssing",
//       });
//     }
//     const storedToken = await RefreshToken.findOne({ token: refreshToken });
//     if (!storedToken || storedToken < new Date()) {
//       logger.info("Invalid or expired refresh token");
//       return res.status(401).json({
//         success: false,
//         message: "Invalid or expired refresh token",
//       });
//     }
//     const user = await User.findById(storedToken.user);
//     if (!user) {
//       logger.warn("User not found");
//       return res.status(401).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
//       await generateTokens(user);
//     await RefreshToken.deleteOne({ _id: storedToken._id });
//     res.json({
//       accessToken: newAccessToken,
//       refreshToken: newRefreshToken,
//     });
//   } catch (err) {
//     logger.error("Refresh token error occured", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };
//logout
const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  const { error } = validateLogout(req.body);
  if (error) {
    logger.warn("Validation error", error.details[0].message);
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  try {
    const refreshtoken = req.body.refreshtoken;
    if (!refreshtoken) {
      logger.warn("Refresh token misssing");
      return res.status(400).json({
        success: false,
        message: "Refresh token misssing",
      });
    }
    await RefreshToken.deleteOne({ token: refreshtoken });
    logger.info("Refresh token deleted for logout");
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    logger.error("Error while logging out", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//get profile
const getUserProfile = async (req, res) => {
  logger.info("Get profile endpoint hit...");
  try {
    const user_id = req.params.user_id;
    if (!user_id) {
      logger.warn("Missing user_id in request parameters");
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }
    const userProfile = await User.findById({ _id: user_id })
      .populate("role.company", "_id name code address")
      .populate("role.branch", "_id name code address")
      .populate("role.department", "_id name code");

    if (!userProfile) {
      logger.warn(`Invalid user with user_id: ${user_id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (err) {
    logger.error("Error occurred while getting user profile", {
      error: err.message,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//get all user
const getAllUser = async (req, res) => {
  logger.info("Get all user endpoint hit...");
  try {
    const listUser = await User.find({})
      .populate("role.company", "_id name code")
      .populate("role.branch", "_id name code");
    // .populate("role.department", "_id name code");
    return res.status(200).json({
      success: true,
      data: listUser,
    });
  } catch (err) {
    logger.error("Error occurred while getting user profile", {
      error: err.message,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const setAuthorization = async (req, res) => {
  logger.info("Set authorization endpoint hit...");
  try {
    const listUser = await User.find({})
      .populate("role.company", "_id name code")
      .populate("role.branch", "_id name code");
    // .populate("role.department", "_id name code");
    return res.status(200).json({
      success: true,
      data: listUser,
    });
  } catch (err) {
    logger.error("Error occurred while getting user profile", {
      error: err.message,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  // refreshTokenUser,
  logoutUser,
  getUserProfile,
  getAllUser,
};
