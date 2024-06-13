const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DeleteAnnouncement extends IFlow {
    static flowMetadata = {
        action: "Deletes an announcement",
        intent: "Delete an announcement",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        announcementId: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let spaceModule = await this.loadModule("space");
            await spaceModule.deleteAnnouncement(parameters.spaceId, parameters.announcementId);
            apis.success(parameters.announcementId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = DeleteAnnouncement;
