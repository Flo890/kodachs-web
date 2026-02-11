var express = require('express');
var router = express.Router();
var secret = require('../secret');
var config = require('../config');
const { logPrompt, logResponse, logAiEvent } = require('../services/logging');

async function aiBotAnswer(userQuery, userId, cb){
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
                    "content": `${config.embeddingPromptBefore} ${userQuery} ${config.embeddingPromptAfter}`
                }],
                "files": config.ragResources})
        });
        let data = await reqResponse.json();
        console.log(data);
        logAiEvent(new Date(),userId,data);
        let resText = data.choices[0].message.content;

      cb(resText);
    }

/* GET home page. */
router.post('/', function(req, res, next) {
  console.log(req.body);

  let userId = req.body.userId;
  logPrompt(new Date(),userId,req.body.question);

  let aiAnswer = aiBotAnswer(req.body.question, userId, (aiAnswer)=> {
    if(aiAnswer){

      logResponse(new Date(),userId,aiAnswer);

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
