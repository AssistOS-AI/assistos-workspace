/* pass storage data as constructor parameter */
/* both the user and space know of each other */
/* the user has a list of spaces, and the space has a list of users */

import { DocumentModel } from "../../imports.js";
import { User } from "../../imports.js";
import { Settings } from "../../imports.js";
import { Announcement } from "../../imports.js";

export class Space {
    constructor(spaceData) {
        if (Space.instance) {
            return Space.instance;
        }
        this.name = spaceData.name;
        this.id = spaceData.id || undefined;
        this.settings = new Settings(spaceData.settings);
        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = (spaceData.users || []).map(userData => new User(userData));
        this.documents = (spaceData.documents||[]).map(docData => new DocumentModel(docData));
        this.observers = [];
        Space.instance = this;
    }

    static getInstance(spaceData) {
        if(!this.instance) {
            this.instance = new Space(spaceData);
        }
        return this.instance;
    }

    onChange(observerFunction) {
        this.observers.push(new WeakRef(observerFunction));
    }

    notifyObservers() {
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if (observer) {
                observer();
            }
        }
    }

    async addSpace(title){
        let currentDate = new Date();
        let today = currentDate.toISOString().split('T')[0];
        let textString = "Space " + title + " was successfully created. You can now add documents, users and settings to your space.";
        let newAnnouncements = [{
            id: 1,
            title: "Welcome to AIAuthor!",
            text: textString,
            date: today
        }];
        Space.changeSpace(await webSkel.storageService.addSpace({
            name: title, documents: [], personalities: [], admins: [], settings: {llms: [], personalities: []}, announcements: newAnnouncements, users: []}
        ));
    }

    static changeSpace(spaceId) {
        window.currentSpaceId = spaceId;
        let user = JSON.parse(localStorage.getItem("currentUser"));
        user.currentSpaceId = currentSpaceId;
        localStorage.setItem("currentUser", JSON.stringify(user));
        // let docService = webSkel.getService('documentService');
        // docService.getAllDocuments().forEach((doc) => {
        //     doc.observeChange(()=>{});
        // });
        window.location = "";
    }

    getSpaceNames() {
        return currentUser.spaces.filter(space => space.id !== currentSpaceId) || [];
    }

    deleteSpace() {

    }
}