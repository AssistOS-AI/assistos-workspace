async function processTextAdvancedRequest(request, response, sendRequest, initiator, target, text, outputFormat) {
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const personalityModule = require('assistos').loadModule("agent", securityContext);
    let initiatorPersonality, targetPersonality;

    try {
        initiatorPersonality = await personalityModule.getAgent(request.spaceId, initiator);
        targetPersonality = await personalityModule.getAgent(request.spaceId, target);
    } catch (error) {
        error.statusCode = 404;
        throw error;
    }
    const promptContextPrompt = `
        **New Session Identity:**
        
        - You name from now on is "${initiatorPersonality.name}"
        - You have become the new consciousness of a mind embodied in the following person(host): "${initiatorPersonality.description}"
        - You have to execute the instructions given to you by the client
        - You will execute those instructions based on your new identity, and the response will be tailored to the client and client's request
        - You will receive a target Identity representing the Client
        - You will receive a text instruction from the client
        - You will receive an output format instruction from the client that must be respected in all circumstanced and at all costs
        
        ** Client Identity:**
        
        - Client name : "${targetPersonality.name}"
        - Client is embodied in the following person(host): "${targetPersonality.description}"
    `
    const promptInstructionPrompt = `
        **Client Instruction:**
        ${text}
    `
    const outputFormatPrompt = `
        **Output instructions:**
        - in any conceivable circumstance, you must respect the client output specifications
        - Under no circumstance will your response include any other commentary,explications("output","response",etc), meta-commentary, information, or text of any kind that is not directly related to the client instruction and matching the client specification
        - Your output format must strictly adhere without any deviation to the following format:
        "${outputFormat}"
    `
    request.body = {
        modelName: initiatorPersonality.getCurrentSettings("text"),
        promptObject: {
            promptContext: promptContextPrompt,
            promptInstructions: promptInstructionPrompt + outputFormatPrompt,
        },
    }
    return await sendRequest(`/apis/v1/text/generate/advanced`, "POST", request, response);
}

module.exports = {processTextAdvancedRequest};