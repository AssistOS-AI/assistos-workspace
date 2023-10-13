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
        target.setPrompt(prompt);
        await target.setKey("../apihub-root/keys-secret.json");
        const result = await fetch(target.__url, target.getOptions());
        if (result.status !== 200) {
            console.log(`Response Status: ${result.status}`);
            console.log(`Response Text: ${await result.text()}`);
            throw new Error(await result.text());
        }
        const generatedText = JSON.parse(await result.text());
        return generatedText.choices[0].message.content;

    }
}
module.exports = openAIMixin;