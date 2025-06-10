import jwt from "jsonwebtoken";
// import Customer from "../models/customer.model.js";

// const protectRoute = async (req, res, next) => {
//   try {
//     const token = req.cookies.customer_access_token;

//     if (!token) {
//       return res
//         .status(401)
//         .json({ error: true, message: "Token not provided." });
//     }

//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//     if (!decoded) {
//       return res.status(401).json({ error: true, message: "Token not valid." });
//     }

//     // const user = await Customer.findById(decoded.userId).select("-password");

//     if (!user) {
//       return res.status(404).json({ error: true, message: "User not found." });
//     }

//     req.user = decoded;
//     next();
//   } catch (error) {
//     error.methodName = protectRoute.name;
//     next(error);
//   }
// };

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: true, message: "Authorization token not provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      return res.status(401).json({ error: true, message: "Token not valid." });
    }

    req.userData = decoded;
    next();
  } catch (error) {
    error.methodName = protectRoute.name;
    next(error);
  }
};

export { protectRoute };
