import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { Collection, MongoClient, ObjectId, ServerApiVersion } from "mongodb";

// create express instance
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://skill-waves-web-app.firebaseapp.com", "https://skill-waves-web-app.web.app"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
// custom middleware
const tokenVerify = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ status: "Unauthorized access" });
  }
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ status: "Unauthorized access" });
    } else {
      req.user = decoded;
      next();
    }
  });
};

// mongodb database connect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@skillwavescluster.88ddzp7.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();
    // creating database and collection
    const jobsCollection = client.db("skillwavesDB").collection("jobs");
    const bidJobsCollection = client.db("skillwavesDB").collection("bidjobs");

    // get method
    // get single job data
    app.get("/api/v1/job/:id", tokenVerify, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // get jobs data by category 
    app.get("/api/v1/jobs", async (req, res)=>{
      
      const category = req.query.category;
      const query = {};
      if(category){
        query.category = category
      }
      // const query = {category: category}
      const result = await jobsCollection.find(query).toArray();
      res.send(result)
    })

    // get all posted jobs data - user specific
    app.get("/api/v1/jobs/posted-jobs", tokenVerify, async (req, res) => {
      const userEmail = req.query["user-email"];
      const tokenEmail = req.user?.email;
      // console.log('category', category);
      // console.log('user email', userEmail);
      const query = {};

      if (tokenEmail !== userEmail) {
        return res.status(403).send({ status: "Forbidden access" });
      }

      if (userEmail) {
        query.employer_email = userEmail;
      }
      // if(userEmail){
      //   if()
      // }
      // const query = {category: category}
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    // get bids data - email specified
    app.get("/api/v1/bid/all", tokenVerify, async (req, res) => {
      try {
        const userEmail = req.query["user-email"];
        const employerEmail = req.query["employer-email"];
        const query = {};
        if (userEmail) {
          query.employee_email = userEmail;
        }
        if (employerEmail) {
          query.job_owner_email = employerEmail;
        }

        const result = await bidJobsCollection
          .find(query).toArray();
        res.send(result);
      } catch (error) {console.log(error)}
    });
    // post method
    // create job api
    app.post("/api/v1/job/create-job", async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });
    // bid job api
    app.post("/api/v1/job/bid-job", async (req, res) => {
      const bidJob = req.body;
      const result = await bidJobsCollection.insertOne(bidJob);
      res.send(result);
    });

    // access token
    app.post("/api/v1/user/access-token", (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.SECRET, {
        expiresIn: "1h",
      });

      const expirationDate = new Date(); // Create a new Date object
      expirationDate.setDate(expirationDate.getDate() + 1);

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: expirationDate,
        })
        .send({ status: true });
    });

    // put and patch method
    // update job - id specific
    app.put("/api/v1/job/update-job/:id", async (req, res) => {
      const id = req.params.id;
      const job = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };
      const updatedJobData = {
        $set: {
          employer_email: job.employer_email,
          job_title: job.job_title,
          job_deadline: job.job_deadline,
          category: job.category,
          min_price: job.min_price,
          max_price: job.max_price,
          description: job.description,
        },
      };
      const result = await jobsCollection.updateOne(
        filter,
        updatedJobData,
        options
      );
      res.send(result);
    });

    // patch - update/change a specific filed in bidJobsCollection
    app.patch("/api/v1/bid/update-specific/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedData = {
        $set: {
          status: status.status,
        },
      };
      const result = await bidJobsCollection.updateOne(filter, updatedData);
      res.send(result);
    });

    // delete method

    // delete job
    app.delete("/api/v1/job/delete-job/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });
    // delete token 
    app.post("/api/v1/user/delete-token", (req, res) => {
      res
        .clearCookie("token", { maxAge: 0, secure: true, sameSite: "none" })
        .send({ status: true });
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

// testing api
app.get("/", (req, res) => {
  res.send("skill waves server is running well");
});

app.listen(port, () => {
  console.log(`skill waves server is running on port: ${port}`);
});
