const fsPromises = require('fs').promises;
function openAIMixin(target){
    target.setTemperature = function(level){
        target.__temperature = level;
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
    target.setKey = async function(path){
        let secret = await fsPromises.readFile(path, { encoding: 'utf8' });
        secret = JSON.parse(secret);
        target.key = secret.keys["openAI"];
    }
    target.addMessage = function(message){
        target.__messages.push(message);
    }
    target.callLLM = async function(prompt){
        try {
            target.setPrompt(prompt);
            await target.setKey("../apihub-root/keys-secret.json");
            const result = await fetch(target.__url, target.getOptions());
            if (result.status !== 200) {
                console.log(`Response Status: ${result.status}`);
                console.log(`Response Text: ${await result.text()}`);
                target.sendResponse(target.response, result.status, "text/html", await result.text());
            }
            const generatedText = JSON.parse(await result.text());
            target.sendResponse(target.response, 200, "text/html", generatedText.choices[0].message.content);
        } catch (error) {
            console.log('API call failed:', error);
        }
    }
    target.sendResponse = function(response,statusCode, contentType, message){
        response.statusCode = statusCode;
        response.setHeader("Content-Type", contentType);
        response.write(message);
        response.end();
    }
}
module.exports = openAIMixin;