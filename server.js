const { MongoClient } = require("mongodb");
const ObjectID = require("mongodb").ObjectId;
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 3000;
const uri = "mongodb+srv://codyking04:xbsYjbT03CcLrgen@ase220.hct6otj.mongodb.net/?retryWrites=true&w=majority";

const app = express();
const client = new MongoClient(uri);
app.use(bodyParser.json());
app.use(cors());

async function connect() {
    // Connecting to atlas database.
    let connection = await client.connect();
    return connection;
}

async function find(db, database, collection, criteria) {
    // Fetching database and setting it to dbo.
    let dbo = db.db(database);
    // Finding documents that match criteria from the collection and returning result as array.
    let result = await dbo.collection(collection).find(criteria).toArray();
    return result;
}

async function insert(db, database, collection, document) {
    // Fetching database and setting it to dbo.
    let dbo = db.db(database);
    // Inserting new document into collection and returning result.
    let result = await dbo.collection(collection).insertOne(document);
    console.log(result);
    return result;
}

async function update(db, database, collection, criteria, document) {
    //Fetching database and setting it to dbo.
    let dbo = db.db(database);
    // Updating document in collection and returningr result.
    let result = await dbo.collection(collection).updateOne(criteria, document);
    return result;
}

async function remove(db, database, collection, document) {
    // Fetching database and setting it to dbo.
    let dbo = db.db(database);

    // deleting a document then returning result.
    let result = await dbo.collection(collection).deleteOne(document);
    console.log(result);
}

app.post("/api/jsonBlob", async (req, res) => {
    // Inserting document into JSONBlob collection and responding with result of request.
	let result = await insert(db,'Assignment6','JSONBlob',req.body);
    let objectID = result.insertedId.toString();
    
    // Setting status code to 201, location header to documentID, and sending back json in response.
    res.statusCode = 201;
    res.setHeader("Location", objectID);
    res.json(req.body);
});

app.get("/post", async (req, res) => {
    // Requesting the JSONBlob collection and sending it back in the response.
    let result = await find(db, "Assignment6", "Posts", {});
    res.json(result);
});

app.put("/post/:id", async (req, res) => {
    // Updating document in JSONBlob collection and responding with result of request.
    let result = await update(db, "Assignment6", "JSONBlob", {"_id": new ObjectID(req.params.id)}, {$set: req.body});
    res.json(result);
});

app.delete("/post/:id", async (req, res) => {
    // Deleting document in JSONBlob collection and responding with result of request.
    let result = await remove(db, "Assignment6", "Posts", {"_id": new ObjectID(req.params.id)});
    res.json(result);
});

async function start(){
	db = await connect();
	console.log('mongoDB connected');
	app.listen(port,() => {
	  console.log(`App listening on port ${port}`);
	});
}

start();