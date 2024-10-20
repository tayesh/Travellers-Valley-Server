const express = require('express')
const cors = require('cors')
require('dotenv').config();
const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
const app = express()

const port = process.env.port || 5002


app.use(cors());
app.use(express.json())





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.1xhb2as.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const roomCollection = client.db('Travellers_Valley').collection('Rooms');
    const ReviewCollection = client.db('Travellers_Valley').collection('UserReviews');
    const BookingCollection = client.db('Travellers_Valley').collection('Bookings');
    const UserCollection = client.db('Travellers_Valley').collection('userRoll');


    app.get('/rooms', async (req, res) => {
      const { maxPrice } = req.query;

      try {
        let query = {};
        if (maxPrice) {
          query = { PricePerNight: { $lte: parseInt(maxPrice) } };
        }
        if (Object.keys(req.query).length === 0) {
          // No query parameters, return all objects
          const rooms = await roomCollection.find().toArray();
          res.json(rooms);
        } else {
          // Filter rooms based on query parameters
          const rooms = await roomCollection.find(query).toArray();
          res.json(rooms);
        }
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;

      // console.log('cookies : ',req.cookies);
      const query = { _id: new ObjectId(id) };
      const room = await roomCollection.findOne(query);
      res.send(room)
    })
    app.put("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;

      if (body.delete) {
        const filter = { _id: new ObjectId(id) };
        const update = {
          $pull: { AvailableDates: body.newDate }
        };
        const result = await roomCollection.updateOne(filter, update);
        res.send(result);

      }
      // console.log(newDate);
      const filter = { _id: new ObjectId(id) };
      const update = {
        $push: { AvailableDates: body.newDate }
      };
      const result = await roomCollection.updateOne(filter, update);
      res.send(result);

    })

    app.post("/bookings", async (req, res) => {
      const newBooking = req.body;
      // console.log(newPaintings);
      const result = await BookingCollection.insertOne(newBooking);
      res.send(result);

    })
    app.get("/bookings", async (req, res) => {
      const { roomId, userId } = req.query;

      // Validate that roomId and userId are provided
      if (!roomId || !userId) {
        const bookings = await BookingCollection.find().toArray();
        return res.send(bookings);
      }
      else if (!roomId && userId) {
        const filter = {
          userId: userId
        };
        const bookings = await BookingCollection.find(filter).toArray();
        return res.send(bookings);
      }

      // Construct the filter using roomId and userId
      const filter = {
        roomId: roomId,
        userId: userId
      };

      try {
        // Find all bookings based on roomId and userId
        const bookings = await BookingCollection.find(filter).toArray();

        // If no bookings are found, return a 404 response
        if (bookings.length === 0) {
          return res.status(404).send({ message: "No bookings found" });
        }

        // Return the found bookings
        res.status(200).send(bookings);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred while retrieving the bookings" });
      }
    });
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await BookingCollection.deleteOne(query)
      res.send(result);
      console.log(id);
    })
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = await jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true });
    })
    app.post('/logOut', async (req, res) => {
      const user = req.body;
      //  console.log("logging out user : ",user?.email);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })
    //  reviews
    app.post("/reviews", async (req, res) => {
      const newReview = req.body;

      const result = await ReviewCollection.insertOne(newReview);
      res.send(result);


    })
    app.get('/reviews/:roomId', async (req, res) => {
      const roomId = req.params.roomId;
      const cursor = ReviewCollection.find();
      const result = await cursor.toArray();
      const filteredResult = result.filter(item => item.roomId === roomId);

      res.send(filteredResult);

    })
    app.get("/userRoll", async (req, res) => {
      const newBooking = req.body;
      // console.log(newPaintings);
      const result = await UserCollection.find().toArray();;
      res.send(result);

    })
    app.get("/b", async (req, res) => {
      const newBooking = req.body;
      // console.log(newPaintings);
      const result = await BookingCollection.find().toArray();;
      res.send(result);

    })
    app.post("/b/:id", async (req, res) => {
      const { id } = req.params;
      const result = await BookingCollection.findOneAndUpdate(
        { _id: new ObjectId(id) }, // Match the document by _id
        { $set: { ispending: false } }, // Set ispending to false
        { returnOriginal: false } // Return the updated document
    );
      res.send(result);

    })



    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6bnVsbCwiaWF0IjoxNzE1ODg2MzUyLCJleHAiOjE3MTU4ODk5NTJ9.mn8ov-JQCaMwo1ialDzhRY7li3LdEYzGqovw9UIAlcg