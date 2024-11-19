const SpaceHandler = require('../spaces-storage/space.js');
const Request = require('../apihub-component-utils/utils.js');
const { ServerSideSecurityContext, loadModule } = require('assistos');

async function ensurePersonalitiesDefaultLllms(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const personalities = await SpaceHandler.APIs.getSpacePersonalitiesObject(spaceId);

        const notUpdatedPersonalities = personalities.filter(personality => !personality.llms);

        if (notUpdatedPersonalities.length === 0) {
            return Request.sendResponse(response, 200, "application/json", { message: "All personalities have default llms" });
        }

        const defaultLlmsRes = await fetch(`${process.env.BASE_URL}/apis/v1/llms/defaults`);
        if (!defaultLlmsRes.ok) {
            return Request.sendResponse(response, 500, "application/json", { message: "Failed to fetch default LLMs" });
        }

        const defaultLlms = (await defaultLlmsRes.json()).data;
        notUpdatedPersonalities.forEach(personality => {
            personality.llms = defaultLlms;
        });

        const securityContext = new ServerSideSecurityContext(request);
        const personalityModule = loadModule("personality", securityContext);
        for(const personality of notUpdatedPersonalities){
            await personalityModule.updatePersonality(spaceId, personality.id, personality);
        }
        return Request.sendResponse(response, 200, "application/json", { message: "Personalities updated with default llms" });
    } catch (error) {
        return Request.sendResponse(response, 500, "application/json", { message: `An error occurred while updating personalities:${error.message}` });
    }
}

module.exports = {
    ensurePersonalitiesDefaultLllms
};
