const jwt = require("jsonwebtoken");
const config = require("../passport/config");
const constants = require("../configs");
module.verifyUser = (request, response, next) => {
  let token = request.header("Authorization");
  console.log(token);
  if (!token) return response.status(401).send("Access Denied");
  token = token.replace("Bearer ", "");
  try {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err || decoded.isBlocked || (!decoded.isActive && decoded.user_type === constants.user_types.default)) {
        console.log(err);
        response.status(401).send({ message: "Access Denied" });
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
module.verifyAdmin = (request, response, next) => {
  let token = request.header("Authorization");
  console.log(token);
  if (!token) return response.status(401).send("Access Denied");
  token = token.replace("Bearer ", "");
  try {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err || constants.user_types.default === decoded.user_type || decoded.isBlocked) {
        console.log(err);
        response.status(401).send({ message: "Access Denied" });
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
