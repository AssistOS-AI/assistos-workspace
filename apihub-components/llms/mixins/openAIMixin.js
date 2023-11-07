const fsPromises = require('fs').promises;
function openAIMixin(target){
    target.setTemperature = function(level){
        target.__body.temperature = level;
    }
    target.getOptions = function(){
        return {
            method:"POST",
            headers:{
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${target.key}`
            },
            body:JSON.stringify(target.__body)
        }
    }
    target.setPrompt = function(prompt){
        target.addMessage({role:"user", content:prompt});
    }
    target.setVariants = function (number){
        target.__body.n = number;
    }
    target.setMaxTokens = function (number){
        if(typeof number === "string" || typeof number === "undefined"){
            target.__body.max_tokens = null;
        }else {
            target.__body.max_tokens = number;
        }
    }
    target.setKey = async function(path){
        let secret = await fsPromises.readFile(path, { encoding: 'utf8' });
        secret = JSON.parse(secret);
        target.key = secret.keys["openAI"];
    }
    target.addMessage = function(message){
        target.__body.messages.push(message);
    }
    target.callLLM = async function(settings){
        target.setPrompt(settings.prompt);
        target.setVariants(settings.variants);
        target.setMaxTokens(settings.max_tokens);
        if(settings.history){
            let user = true;
           for(let reply of settings.history){
               if(user){
                   target.addMessage({role: "user", content: reply});
                   user = false;
               }else {
                   target.addMessage({role: "assistant", content: reply});
                   user = true;
               }
           }
        }
        await target.setKey("../apihub-root/keys-secret.json");
        const result = await fetch(target.__url, target.getOptions());
        if (result.status !== 200) {
            console.log(`Response Status: ${result.status}`);
            console.log(`Response Text: ${await result.text()}`);
            throw new Error(await result.text());
        }
        const generatedMessages = JSON.parse(await result.text()).choices;
        if(this.__body.n >1){
            let response = [];
            for(let item of generatedMessages){
                response.push(item.message.content);
            }
            return JSON.stringify(response);
        }else {
            return generatedMessages[0].message.content;
        }
    }
}
module.exports = openAIMixin;