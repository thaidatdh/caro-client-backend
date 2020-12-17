const jwt = require("jsonwebtoken");
const config = require("../passport/config");

module.exports = (request, response, next) => {
  let token = request.header("Authorization");
  console.log(token);
  if (!token) return response.status(401).send("Access Denied");
  token = token.replace("Bearer ", "");
  try {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
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
