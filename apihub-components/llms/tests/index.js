const fs = require('fs');
const data = require('../../apihub-component-utils/data.js');

const LLMFactory = require('../factory/LLMFactory');
const streamEmitter = require('../utils/streamEmitter.js');


const OpenAIApiKey = "";
const AnthropicApikey = "";
const GoogleApiKey = "";

const GPT3_Turbo = LLMFactory.createLLM("GPT-3.5-Turbo", {}, OpenAIApiKey, "openAI");
const GPT4 = LLMFactory.createLLM("GPT-4", {}, OpenAIApiKey, "openAI");
const GPT4_Turbo = LLMFactory.createLLM("GPT-4-Turbo", {}, OpenAIApiKey, "openAI");
const GPT4o = LLMFactory.createLLM("GPT-4o", {}, OpenAIApiKey, "openAI");
const DALLE3 = LLMFactory.createLLM("DALL-E-3", {}, OpenAIApiKey, "openAIImage");
const DALLE2 = LLMFactory.createLLM("DALL-E-2", {}, OpenAIApiKey, "openAIImage");
/*const Claude2=LLMFactory.createLLM("Claude-2", {}, AnthropicApikey, "anthropic");
const Claude3=LLMFactory.createLLM("Claude-3", {}, AnthropicApikey, "anthropic");

const Gemini= LLMFactory.createLLM("Gemini", {}, GoogleApiKey, "google");*/

let finalResponse = "";

streamEmitter.on('data', (data) => {
    finalResponse += data;
    console.log(finalResponse);
});

(async () => {
    const runTest = async (testSuite, LLM, testName) => {
        await (testSuites[testSuite][testName](LLM));
    }

    const testSuites = {
        openAI: {
            response: async (LLM) => {
                try {
                    const response = await LLM.getResponse("Hello, how are you?", {
                        variants: 1, temperature: 0.5, maxTokens: 300
                    });
                    console.log(response);
                } catch (error) {
                    console.error('Error during response:', error);
                }
            },
            responseWithVariants: async (LLM) => {
                try {
                    const response = await LLM.getResponse("Hello, how are you?", {
                        variants: 3, temperature: 0.5, maxTokens: 300
                    });
                    console.log(response);
                } catch (error) {
                    console.error('Error during response with variants:', error);
                }
            },
            responseWithHistory: async (LLM) => {
                try {
                    const response = await LLM.getResponseWithHistory([
                        {role: 'user', content: "Hello, how are you?"},
                        {role: 'assistant', content: "I'm fine, thank you."},
                        {role: 'user', content: "Whats 2+2?"}
                    ]);
                    console.log(response);
                } catch (error) {
                    console.error('Error during response with history:', error);
                }
            },
            responseWithHistoryWithVariants: async (LLM) => {
                try {
                    const response = await LLM.getResponseWithHistory([
                        {role: 'user', content: "Hello, how are you?"},
                        {role: 'assistant', content: "I'm fine, thank you."},
                        {role: 'user', content: "Whats the best way to fly?"},
                    ], {variants: 3, temperature: 0.7, maxTokens: 300});
                    console.log(response);
                } catch (error) {
                    console.error('Error during response with history with variants:', error);
                }
            },
            streaming: async (LLM) => {
                try {
                    const response = await LLM.getStreamingResponse("Hello, how are you?", {
                        variants: 1, temperature: 0.5, maxTokens: 300
                    });
                    streamEmitter.emit('end');
                    console.log(response);
                } catch (error) {
                    console.error('Error during streaming:', error);
                }
            },
            streamingWithHistory: async (LLM) => {
                try {
                    const response = await LLM.getResponseWithHistory([
                        {role: 'user', content: "Hello, how are you?"},
                        {role: 'assistant', content: "I'm fine, thank you."},
                        {role: 'user', content: "Whats 1+1?"}
                    ]);
                    streamEmitter.emit('end');
                    console.log(response);
                } catch (error) {
                    console.error('Error during streaming with history:', error);
                }
            },
            generateImage: async (LLM) => {
                try {
                    const response = await LLM.generateImage("", {
                        quality: "standard"
                    });
                    console.log(response);
                } catch (error) {
                    console.error('Error during image generation:', error);
                }
            },
            generateImageVariants: async (LLM) => {
                try {
                    const image = fs.createReadStream('./download.png')
                    const response = await LLM.generateImageVariants(image, {
                        variants: 3,
                        size: "256x256",
                        response_format: "b64_json"
                    });
                    console.log(response);
                } catch (error) {
                    console.error('Error during image generation with variants:', error);
                }
            }
        },
        anthropic: {
            response: async (LLM) => {
                try {
                    const response = await LLM.getResponse({role: "user", content: "Hello, Claude"}, {
                        temperature: 0.5, maxTokens: 300
                    });
                    console.log(response);
                } catch (error) {
                    console.error('Error during response:', error);
                }
            }
        },
        google: {
            response: async (LLM) => {
                try {
                    const response = await LLM.getResponse("Hello, how are you?", {});
                    console.log(response);
                } catch (error) {
                    console.error('Error during response:', error);
                }
            }
        }
    }

    await runTest("openAI", DALLE2, "generateImageVariants");


})();
