const {
    getTextResponse,
    getTextStreamingResponse,
    getImageResponse,
    editImage,
    getImageVariants,
    getVideoResponse,
    getAudioResponse,
    listVoices,
    sendLLMConfigs,
    listEmotions,
    lipsync
} = require("./controller.js");

const bodyReader = require("../apihub-component-middlewares/bodyReader");
const authentication = require("../apihub-component-middlewares/authentication");
const authorization = require("../apihub-component-middlewares/authorization");

function LLMStorage(server) {
    server.use("/apis/v1/spaces/:spaceId/llms/*", bodyReader);
    server.use("/apis/v1/spaces/:spaceId/llms/*", authentication);
    server.use("/apis/v1/spaces/:spaceId/llms/*", authorization);
    server.get("/apis/v1/spaces/:spaceId/llms/configs", sendLLMConfigs);

    server.post("/apis/v1/spaces/:spaceId/llms/text/generate", getTextResponse);
    //server.post("/apis/v1/spaces/:spaceId/llms/text/streaming/generate", getTextStreamingResponse);
    server.post("/apis/v1/spaces/:spaceId/llms/image/generate", getImageResponse);
    server.post("/apis/v1/spaces/:spaceId/llms/image/edit", editImage);
    server.post("/apis/v1/spaces/:spaceId/llms/image/variants", getImageVariants);
    server.post("/apis/v1/spaces/:spaceId/llms/video/generate", getVideoResponse);

    server.post("/apis/v1/spaces/:spaceId/llms/audio/generate", getAudioResponse);
    server.get("/apis/v1/spaces/:spaceId/llms/audio/listVoices", listVoices);
    server.get("/apis/v1/spaces/:spaceId/llms/audio/listEmotions", listEmotions);

    server.get("/apis/v1/spaces/:spaceId/llms/video/lipsync", lipsync);

}

module.exports = LLMStorage;