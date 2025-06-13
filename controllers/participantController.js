const { ObjectId } = require("mongodb");
const connectDB = require("../config/db");

exports.getParticipants = async (req, res) => {
  try {
    const db = await connectDB();
    const participantCollection = db.collection("participantCollection");

    const { creator, contest_title, participant, winner } = req.query;
    let query = {};

    if (creator) {
      query.creator_email = creator;
      const participants = await participantCollection
        .aggregate([
          { $match: query },
          {
            $group: {
              _id: "$contest_title",
              contest_title: { $first: "$contest_title" },
              contest_prize: { $first: "$contest_prize" },
              transaction_id: { $first: "$transaction_id" },
            },
          },
        ])
        .toArray();
      res.send(participants);
    } else if (contest_title) {
      query = { contest_title: contest_title };
      const participants = await participantCollection.find(query).toArray();
      return res.send(participants);
    } else if (participant) {
      query.participant_email = participant;
      if (winner) {
        query.isWinner = true;
      }
      const participants = await participantCollection.find(query).toArray();
      return res.send(participants);
    } else {
      res.status(400).send({ error: "Please provide a valid query" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getParticipantStats = async (req, res) => {
  try {
    const db = await connectDB();
    const participantCollection = db.collection("participantCollection");

    const allParticipants = await participantCollection.find({}).toArray();
    const totalParticipants = allParticipants.length;
    const winners = allParticipants.filter((p) => p.isWinner === true);
    const totalWinners = winners.length;

    res.send({
      totalParticipants,
      totalWinners,
      participants: allParticipants,
      winners,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.createParticipant = async (req, res) => {
  try {
    const db = await connectDB();
    const participantCollection = db.collection("participantCollection");
    const participantData = req.body;
    const participant = await participantCollection.insertOne(participantData);
    res.send(participant);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.declareWinner = async (req, res) => {
  try {
    const db = await connectDB();
    const participantCollection = db.collection("participantCollection");
    const id = req.params.id;

    const participant = await participantCollection.findOne({
      _id: new ObjectId(id),
    });
    const contestTitle = participant.contest_title;

    const existingWinner = await participantCollection.findOne({
      contest_title: contestTitle,
      isWinner: true,
    });

    if (existingWinner) {
      return res.status(400).send({
        message: "A winner has already been declared for this contest",
      });
    }

    const query = { _id: new ObjectId(id) };
    const updateDoc = { $set: { isWinner: true } };

    const result = await participantCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getMyParticipations = async (req, res) => {
  try {
    const db = await connectDB();
    const participantCollection = db.collection("participantCollection");
    const participant_email = req.query.email;
    const query = { participant_email: participant_email };
    const result = await participantCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
