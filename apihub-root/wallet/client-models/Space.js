
import {validateData} from "../client-apis/utils/validateData.js";

export class Space {
    constructor(spaceDataObject) {

        const validationResult = validateData(spaceValidationSchema, spaceDataObject);

        if (validationResult.status === "false") {
            throw new Error(validationResult.errorMessage);
        }

        Object.assign(this, spaceDataObject);
        this.agent = new Agent(this.agent);
        this.settings = new Settings(this.settings);

        this.personalities = this.personalities.map(personalityData => new Personality(personalityData));
        this.announcements = this.announcements.map(announcementData => new Announcement(announcementData));
        this.users = this.users.map(userData => new User(userData));
        this.documents = this.documents.map(documentData => new DocumentModel(documentData)).reverse();
        this.installedApplications = this.installedApplications.map(applicationData => new Application(applicationData));

        this.flows = [];
        this.observers = [];
    }

}