import jwt from "jsonwebtoken";

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
    req.token = token;
    next();
  } catch (error) {
    error.methodName = protectRoute.name;
    next(error);
  }
};

export { protectRoute };
