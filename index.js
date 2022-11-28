const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

const app = express();

//middleWare
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nfiuyyd.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



//JWT middleWare
function verifyJWT(req, res, next) {
    // console.log()
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access.')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}



async function run() {
    try {
        const categoryCollection = client.db('bikroyBD').collection('category');
        const allproductCollection = client.db('bikroyBD').collection('allproducts');
        const phoneBookingCollections = client.db('bikroyBD').collection('bookingPhones');
        const userCollections = client.db('bikroyBD').collection('users');
        const paymentCollections = client.db('bikroyBD').collection('payments');
        const reportsCollections = client.db('bikroyBD').collection('reports');


        const verifyAdmin = async (req, res, next) => {
            // console.log(req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail }
            const user = await userCollections.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }
        // const verifySeller = async (req, res, next) => {
        //     // console.log(req.decoded.email);
        //     const decodedEmail = req.decoded.email;
        //     const query = { email: decodedEmail }
        //     const user = await userCollections.findOne(query)
        //     if (user?.userType !== 'Seller') {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }
        //     next();
        // }


        //For Home page category 
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

        //For Query use category name
        app.get('/allCategoryProducts', async (req, res) => {
            // console.log(req.query)
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


        //Booking part get and post
        app.post('/phoneBookings', async (req, res) => {
            phoneBookings = req.body
            // console.log(phoneBookings);
            const result = await phoneBookingCollections.insertOne(phoneBookings)
            res.send(result)
        })
        app.get('/phoneBookings', async (req, res) => {
            const email = req.query.email
            // console.log(req.headers.authorization);
            // const decodedEmail = req.decoded.email
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden' })
            // }
            const query = { email: email }
            const phoneBooking = await phoneBookingCollections.find(query).toArray();
            res.send(phoneBooking);
        })
        // app.get('/phoneBookings', verifyJWT, async (req, res) => {
        //     const email = req.query.email
        //     // console.log(req.headers.authorization);
        //     const decodedEmail = req.decoded.email
        //     if (email !== decodedEmail) {
        //         return res.status(403).send({ message: 'forbidden' })
        //     }
        //     const query = { email: email }
        //     const phoneBooking = await phoneBookingCollections.find(query).toArray();
        //     res.send(phoneBooking);
        // })



        //User information 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollections.insertOne(user)
            res.send(result);

        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollections.find(query).toArray();
            res.send(users)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollections.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10h' })
                return res.send({ accessToken: token })
            }
            console.log(user)
            res.status(403).send({ accessToken: '' })
        })

        //admin user
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatedDoc = {
                $set: {
                    userType: 'Seller'
                }
            }
            const result = await userCollections.updateOne(filter, updatedDoc, option);
            res.send(result);
        })


        //admin user check
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollections.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })


        //Seller 
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollections.findOne(query)
            res.send({ isSeller: user?.userType === 'Seller' })
        })


        //add a product
        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            const result = await allproductCollection.insertOne(product);
            res.send(result);
        })
        //Show a product
        app.get('/showAddProduct', async (req, res) => {
            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }

            const cursor = allproductCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        })

        //delete product
        app.delete('/showAddProduct/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await allproductCollection.deleteOne(filter);
            res.send(result);
        })





        //Show all seller
        app.get('/sellers', async (req, res) => {
            console.log(req.query.userType);
            let query = {}
            if (req.query.userType) {
                query = {
                    userType: req.query.userType
                }
            }

            const cursor = userCollections.find(query);
            const product = await cursor.toArray();
            res.send(product);
        })


        //Show all Buyer
        app.get('/buyers', async (req, res) => {
            let query = {}
            const cursor = userCollections.find(query);
            const product = await cursor.toArray();
            res.send(product);
        })



        //delete user
        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await userCollections.deleteOne(filter);
            res.send(result);
        })


        //payment part
        app.get('/phoneBookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const bookings = await phoneBookingCollections.findOne(query)
            res.send(bookings)
        })


        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body
            const price = booking.price
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        //payment data store api
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollections.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await phoneBookingCollections.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.get('/phoneBookings', async (req, res) => {
            const name = req.query.name
            // }
            const query = { name: name }
            const phoneBooking = await phoneBookingCollections.find(query).toArray();
            res.send(phoneBooking);
        })

        //Report part
        app.post('/reportAdmin', async (req, res) => {
            const product = req.body;
            const result = await reportsCollections.insertOne(product);
            res.send(result);
        })

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await allproductCollection.findOne(query);
            res.send(service)
        })

        app.get('/report', async (req, res) => {
            const query = {};
            const reportedItem = await reportsCollections.find(query).toArray();
            res.send(reportedItem)
        })

        //delete reported product
        app.delete('/deleteReportItem/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await allproductCollection.deleteOne(filter);
            res.send(result);
        })

        //delete reported product
        app.delete('/deleteReport/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await reportsCollections.deleteOne(filter);
            res.send(result);
        })
        //Report part end


        //Advertising part
        app.put('/advertise/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true };
            const updatedDoc = {
                $set: {
                    productStatus: 'advertised'
                }
            }
            const result = await allproductCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        })

        app.get('/advertisedProduct', async (req, res) => {
            let query = {}
            if (req.query.productStatus) {
                query = {
                    productStatus: req.query.productStatus
                }
            }

            const cursor = allproductCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
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