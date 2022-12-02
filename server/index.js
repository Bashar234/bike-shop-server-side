const express = require("express");
const cors = require("cors");
const verifyJwt = require("./jwt");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// middle wares
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.slzksne.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//router function

const userCollection = client.db("Freez").collection("user");
const productCollection = client.db("Freez").collection("product");
const orderCollection = client.db("Freez").collection("orders");
const paymentsCollection = client.db("Freez").collection("payment");
const categoryCollection = client.db("Freez").collection("category");

//check api
app.get("/", (req, res) => {
  res.status(200).send("Server is running!");
});
app.post("/register", async (req, res) => {
  try {
    const user = req.body;
    // console.log(user);
    const loginUser = await userCollection.findOne({
      email: user.email,
    });
    if (!loginUser) {
      await userCollection.insertOne(user);
      const findNewUser = await userCollection.findOne({
        email: user.email,
      });
      const payload = {
        user: {
          email: user.email,
        },
      };
      const token = jwt.sign(payload, process.env.JWT_SECRETE, {
        expiresIn: "1d",
      });
      res.status(200).send({
        msg: "Registration Successfully",
        token: token,
        user: findNewUser,
      });
      // console.log(result);
    } else {
      const payload = {
        user: {
          email: user.email,
        },
      };
      const token = jwt.sign(payload, process.env.JWT_SECRETE, {
        expiresIn: "1d",
      });
      res.status(200).send({
        msg: "Registration Successfully",
        token: token,
        user: loginUser,
      });
    }
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
app.post("/login", async (req, res) => {
  try {
    const user = req.body;
    // console.log(user);
    const loginUser = await userCollection.findOne({
      email: user.email,
    });
    const payload = {
      user: {
        email: user.email,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRETE, {
      expiresIn: "1d",
    });
    res.status(200).send({
      msg: `Login by ${loginUser.name}`,
      token: token,
      user: loginUser,
    });
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
//category
app.post("/category", async (req, res) => {
  try {
    const category = req.body;
    const existCategory = await categoryCollection.findOne({
      category: category.category,
    });
    if (existCategory) {
      res.status(200).send({ error: "Already have a Category" });
    } else {
      await categoryCollection.insertOne(category);
      res.status(200).send({
        msg: "Category Added",
      });
    }
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
app.get("/category", async (req, res) => {
  try {
    const catagortList = await categoryCollection.find({}).toArray();
    res.status(200).send({ category: catagortList });
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
app.post("/product", async (req, res) => {
  const product = req.body;
  await productCollection.insertOne(product);
  res.status(200).send({ msg: "Product Added" });
});
app.get("/all-product", async (req, res) => {
  const allProduct = await productCollection.find({}).toArray();
  res.status(200).send({ product: allProduct });
});
app.get("/category/:id", async (req, res) => {
  const id = req.params.id;

  const category = await categoryCollection.findOne({
    _id: ObjectId(id),
  });

  const allProduct = await productCollection
    .find({ category: category.category })
    .toArray();
  res.status(200).send({ product: allProduct });
});
//all buyer
app.get("/all-buyer", async (req, res) => {
  const allBuyer = await userCollection
    .find({
      rol: "buyer",
    })
    .toArray();
  res.status(200).send({ buyer: allBuyer });
});
//buyer delete
app.delete("/all-buyer/:id", async (req, res) => {
  const id = req.params.id;
  await userCollection.deleteOne({
    _id: ObjectId(id),
  });
  res.status(200).send({ msg: "Deleted" });
});
//all seller
app.get("/all-seller", verifyJwt, async (req, res) => {
  const allSeller = await userCollection
    .find({
      rol: "seller",
    })
    .toArray();
  res.status(200).send({ seller: allSeller });
});
//seller delete
app.delete("/all-seller/:id", async (req, res) => {
  const id = req.params.id;
  await userCollection.deleteOne({
    _id: ObjectId(id),
  });
  res.status(200).send({ msg: "Deleted" });
});
//seller verified
app.patch("/all-seller/:id", async (req, res) => {
  const id = req.params.id;
  const isVerify = req.body.isVerify;
  const query = { _id: ObjectId(id) };
  const query1 = { userId: id };

  const updatedUser = {
    $set: {
      verified: isVerify,
    },
  };
  await userCollection.updateOne(query, updatedUser);
  await productCollection.updateMany(query1, updatedUser);
  res.status(200).send({ msg: isVerify });
});
//ads run
app.patch("/seller/ads/:id", async (req, res) => {
  const id = req.params.id;
  const ads = req.body.ads;
  // console.log(ads);
  const query = { _id: ObjectId(id) };
  const updatedUser = {
    $set: {
      ads: ads,
    },
  };
  await productCollection.updateOne(query, updatedUser);
  res.status(200).send({ msg: ads });
});
app.patch("/user/report/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const updatedUser = {
    $set: {
      reported: true,
    },
  };
  await productCollection.updateOne(query, updatedUser);
  res.status(200).send({ msg: "Reported Item" });
});

app.delete("/category/:id", async (req, res) => {
  const id = req.params.id;
  const category = await categoryCollection.findOne({
    _id: ObjectId(id),
  });
  await productCollection.deleteMany({ category: category.category });
  await orderCollection.deleteMany({
    productCategpry: category.category,
  });
  await categoryCollection.deleteOne({
    _id: ObjectId(id),
  });

  res.status(200).send({ msg: "deleted category" });
});
app.get("/product/:id", async (req, res) => {
  const id = req.params.id;
  const myProduct = await productCollection
    .find({
      userId: id,
    })
    .toArray();
  res.status(200).send({ product: myProduct });
});
app.delete("/product/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await productCollection.deleteOne({
      _id: ObjectId(id),
    });
    await orderCollection.deleteOne({
      ProductId: id,
    });
    res.status(200).send({ msg: "Deleted" });
  } catch (err) {
    res.status(400).send({ error: err.massage });
  }
});
app.post("/order", async (req, res) => {
  const order = req.body;
  await orderCollection.insertOne(order);
  res.status(200).send({ msg: "Added! Go to Dashboard and pay fast" });
});
//my order
app.get("/all-order", async (req, res) => {
  const allOrder = await orderCollection.find({}).toArray();
  res.status(200).send({ order: allOrder });
});
//single order
app.get("/single/order/:id", async (req, res) => {
  const id = req.params.id;
  const singleOrder = await orderCollection.findOne({
    _id: ObjectId(id),
  });
  res.status(200).send({ order: singleOrder });
});
app.get("/self-order/:id", verifyJwt, async (req, res) => {
  const id = req.params.id;
  const myOrder = await orderCollection
    .find({
      buyerId: id,
    })
    .toArray();
  res.status(200).send({ myOrder: myOrder });
});
app.delete("/self-order/:id", async (req, res) => {
  const id = req.params.id;
  await orderCollection.deleteOne({
    buyerId: id,
  });
  res.status(200).send({ msg: "Deleted" });
});

//payment
app.post("/create-payment-intent", async (req, res) => {
  const price = req.body.soldPrice;
  const amount = parseInt(price) * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    currency: "usd",
    amount: amount,
    payment_method_types: ["card"],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
app.post("/api/payments", async (req, res) => {
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment);
  const id = payment.ProductId;
  const query = { _id: ObjectId(id) };
  const query1 = { ProductId: id };
  const updatedDoc = {
    $set: {
      payment: true,
      transactionId: payment.transactionId,
    },
  };
  await productCollection.updateOne(query, updatedDoc);
  await orderCollection.updateOne(query1, updatedDoc);
  res.send({ msg: "Payment successfuly" });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
