// one thumb rule - can any random stranger can log in ? Yes, but can they access anything or anyone ? No that's why need middleware
const { JWT_SECRET } = require("./config");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header is - ", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({
      message: "Something is missing! Try again",
    });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token is = ", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.userId; //

    next();
  } catch (err) {
    return res.status(403).json({});
  }
};

module.exports = {
  authMiddleware,
};
