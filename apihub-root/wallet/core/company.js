/* pass storage data as constructor parameter */
/* both the user and company know of each other */
/* the user has a list of company, and the company has a list of users */

import { DocumentModel } from "../imports.js";
import { User } from "../imports.js";
import { Settings } from "../imports.js";
import { Announcement } from "../imports.js";

export class Company {
    constructor(companyData) {
        if (Company.instance) {
            return Company.instance;
        }
        this.name = companyData.name;
        this.id = companyData.id || undefined;
        this.settings = new Settings(companyData.settings);
        this.announcements = (companyData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = (companyData.users || []).map(userData => new User(userData));
        this.documents = (companyData.documents||[]).map(docData => new DocumentModel(docData));
        this.observers = [];
        Company.instance = this;
    }
    static getInstance(companyData) {
        if(!this.instance) {
            this.instance = new Company(companyData);
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