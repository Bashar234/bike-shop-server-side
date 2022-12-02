const jwt = require("jsonwebtoken");
require("dotenv").config();
//jwt
const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  //console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send({ error: "unauthorized access" });
  
  const token = authHeader.split(" ")[1];
  //console.log(process.env.JWT_SECRETE);
  jwt.verify(token, process.env.JWT_SECRETE, function (err, decoded) {
    if (err) {
      //  console.log(err);
      return res.status(403).send({ error: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};
module.exports = verifyJwt;
