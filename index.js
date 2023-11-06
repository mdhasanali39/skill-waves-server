import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import { Collection, MongoClient, ServerApiVersion } from 'mongodb';

// create express instance 
const app = express()
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())

// mongodb database connect 


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@skillwavescluster.88ddzp7.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    // creating database and collection
    const jobsCollection = client.db("skillwavesDB").collection("jobs");

    // create job api
    app.post('/api/v1/job/create-job', async(req, res)=>{
        const job = req.body;
        const result = await jobsCollection.insertOne(job)
        res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// testing api 
app.get('/', (req, res)=>{
    res.send('skill waves server is running well')
})

app.listen(port, ()=>{
    console.log(`skill waves server is running on port: ${port}`);
})