const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config()
const admin = require("firebase-admin");
// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);


const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



// mongoDB

const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1ktlt9d.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//verification token function
const veryfyToken = async (req,res,next)=>{
   const autho =req.headers.authorization
if(!autho){
 return res.status(401).send({
      message:"unauthorized access.Token not found"
    })
}

   const token =autho.split(' ')[1]

   try{
    await admin.auth().verifyIdToken(token)
    next()

   }catch(error){
    res.status(401).send({
      message:"unauthorized access"
    })

   }

}

//token function end

async function run() {
  try {
    // await client.connect();
    const db = client.db("assignment-ten");
    const modelCollection = db.collection("product");
    const bookedCollection=db.collection("booked") 

    // find all

    app.get("/products", async (req, res) => {
      const result = await modelCollection.find().toArray();
      res.send(result);
    });

    //apply filter
app.get("/products", async (req, res) => {
  try {
    const { category } = req.query;

    const query = {};
    if (category && category.trim() !== "") {
      query.category = category;
    }

    const result = await modelCollection.find(query).toArray();

    res.status(200).json(result);
  } catch (error) {
    
  }
});




    //find single
    app.get("/products/:id",veryfyToken, async(req,res)=>{
      const {id}=req.params
      const result=await modelCollection.findOne({_id: new ObjectId(id)})
      
      
      res.send({
        success:true,
        result
      })
    })

    //find latest
    app.get("/latestProducts", async (req, res) => {
      const result = await modelCollection.find().sort({createdAt:"desc"}).limit(9).toArray();
      
      res.send(result);
      
    });


   

//find my products
app.get('/myProduct',veryfyToken, async(req,res)=>{
  const email=req.query.email
  const result= await modelCollection.find({userEmail:email}).toArray()

  res.send({
      success: true,
      data: result, 
    });

})
    //booked data
    app.post('/booked',async (req,res)=>{
      const data=req.body
      const result=await bookedCollection.insertOne(data)

      res.send({
        success:true,
        result
      })
    })

    // show Booking data
    app.get('/myBooked',veryfyToken, async(req,res)=>{
  const email=req.query.email
  const result= await bookedCollection.find({customerEmail:email}).toArray()

  res.send({
      success: true,
      data: result, 
    });

})



    //add product
    app.post('/products',veryfyToken,async (req,res)=>{
      const data=req.body
      const result=await modelCollection.insertOne(data)

      res.send({
        success:true,
        result
      })
    })


//update fetch
 app.get("/update/:id",veryfyToken, async(req,res)=>{
      const {id}=req.params
      const result=await modelCollection.findOne({_id: new ObjectId(id)})
      
      
      res.send({
        success:true,
        result
      })
    })








    //updated data

    app.put(`/update/:id`,async (req,res)=>{
      const {id}=req.params
      const data=req.body

   
      const objectId=new ObjectId(id)
      const filter={_id:objectId}
      const update={
        $set:data
      }
       const result= await modelCollection.updateOne(filter,update)

       res.send({
        success:true,
        result

       })
    
    
    })





    //delete
    app.delete("/products/:id", async(req,res)=>{
      const {id}=req.params
      const result=await modelCollection.deleteOne({_id: new ObjectId(id)})
      
      
      res.send({
        success:true,
        result
      })
    })

      





    // await client.db("admin").command({ ping: 1 });
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
  res.send("server is ruuning");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
