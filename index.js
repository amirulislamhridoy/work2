const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
var cors = require("cors");
require("dotenv").config();
var jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.hq4lv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if(!authHeader){
    return res.status(401).status({message: "Unauthorized"})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.key , function(err, decoded) {
    if(err){
      return res.status(403).status({message: "forbidden"})
    }
    if(decoded){
      req.decoded = decoded
      next()
    }
  });
}

async function run() {
  await client.connect();
  const partsCollection = client.db("manufacture").collection("parts");
  const userCollection = client.db("manufacture").collection("users");
  const orderCollection = client.db("manufacture").collection("orders");
  const reviewCollection = client.db("manufacture").collection("reviews");

  app.get('/token',(req, res) => {
    const email = req.query.email
    var token = jwt.sign({ email: email }, process.env.key, {expiresIn: "1d"});
    res.send({token})
  })

  app.get("/parts", async (req, res) => {
    const result = await partsCollection.find().toArray();
    res.send(result);
  });
  app.get("/parts/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    const email = req.query.email
    const decoded = req.decoded
    if(decoded.email === email) {
      const query = { _id: ObjectId(id) };
      const result = await partsCollection.findOne(query);
      return res.send(result);
    }
    res.status(403).send({message: 'forbidden'})
  });
  app.post("/parts", async (req, res) => {
    const parts = req.body;
    const result = await partsCollection.insertOne(parts);
    res.send(result);
  });
  app.delete("/parts/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await partsCollection.deleteOne(query);
    res.send(result);
  });

  app.put("/user", async (req, res) => {
    const email = req.query.email;
    const body = req.body;
    // if(email) {
      // console.log(email)
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: body,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    // }
  });
  app.get("/admin/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const result = await userCollection.findOne(query);
    const isAdmin = result?.role === "admin";
    res.send({ admin: isAdmin });

    // if(result.role === 'admin'){
    //   res.send({ok: true})
    // }
    // res.send({no: false})
  });
  app.get("/user", verifyToken, async (req, res) => {
    const query = {};
    const email = req.query.email
    console.log(email)
    const decoded = req.decoded
    if(decoded.email === email){
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      return res.send(result);
    }
    res.status(403).send({message: 'forbidden'})
  });
  app.put("/user/:id", async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { _id: ObjectId(id) };
    const updateDoc = {
      $set: {
        role: "admin",
      },
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
  });
// hello
  app.post("/order", async (req, res) => {
    const data = req.body;
    const result = await orderCollection.insertOne(data);
    res.send(result);
  });
  app.get("/order", async (req, res) => {
    const email = req.query.email;
    console.log(email)
      const result = await orderCollection.find({ email }).toArray();
      res.send(result);
  });
  // all order get
  app.get('/orders', async (req, res) => {
    const result = await orderCollection.find().toArray()
    res.send(result)
  })
  app.delete("/order/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await orderCollection.deleteOne(query);
    res.send(result);
  });
// add
  app.post('/review', async (req, res) => {
    const data = req.body
    const result = await reviewCollection.insertOne(data)
    res.send(result)
  })
  app.get('/review', async (req, res) => {
    const query = {}
    const cursor = reviewCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
  })
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//hello