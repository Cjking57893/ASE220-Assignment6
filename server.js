const { MongoClient } = require("mongodb");
const ObjectID = require("mongodb").ObjectId;
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const port = 3000;
const uri = "mongodb+srv://codyking04:xbsYjbT03CcLrgen@ase220.hct6otj.mongodb.net/?retryWrites=true&w=majority";
const saltRounds = 10;
const jwt_salt = "privatekey";
const jwt_expiration = 86400000;

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
    // Inserting document into JSONBlob collection and setting result to variable.
	let result = await insert(db,'Assignment6','JSONBlob',req.body);
    // Storing ID of inserted document into variable.
    let objectID = result.insertedId.toString();
    
    // Setting status code to 201, location header to documentID, and sending back json in response.
    res.statusCode = 201;
    res.setHeader("Location", objectID);
    res.json(req.body);
});

app.get("/api/jsonBlob/:id", async (req, res) => {
    try {
        // Requesting the JSONBlob document and setting to result variable.
        let result = await find(db, "Assignment6", "JSONBlob", {"_id": new ObjectID(req.params.id)});

        // Setting status code to 200 and sending back json in response.
        res.statusCode = 200;
        res.json(result);
    }
    catch {
        // Setting status code to 404 if document not found.
        res.statusCode = 404;
        res.end();
    }
});

app.put("/api/jsonBlob/:id", async (req, res) => {
    try {
        // Updating document in JSONBlob collection.
        await update(db, "Assignment6", "JSONBlob", {"_id": new ObjectID(req.params.id)}, {$set: req.body});

        // Setting status code to 200 and responding with updated json in response.
        res.statusCode = 200;
        res.json(req.body);
    }
    catch {
        // Setting status code to 404 if document not found.
        res.statusCode = 404;
        res.end();
    }
});

app.delete("/api/jsonBlob/:id", async (req, res) => {
    try {
        // Deleting document in JSONBlob collection.
        await remove(db, "Assignment6", "JSONBlob", {"_id": new ObjectID(req.params.id)});
        
        // Setting status code to 200 and ending response.
        res.statusCode = 200;
        res.end();
    }
    catch {
        // Setting status code to 404 if document not found.
        res.statusCode = 404;
        res.end();
    }
});

app.post("/api/auth/signup", async (req, res) => {
    // Checking if user already has an account.
    let result = await find(db, "Assignment6", "Users", {email: req.body.email});

    if (result.length > 0) {
        // Sending 406 status code and error message if user already has an account.
        res.status(406);
        res.json({message: "User already exists"});
    }
    else {
        // Hashing password.
        req.body.password = bcrypt.hashSync(req.body.password, saltRounds);
        
        // Inserting hashed password into Users collection.
        insert(db, "Assignment6", "Users", {email: req.body.email, password: req.body.password});

        // Sending 201 status code and success message.
        res.status(201);
        res.json("User created");
    }
});

app.post("/api/auth/signin", async (req, res) => {
    // Checking if user has an account.
    let result = await find(db, "Assignment6", "Users", {"email": req.body.email});

    if (result.length == 0) {
        res.status(406);
        res.json({message: "User is not registered"});
    }
    else {
        if (bcrypt.compareSync(req.body.password, result[0].password)) {
            let token = jwt.sign({id: req.body.email}, jwt_salt, {expiresIN: jwt_expiration});

            res.status(200);
            res.setHeader("Authorization", `Bearer ${token}`);
            res.json({message: "User authenticated"});
        }
        else {
            res.status(406);
            res.json({message: "Wrong password"});
        }
    }
});

app.get("/api/auth/signout", (req, res) => {

});

async function start(){
	db = await connect();
	console.log('mongoDB connected');
	app.listen(port,() => {
	  console.log(`App listening on port ${port}`);
	});
}

start();