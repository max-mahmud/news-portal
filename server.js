require("dotenv").config();

const express = require("express");
// const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

// express app
const app = express();
//opSahadat
// middlewares
app.use(express.json());
// app.use(bodyParser.json());
app.use(cors());

// endpoints
app.use('/', require('./routes/authRoutes'))
app.get('/', (req, res) => res.send('Hello World!'))


// port
const PORT = process.env.PORT || 4000;


// connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // listening for requests
    app.listen(PORT, (req, res) => {
      console.log(`Connected to DB && server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
  });