// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// module.exports = (req, res, next) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.userData = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       message: "Auth failed, erro" + error,
//     });
//   }
// };
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization header missing or malformed",
    });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Auth failed: " + error.message,
    });
  }
};
