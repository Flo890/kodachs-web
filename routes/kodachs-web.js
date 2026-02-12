var express = require('express');
var router = express.Router();
var secret = require('../secret');
var config = require('../config');
const { logPrompt, logResponse, logAiEvent } = require('../services/logging');

// stores the message history of each user's conversation (over system runtime only)
const messageHistoryDict = {}

// sample data to illustrate the format:
//{"Flo":
//  [{"who":"chatbot","what":"Hello","who":"user"},{"what":"How are you"}]
//}

function buildMessageHistory(userId){
  if (!messageHistoryDict[userId]){
    console.log(`no message history found for user ${userId}`)
    return ""
  }
  
  console.log(`Merging message history of user ${userId}`)
 
  let messageHistoryTexts = messageHistoryDict[userId].map(obj => {
    return `### ${obj.who}: ### ${obj.what} ###, `
  })
  let res = messageHistoryTexts.reduce((a,b) => a+b,"### This is the message history of this conversation: ###")
  console.log(res)
  return res;
}

function addToMessageHistory(userId,text,who){
  if (!messageHistoryDict[userId]){
    messageHistoryDict[userId] = []
  }

  messageHistoryDict[userId].push({"who":who,"what":text})
}

function executeMagicSpells(query,userId){
  if (query == "obliviate") {
    // clear message history of this user
    messageHistoryDict[userId] = []
    return "Vergessenszauber ausgeführt! Ich weiß von nichts mehr."
  }
  return undefined;
}

async function aiBotAnswer(userQuery, userId, cb){

  try {
    let messageHistory = buildMessageHistory(userId);
    addToMessageHistory(userId,userQuery,"user")

          let reqResponse = await fetch("https://ai-openwebui.gesis.org/api/chat/completions",{
              method: "POST",
              headers: {
                  "Content-Type":"application/json",
                  "Authorization":`Bearer ${secret.gesisApiKey}`
              },
              // TODO outsource the below embedding prompt to some file
              body: JSON.stringify({
                  "model": "gpt-5-mini",
                  "messages": [{
                      "role": "user",
                      "content": `${config.embeddingPromptBefore} ${userQuery} ${config.embeddingPromptAfter} ${messageHistory}`
                  }],
                  "files": config.ragResources})
          });
          let data = await reqResponse.json();
          console.log(data);
          logAiEvent(new Date(),userId,data);
          let resText = data.choices[0].message.content;

        cb(resText);
      } catch(e){
        console.error(e);
        cb("Oups, jetzt hatte ich ein Problem. Was war nochmal deine Frage?")
      }
    }

/* GET home page. */
router.post('/', function(req, res, next) {
  console.log(req.body);

  let userId = req.body.userId;
  logPrompt(new Date(),userId,req.body.question);

  let magicRes = executeMagicSpells(req.body.question,userId);
  if (magicRes){
    logResponse(new Date(),userId,magicRes);
     
      res.json({
        success:true,
        answer: magicRes
      });
  }
  
  let aiAnswer = aiBotAnswer(req.body.question, userId, (aiAnswer)=> {
    if(aiAnswer){

      logResponse(new Date(),userId,aiAnswer);
      addToMessageHistory(userId,aiAnswer,"chatbot")

      res.json({
        success:true,
        answer: aiAnswer
      });
    }
    else {
      // TODO behavior e.g. if we meet the rate limits should be improved
      res.json({
        success:false,
        answer: "Sorry, there was an issue trying to answer your question."
      })
    }
  });



  
});

module.exports = router;
