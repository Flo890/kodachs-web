var express = require('express');
var router = express.Router();
var secret = require('./secret');
var config = require('./config');

async function aiBotAnswer(text,cb){
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
                    "content": `You are a tutor that assists students with the KODAQS Data Quality Academy. The given files are the slides of the course. Please answer the following student question in no more than 5 sentences: ${text}`
                }],
                "files": config.ragResources})
        });
        let data = await reqResponse.json();
        console.log(data);
        let resText = data.choices[0].message.content;

      cb(resText);
    }

/* GET home page. */
router.post('/', function(req, res, next) {
  console.log(req.body);
  let aiAnswer = aiBotAnswer(req.body.question, (aiAnswer)=> {
    if(aiAnswer){
        res.json({
          success:true,
          answer: aiAnswer
        });
      }
      else {
        res.json({
          success:false,
          answer: "Sorry, there was an issue trying to answer your question."
        })
      }
  });

  
});

module.exports = router;
