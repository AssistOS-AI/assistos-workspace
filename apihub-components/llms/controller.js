function sendResponse(response,statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}

async function generateResponse(request, response) {

    let prompt = request.body.toString();
    let url = "https://api.openai.com/v1/chat/completions";
    let key = "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";
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: `${prompt}`
                }
            ],
            temperature: 0.7
        })
    };
    try {
        const result = await fetch(url, options);
        if (result.status !== 200) {
            console.log(`Response Status: ${result.status}`);
            console.log(`Response Text: ${await result.text()}`);
            sendResponse(response, 200, "text/html", await result.text());
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