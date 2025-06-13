const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");

exports.getAllContests = async (req, res) => {
  try {
    const db = await connectDB();
    const contestsCollection = db.collection("contestsCollection");

    let query = { isPending: false };

    if (req.query.isPending) {
      query.isPending = req.query.isPending === "true";
    }

    if (req.query.email) {
      query["creator.email"] = req.query.email;
      query.isPending = { $in: [false, true] };
    }

    if (req.query.contestType && req.query.contestType !== "Others") {
      query.contestType = req.query.contestType;
    } else if (req.query.contestType === "Others") {
      query.contestType = {
        $nin: ["Book Review", "Movie Review", "Article Writing"],
      };
    }

    const contests = await contestsCollection.find(query).toArray();
    res.send(contests);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getContestById = async (req, res) => {
  try {
    const db = await connectDB();
    const contestsCollection = db.collection("contestsCollection");
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const contest = await contestsCollection.findOne(query);
    res.send(contest);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.createContest = async (req, res) => {
  try {
    const db = await connectDB();
    const contestsCollection = db.collection("contestsCollection");
    const contest = req.body;
    const result = await contestsCollection.insertOne(contest);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.approveContest = async (req, res) => {
  try {
    const db = await connectDB();
    const contestsCollection = db.collection("contestsCollection");
    const contestId = req.params.id;

    const result = await contestsCollection.updateOne(
      { _id: new ObjectId(contestId) },
      { $set: { isPending: false } }
    );

    if (result.modifiedCount > 0) {
      res.send({ message: "Contest approved successfully" });
    } else {
      res.status(400).send({ message: "Failed to approve contest" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deleteContest = async (req, res) => {
  try {
    const db = await connectDB();
    const contestsCollection = db.collection("contestsCollection");
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await contestsCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.addRating = async (req, res) => {
  try {
    const db = await connectDB();
    const contestsCollection = db.collection("contestsCollection");
    const participantCollection = db.collection("participantCollection");

    const { rating, id, participant_email } = req.body;
    const query = { _id: new ObjectId(id) };

    const participantQuery = {
      contest_id: id,
      participant_email: participant_email,
    };

    const contest = await participantCollection.findOne(participantQuery);

    const update = {
      $push: {
        ratings: rating,
      },
    };

    if (!contest) {
      return res.status(400).send({
        message: "You are not a participant.",
      });
    }

    const result = await contestsCollection.updateOne(query, update);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
