const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddAnnouncement extends IFlow {
    static flowMetadata = {
        action: "Adds a new announcement to the current space",
        intent: "User wants to add an announcement",
    };

    static flowParametersSchema = {
        title: {
            type: "string",
            required: true
        },
        text: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super(AddAnnouncement);
    }

    async userCode(apis, parameters) {
        let spaceModule = apis.loadModule("space");
        let announcementData = {
            title: parameters.title,
            text: parameters.text,
        };
        await spaceModule.addSpaceAnnouncement(assistOS.space.id, announcementData);
        apis.success(announcementData);
    }
}

module.exports = AddAnnouncement;
