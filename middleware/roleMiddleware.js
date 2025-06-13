const connectDB = require("../config/db");

const verifyAdmin = async (req, res, next) => {
  const db = await connectDB();
  const userCollection = db.collection("userCollection");

  const email = req.decoded.email;
  const user = await userCollection.findOne({ email });

  if (user?.role !== "admin") {
    return res.status(403).send({ message: "Forbidden access" });
  }
  next();
};

const verifyCreator = async (req, res, next) => {
  const db = await connectDB();
  const userCollection = db.collection("userCollection");

  const email = req.decoded.email;
  const user = await userCollection.findOne({ email });

  if (user?.role !== "creator") {
    return res.status(403).send({ message: "Forbidden access" });
  }
  next();
};

module.exports = { verifyAdmin, verifyCreator };
