const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://contest-pro-58eec.web.app",
      "https://contest-pro-58eec.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const contestRoutes = require("./routes/contestRoutes");
const participantRoutes = require("./routes/participantRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/contests", contestRoutes);
app.use("/participants", participantRoutes);
app.use("/create-payment-intent", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Contest Pro is running!");
});

app.listen(port, () => {
  console.log(`Contest pro is running on port: ${port}`);
});
