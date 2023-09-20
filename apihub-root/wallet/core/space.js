/* pass storage data as constructor parameter */
/* both the user and space know of each other */
/* the user has a list of spaces, and the space has a list of users */

import { DocumentModel } from "../imports.js";
import { User } from "../imports.js";
import { Settings } from "../imports.js";
import { Announcement } from "../imports.js";

export class Space {
    constructor(spaceData) {
        if (Space.instance) {
            return Space.instance;
        }
        this.name = spaceData.name;
        this.id = spaceData.id || undefined;
        this.settings = new Settings(spaceData.settings);
        this.announcements = (spaceData.announcements || []).map(announcement => new Announcement(announcement.title, announcement.text, announcement.date, announcement.id));
        this.users = (spaceData.users || []).map(user => new User(user.lastName, user.firstName, user.email, user.phoneNumber));
        this.documents = (spaceData.documents || []).map(docData => new DocumentModel(docData));
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
}