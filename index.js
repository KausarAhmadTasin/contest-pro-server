const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dqs9o84.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("contestPro").collection("userCollection");
    const contestsCollection = client
      .db("contestPro")
      .collection("contestsCollection");
    const participantCollection = client
      .db("contestPro")
      .collection("participantCollection");

    // User related api
    app.get("/users", async (req, res) => {
      const email = req.query.email;

      if (email) {
        const query = { email: email };
        const options = {
          projection: {
            _id: 1,
            role: 1,
          },
        };

        const user = await userCollection.findOne(query, options);
        res.send(user);
      } else {
        const users = await userCollection.find().toArray();
        res.send(users);
      }
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ messege: "User already exists", insertedId: null });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const role = req.query.role;
      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          role: role,
        },
      };

      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // Contest related api
    app.get("/contests", async (req, res) => {
      let query = { isPending: false };

      if (req.query.isPending) {
        query.isPending = req.query.isPending === "true";
      } else {
        query.isPending = false;
      }

      if (req.query?.email) {
        query["creator.email"] = req.query.email;
        query.isPending = { $in: [false, true] };
      }

      const contests = await contestsCollection.find(query).toArray();
      res.send(contests);
    });

    app.get("/contests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const contest = await contestsCollection.findOne(query);

      res.send(contest);
    });

    app.post("/contests", async (req, res) => {
      const contest = req.body;
      const result = await contestsCollection.insertOne(contest);

      res.send(result);
    });

    app.patch("/contests/approve/:id", async (req, res) => {
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
    });

    app.delete("/contests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await contestsCollection.deleteOne(query);

      res.send(result);
    });

    // Participants / Submitted contests related API
    app.get("/participants", async (req, res) => {
      const { creator, contest_title, participant } = req.query;

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
        query = { participant_email: contest_title };

        console.log("Participant Query: ", query);

        const participants = await participantCollection.find(query).toArray();
        console.log("Participants Found: ", participants);
        res.send(participants);
      } else if (participant) {
        query.participant_email = participant;
        const participants = await participantCollection.find(query).toArray();

        res.send(participants);
      } else {
        res.status(400).send({ error: "Please provide a valid query" });
      }
    });

    app.post("/participants", async (req, res) => {
      const participantData = req.body;
      const participant = await participantCollection.insertOne(
        participantData
      );
      res.send(participant);
    });

    app.patch("/participants/:id", async (req, res) => {
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

      const query = {
        _id: new ObjectId(id),
      };

      const updateDoc = {
        $set: {
          isWinner: true,
        },
      };

      const result = await participantCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.get("/myParticipations", async (req, res) => {
      const participant_email = req.query.email;
      const query = {
        participant_email: participant_email,
      };

      const result = await participantCollection.find(query).toArray();
      res.send(result);
    });

    // Payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Contest Pro in running!");
});

app.listen(port, () => {
  console.log(`Contest pro is running on port: ${port}`);
});
