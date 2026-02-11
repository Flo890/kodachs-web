const { MongoClient } = require('mongodb');


// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'kodachs-logging';


client.connect();
console.log('Connected successfully to MongoDB server');
const db = client.db(dbName);
let collection_conversations = db.collection('conversations');
let collection_apievents = db.collection('apievents');


async function logPrompt(timestamp,userId,text){
    const insertResult = await collection_conversations.insertMany([{ type: "prompt", timestamp: timestamp, userId: userId, text: text }]);
    console.log('Inserted documents =>', insertResult);
}

async function logResponse(timestamp,userId,text){
    const insertResult = await collection_conversations.insertMany([{ type: "response", timestamp: timestamp, userId: userId, text: text }]);
    console.log('Inserted documents =>', insertResult);
}

async function logAiEvent(timestamp,userId,json){
    const insertResult = await collection_apievents.insertMany([{ timestamp: timestamp, userId: userId, json: json }]);
    console.log('Inserted documents =>', insertResult);
}


module.exports = {
    logPrompt: logPrompt,
    logResponse: logResponse,
    logAiEvent: logAiEvent
}