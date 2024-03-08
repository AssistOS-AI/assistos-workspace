const fsPromises = require('fs').promises;

async function getApiKeyForSpace(server, spaceId) {
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(server.rootFolder);
    return secretsService.getSecretSync(`${spaceId}.APIKey`, "OpenAiAPIKey")
}

function openAIMixin(target) {
    target.setTemperature = function (level) {
        target.__body.temperature = level;
    }
    target.getOptions = function () {
        return {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${target.key}`
            },
            body: JSON.stringify(target.__body)
        }
    }
    target.setPrompt = function (prompt) {
        target.addMessage({role: "user", content: prompt});
    }
    target.setVariants = function (number) {
        target.__body.n = number;
    }
    target.setMaxTokens = function (number) {
        if (typeof number === "string" || typeof number === "undefined") {
            target.__body.max_tokens = null;
        } else {
            target.__body.max_tokens = number;
        }
    }
    target.setKey = async function (key) {
        try {
            if (key !== undefined) {
                target.key = key;
            } else if (process.env.OPENAI_API_KEY) {
                target.key = process.env.OPENAI_API_KEY;
            }
        } catch (error) {
            throw new Error(`Failed setting the API key. No key provided or couldn't find a key in the environment`);
        }
    };
    target.setResponseFormat = function (format) {
        if (format) {
            if (format === "json_object") {
                target.__body["response_format"] = {type: "json_object"};
                target.addMessage({"role": "system", "content": `{\"response_format\":\"json_object\"}`});
            } else {
                target.__body["response_format"] = {type: "text"};
                target.addMessage({"role": "system", "content": `{\"response_format\":\"text\"}`});
            }

        }
    }
    target.addMessage = function (message) {
        target.__body.messages.push(message);
    }
    target.callLLM = async function (settings, spaceId, server) {
        target.setVariants(parseInt(settings.variants));
        target.setMaxTokens(settings.max_tokens);
        target.setResponseFormat(settings.responseFormat);
        if (settings.messages) {
            for (let reply of settings.messages) {
                if (reply.role === "user") {
                    target.addMessage({role: "user", content: reply.content});
                } else if (reply.role === "assistant") {
                    target.addMessage({role: "assistant", content: reply.content});
                } else {
                    target.addMessage({role: "system", content: reply.content});
                }
            }
        }
        target.setPrompt(settings.prompt);
        try {
            await target.setKey(await getApiKeyForSpace(server, spaceId))
        } catch (error) {
            const noApiKeyError=new Error(error)
            noApiKeyError.noKeyFound=true;
            throw(noApiKeyError)
        }
        const result = await fetch(target.__url, target.getOptions());
        if (result.status !== 200) {
            console.log(`Response Status: ${result.status}`);
            console.log(`Response Text: ${await result.text()}`);
            throw new Error(await result.text());
        }
        const generatedMessages = JSON.parse(await result.text()).choices;
        if (this.__body.n > 1) {
            let response = [];
            for (let item of generatedMessages) {
                response.push(item.message.content);
            }
            return JSON.stringify(response);
        } else {
            return generatedMessages[0].message.content;
        }
    }
}

module.exports = openAIMixin;