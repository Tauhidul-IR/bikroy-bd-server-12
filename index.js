const express = require('express');
const cors = require('cors');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express();

//middleWare
app.use(cors());
app.use(express.json());






app.get('/', async (req, res) => {
    res.send('BikroyBD server Is Running')
})

app.listen(port, () => {
    console.log(`BikroyBD server running on port ${port}`)
})