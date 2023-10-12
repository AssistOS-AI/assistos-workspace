const fsPromises = require('fs').promises;
function sendResponse(response,statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}
function createOptions(settings, key){
    function setIntelligence(intelligence){
       if((intelligence >=1) && (intelligence<=3)) {
           return "gpt-3.5-turbo";
       }
       if((intelligence >=3) && (intelligence<=7)){
           return "gpt-3.5-turbo";
       }
       if((intelligence >=7) && (intelligence<=10)){
           return "gpt-3.5-turbo";
       }
       console.error("invalid intelligence value")
    }
    function setMessages(prompt){
        let message = {role:"user",content:prompt};
        return [message];
    }
    function setCreativity(creativity){
        return (creativity/10)*2;
    }
    let method = "POST";
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
    };
    let body = {
        model: setIntelligence(settings.intelligence),
        messages: setMessages(settings.prompt),
        temperature: setCreativity(settings.creativity)
    }
    return {method:method, headers:headers, body:JSON.stringify(body)};
}
async function generateResponse(request, response) {

    let settings = JSON.parse(request.body.toString());
    let url = "https://api.openai.com/v1/chat/completions";
    let string = await fsPromises.readFile("../apihub-root/keys-secret.json", { encoding: 'utf8' });
    let keys = JSON.parse(string);
    let key = keys.keys[0];

    let options = createOptions(settings, key);
    try {
        const result = await fetch(url, options);
        if (result.status !== 200) {
            console.log(`Response Status: ${result.status}`);
            console.log(`Response Text: ${await result.text()}`);
            sendResponse(response, result.status, "text/html", await result.text());
        }
        const generatedText = JSON.parse(await result.text());
        sendResponse(response, 200, "text/html", generatedText.choices[0].message.content);
    } catch (error) {
        console.log('API call failed:', error);
    }

}
module.exports = {
    generateResponse,
}