const LLMFactory = require('../factory/LLMFactory');
const streamEmitter = require('../utils/streamEmitter.js');

const apiKey = "REPLACE_WITH_YOUR_API_KEY";

const GPT4 = LLMFactory.createLLM("GPT-4", {}, apiKey, "openAI");

let finalResponse = "";

streamEmitter.on('data', (data) => {
    finalResponse += data;
    console.log(finalResponse);
});

(async () => {

    const runTest = async (testName) => {
        await(openAITests[testName]());
    }
   const openAITests= {
        streaming:async ()=> {
            try {
                const response = await GPT4.getStreamingResponse("Hello, how are you?", {
                    variants: 1, temperature: 0.5, maxTokens: 300
                });
                streamEmitter.emit('end');
                console.log(response);
            } catch (error) {
                console.error('Error during streaming:', error);
            }
        },
       streamingWithHistory:async ()=> {
                try {
                    const response = await GPT4.getResponseWithHistory([
                         { role: 'user', content: "Hello, how are you?" },
                         { role: 'assistant', content: "I'm fine, thank you." },
                        { role: 'user', content: "Whats 1+1?" }
                    ]);
                    streamEmitter.emit('end');
                    console.log(response);
                } catch (error) {
                    console.error('Error during streaming with history:', error);
                }
       },
        response:async ()=> {
            try {
                const response = await GPT4.getResponse("Hello, how are you?", {
                    variants: 1, temperature: 0.5, maxTokens: 300
                });
                console.log(response);
            } catch (error) {
                console.error('Error during response:', error);
            }
        },
       responseWithVariants:async ()=> {
              try {
                const response = await GPT4.getResponse("Hello, how are you?", {
                    variants: 3, temperature: 0.5, maxTokens: 300
                });
                console.log(response);
              } catch (error) {
                console.error('Error during response with variants:', error);
              }
       },
       responseWithHistory:async ()=> {
              try {
                const response = await GPT4.getResponseWithHistory([
                     { role: 'user', content: "Hello, how are you?" },
                     { role: 'assistant', content: "I'm fine, thank you." },
                    { role: 'user', content: "Whats 2+2?" }
                ]);
                console.log(response);
              } catch (error) {
                console.error('Error during response with history:', error);
              }
       },
       responseWithHistoryWithVariants:async ()=> {
                try {
                    const response = await GPT4.getResponseWithHistory([
                         { role: 'user', content: "Hello, how are you?" },
                         { role: 'assistant', content: "I'm fine, thank you." },
                        { role: 'user', content: "Whats the best way to fly?" },
                    ],{variants:3, temperature: 0.7, maxTokens: 300});
                    console.log(response);
                } catch (error) {
                    console.error('Error during response with history with variants:', error);
                }
       }
    }
    await runTest("responseWithHistoryWithVariants");
})();
