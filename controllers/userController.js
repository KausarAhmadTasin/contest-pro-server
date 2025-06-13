const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");

exports.getAllUsers = async (req, res) => {
  try {
    const db = await connectDB();
    const userCollection = db.collection("userCollection");

    const { profile } = req.query;
    if (profile) {
      const user = await userCollection.findOne({ email: profile });
      return res.send(user);
    }

    const users = await userCollection.find().toArray();
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getUserRole = async (req, res) => {
  try {
    const db = await connectDB();
    const userCollection = db.collection("userCollection");
    const email = req.params.email;

    const options = {
      projection: {
        _id: 1,
        role: 1,
        name: 1,
        email: 1,
      },
    };

    const user = await userCollection.findOne({ email }, options);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(user);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const db = await connectDB();
    const userCollection = db.collection("userCollection");
    const user = req.body;

    const existingUser = await userCollection.findOne({ email: user.email });
    if (existingUser) {
      return res.status(400).send({
        message: "User already exists",
        insertedId: null,
      });
    }

    if (!user.role) {
      user.role = "user";
    }

    user.createdAt = new Date();

    const result = await userCollection.insertOne(user);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const db = await connectDB();
    const userCollection = db.collection("userCollection");
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user ID" });
    }

    const query = { _id: new ObjectId(id) };
    const result = await userCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const db = await connectDB();
    const userCollection = db.collection("userCollection");
    const id = req.params.id;
    const { role } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user ID" });
    }

    const validRoles = ["user", "creator", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).send({ message: "Invalid role specified" });
    }

    const query = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role,
        updatedAt: new Date(),
      },
    };

    const result = await userCollection.updateOne(query, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ message: "User role updated successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const db = await connectDB();
    const userCollection = db.collection("userCollection");
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid user ID" });
    }

    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const { password, ...userData } = user;
    res.send(userData);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// const { ObjectId } = require("mongodb");
// const connectDB = require("../config/db");

// exports.getAllUsers = async (req, res) => {
//   try {
//     const db = await connectDB();
//     const userCollection = db.collection("userCollection");

//     const { profile } = req.query;
//     if (profile) {
//       const user = await userCollection.findOne({ email: profile });
//       return res.send(user);
//     }

//     const users = await userCollection.find().toArray();
//     res.send(users);
//   } catch (error) {
//     res.status(500).send({ message: error.message });
//   }
// };

// // Implement other user controller methods similarly...
// // getUserRole, createUser, deleteUser, updateUserRole
