const { MongoClient } = require("mongodb");
const ObjectID = require("mongodb").ObjectId;
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
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
app.use(cookieParser());

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

const setUserID = async function (req, res, next) {
    let result = await find(db, "Assignment6", "Users", {"jwt": req.cookies.token});
    let UserID = JSON.stringify(result[0]._id).replace(/"|'/g, '');

    req.body.UserID = UserID;

    next();
}

const verifyToken = function (req, res, next) {
    if (req.cookies.token == undefined) {
        res.statusCode = 403;
        res.json({message: "User is not logged in"});
    }
    else {
        next();
    }
}

const verifyUser = async function (req, res, next) {
    let result = await find(db, "Assignment6", "JSONBlob", {"_id": new ObjectID(req.params.id)});
    let UserID = await find(db, "Assignment6", "Users", {"jwt": req.cookies.token});
    UserID = JSON.stringify(UserID[0]._id).replace(/"|'/g, '');

    if (result.length == 0) {
        res.statusCode = 404;
        res.json({message: "Document does not exist"});
    }
    else if (UserID != result[0].UserID) {
        res.statusCode = 403;
        res.json({message: "User is not owner of document"});
    }
    else {
        next();
    }
}

app.post("/api/jsonBlob", verifyToken, setUserID, async (req, res) => {
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
    // Requesting the JSONBlob document and setting to result variable.
    let result = await find(db, "Assignment6", "JSONBlob", {"_id": new ObjectID(req.params.id)});

    if (result.length != 0) {
        // Setting status code to 200 and sending back json in response.
        res.statusCode = 200;
        res.json(result);
    }
    else {
        // Setting status code to 404 if document not found.
        res.statusCode = 404;
        res.json({message: "Document not found"});
    }
});

app.put("/api/jsonBlob/:id", verifyToken, verifyUser, async (req, res) => {
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
        res.json({message: "Document not found"});
    }
});

app.delete("/api/jsonBlob/:id", verifyToken, verifyUser, async (req, res) => {
    try {
        // Deleting document in JSONBlob collection.
        await remove(db, "Assignment6", "JSONBlob", {"_id": new ObjectID(req.params.id)});
        
        // Setting status code to 200 and ending response.
        res.statusCode = 200;
        res.json({message: "Document has been deleted"});
    }
    catch {
        // Setting status code to 404 if document not found.
        res.statusCode = 404;
        res.json({message: "Document not found"});
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
        res.json({message: "User created"});
    }
});

app.post("/api/auth/signin", async (req, res) => {
    // Checking if user has an account.
    let result = await find(db, "Assignment6", "Users", {"email": req.body.email});

    // Checking if any users are found.
    if (result.length == 0) {
        // Sending 406 status code and error message if not user is found.
        res.status(406);
        res.json({message: "User is not registered"});
    }
    else {
        // Comparing password to password hash stored in database.
        if (bcrypt.compareSync(req.body.password, result[0].password)) {
            // Generating JSON web token with user email.
            let token = jwt.sign({id: req.body.email}, jwt_salt, {expiresIn: jwt_expiration});
            // Getting UserID from the document ID of user in database.
            userID = result[0]._id.toString().replace('New ObjectId("','').replace('")','');

            // Updating user in database with JSON web token.
            await update(db, "Assignment6", "Users", {_id: new ObjectID(userID)}, {$set: {jwt: token}});

            // Sending 200 status code, setting token to cookie, and sending back success message.
            res.status(200);
            res.cookie("token", token, {
                maxAge: 1200000,
                httpOnly: true
            });
            res.json({message: "User authenticated"});
        }
        else {
            // Sending 406 status code and error message if wrong password.
            res.status(406);
            res.json({message: "Wrong password"});
        }
    }
});

app.post("/api/auth/signout", verifyToken, (req, res) => {
    res.clearCookie("token");
    res.json({message: "User has been signed out"});
});

async function start(){
	db = await connect();
	console.log('mongoDB connected');
	app.listen(port,() => {
	  console.log(`App listening on port ${port}`);
	});
}

start();