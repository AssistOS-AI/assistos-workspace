const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class UpdateAnnouncement extends IFlow {
    static flowMetadata = {
        action: "Updates an announcement",
        intent: "Update announcement"
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        announcementId: {
            type: "string",
            required: true
        },
        announcementObj: {
            type: "object",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let spaceModule = apis.loadModule("space");
            await spaceModule.updateAnnouncement(parameters.spaceId, parameters.announcementId, parameters.announcementObj);
            apis.success(parameters.announcementId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = UpdateAnnouncement;
