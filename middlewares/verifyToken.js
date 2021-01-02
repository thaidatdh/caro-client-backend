const jwt = require("jsonwebtoken");
const config = require("../passport/config");
const constants = require("../configs");
exports.verifyUser = (request, response, next) => {
  let token = request.header("Authorization");
  if (!token) return response.status(401).send("Access Denied");
  token = token.replace("Bearer ", "");

  try {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (
        err ||
        decoded.isBlocked ||
        (!decoded.isActive &&
          decoded.user_type === constants.user_types.default)
      ) {
        console.log(err);
        response.status(401).send({ message: "Access Denied" });
      } else {
        request.user = decoded;
        request.isLoggedIn = true;
        console.log("Verify");
        next();
      }
    });
  } catch (err) {
    return response.status(400).send({ message: "Invalid Token" });
  }
};
exports.verifyUserExist = (request, response, next) => {
  let token = request.header("Authorization");
  if (!token) return response.status(401).send("Access Denied");
  token = token.replace("Bearer ", "");
  try {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        response.status(401).send({ message: "Access Denied" });
      } else {
        request.user = decoded;
        next();
      }
    });
  } catch (err) {
    return response.status(400).send({ message: "Invalid Token" });
  }
};
exports.verifyAdmin = (request, response, next) => {
  let token = request.header("Authorization");
  if (!token) return response.status(401).send("Access Denied 1");
  token = token.replace("Bearer ", "");
  try {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (
        err ||
        constants.user_types.default === decoded.user_type ||
        decoded.isBlocked
      ) {
        response.status(401).send({ message: "Access Denied 2" });
      } else {
        request.user = decoded;
        request.isLoggedIn = true;
        next();
      }
    });
  } catch (err) {
    return response.status(400).send({ message: "Invalid Token" });
  }
};
