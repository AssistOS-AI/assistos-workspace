const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DeleteSpace extends IFlow {
    static flowMetadata = {
        action: "Deletes a space",
        intent: "Delete a space",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            await assistOS.storage.storeSpace(parameters.spaceId, "");
            await assistOS.services.removeSpaceFromUser(assistOS.user.id, parameters.spaceId);
            await assistOS.space.changeSpace(assistOS.user.id);
            apis.success(parameters.spaceId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = DeleteSpace;
