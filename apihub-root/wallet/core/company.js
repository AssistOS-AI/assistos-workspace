/* pass storage data as constructor parameter */
/* both the user and company know of each other */
/* the user has a list of company, and the company has a list of users */

import { Document } from "../imports.js";
import { User } from "../imports.js";
import {Settings} from "../imports.js";

export class Company {
    constructor(companyData) {
        if (Company.instance) {
            return Company.instance;
        }
        this.name=companyData.name;
        this.id = companyData.id || undefined;
        this.settings = new Settings(companyData.llms,companyData.personalities);
        this.users = (companyData.users || []).map(user => new User(user.lastName, user.firstName, user.email, user.phoneNumber));
        this.documents = (companyData.documents||[]).map(docData => new Document(docData.title, docData.id, docData.abstract, docData.chapters, docData.settings, docData.alternativeTitles,docData.alternativeAbstracts));
        if (this.documents && this.documents.length > 0) {
            this.currentDocumentId = this.documents[0].id;
        } else {
            this.currentDocumentId = undefined;
        }
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