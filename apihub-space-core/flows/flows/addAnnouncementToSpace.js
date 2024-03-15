const IFlow = require("../IFlow.js");

class AddAnnouncementToSpace extends IFlow {
    constructor(dependencies) {
        super(dependencies);
    }

    getFlowMetadata() {
        return   `/*
                 * AddAnnouncementToSpace Class
                 * Adds an announcement to the current space associated with the user who is currently logged in.
                 * 
                 * Methods:
                 * 
                 * getFlowMetadata():
                 * Returns metadata about the flow.
                 * @returns {String} A String containing metadata about this flow.
                 *
                 * validateFlow():
                 * Validates the necessary conditions to add an announcement.
                 * @throws {Error} Throws an error if the announcement model creation fails.
                 * @returns {Boolean} True if validation passes, otherwise false.
                 *
                 * execute():
                 * Executes the flow to add an announcement to the current space.
                 * @throws {Error} Throws an error if validateFlow() returns false, indicating that the execution failed.
                 */`
    }

    async validateFlow() {
        try {
            this.announcementModel = await this.APIS.createAnnouncementInstance(this.announcementObject)
            return true;
        } catch (error) {
            this.error = {message:error.message};
            return false;
        }
    }

    async execute() {
        await this.validateFlow()
            ? this.APIS.addAnnoucementToSpace(this.spaceId, this.announcementModel)
            : throw (`Error executing flow ${this.error}`);
    }
}

module.exports = AddAnnouncementToSpace