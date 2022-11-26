const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express();

//middleWare
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nfiuyyd.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoryCollection = client.db('bikroyBD').collection('category');
        const allproductCollection = client.db('bikroyBD').collection('allproducts');
        const phoneBookingCollections = client.db('bikroyBD').collection('bookingPhones');
        // const doctorsCollections = client.db('doctorPortal').collection('doctors');
        // const paymentsCollection = client.db('doctorsPortal').collection('payments');



        app.get('/category', async (req, res) => {
            const query = {};
            const category = await categoryCollection.find(query).toArray();
            res.send(category)
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await categoryCollection.findOne(query);
            res.send(service)
        })


        app.get('/allCategoryProducts', async (req, res) => {
            console.log(req.query)
            let query = {}
            if (req.query.categoryName) {
                query = {
                    categoryName: req.query.categoryName
                }
            }

            const cursor = allproductCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        })

        app.post('/phoneBookings', async (req, res) => {
            phoneBookings = req.body
            console.log(phoneBookings);
            const result = await phoneBookingCollections.insertOne(phoneBookings)
            res.send(result)
        })


    }



    finally { }
}
run();



app.get('/', async (req, res) => {
    res.send('BikroyBD server Is Running')
})

app.listen(port, () => {
    console.log(`BikroyBD server running on port ${port}`)
})