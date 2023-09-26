/* pass storage data as constructor parameter */
/* both the user and space know of each other */
/* the user has a list of spaces, and the space has a list of users */

import {DocumentModel, Personality} from "../../imports.js";
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
        this.announcements = [];

        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        // this.users = [];
        this.users = (spaceData.users || []).map(userData => new User(userData));
        // this.documents = [];
        this.scripts = [];
        this.documents = (spaceData.documents || []).map(documentData => new DocumentModel(documentData));
        this.observers = [];
        Space.instance = this;
    }

    static getInstance(spaceData) {
        if(!this.instance) {
            this.instance = new Space(spaceData);
        }
        return this.instance;
    }

    stringifySpace(){
        function replacer(key,value) {
            if (key === "observers") return undefined;
            else if (key === "currentDocumentId") return undefined;
            else return value;
        }
        return JSON.stringify(this, replacer);
    }
    // onChange(observerFunction) {
    //     this.observers.push(new WeakRef(observerFunction));
    // }
    //
    // notifyObservers() {
    //     for (const observerRef of this.observers) {
    //         const observer = observerRef.deref();
    //         if (observer) {
    //             observer();
    //         }
    //     }
    // }

    // notifyObservers() {
    //     for (const observerRef of this.observers) {
    //         const observer = observerRef.deref();
    //         if (observer) {
    //             observer();
    //         }
    //     }
    // }

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
        this.changeSpace(await webSkel.storageService.addSpace({
            name: title, documents: [], personalities: [], admins: [], settings: {llms: [], personalities: []}, announcements: newAnnouncements, users: []}
        ));
    }

    changeSpace(spaceId) {
        window.currentSpaceId = spaceId;
        let user = JSON.parse(localStorage.getItem("currentUser"));
        user.currentSpaceId = currentSpaceId;
        localStorage.setItem("currentUser", JSON.stringify(user));
        window.location = "";
    }

    getSpaceNames() {
        return currentUser.spaces.filter(space => space.id !== currentSpaceId) || [];
    }

    async addPersonality(personality) {
        await webSkel.localStorage.addPersonality(personality);
        webSkel.space.settings.personalities.push(personality);
    }

    getLLMs() {
        return webSkel.space.settings.llms || [];
    }

    getLLM(llmSelector) {
        return webSkel.space.settings.llms.find(llm => llm.name === llmSelector || llm.id === llmSelector) || null;
    }

   async summarize(prompt, llmId) {
        let llm = this.getLLM(llmId);
        return await this.llmApiFetch(llm.url, llm.apiKeys, prompt);
    }

    async suggestAbstract(prompt, llmId) {
        let llm;
        if(!(llm = this.getLLM(llmId))) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await this.llmApiFetch(llm.url, llm.apiKeys, prompt);
    }

    async proofread(prompt, llmId) {
        let llm = this.getLLM(llmId);
        return await this.llmApiFetch(llm.url, llm.apiKeys, prompt);
    }

   async suggestTitles(prompt, llmId) {
        let llm = this.getLLM(llmId);
        if (!llm) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await this.llmApiFetch(llm.url, llm.apiKeys, prompt);
    }

   async llmApiFetch(url, apiKey, prompt) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey[0].trim()}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: `${prompt}`
                    }
                ],
                temperature: 0.7
            })
        };
        try {
            const response = await fetch(url, options);
            if (response.status !== 200) {
                console.log(`Response Status: ${response.status}`);
                console.log(`Response Text: ${await response.text()}`);
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            const result = await response.json();
            return result.choices[0].message.content;
        } catch (error) {
            console.log('API call failed:', error);
        }
    }

    addDocument(document) {
        webSkel.space.documents.push(document);
    }

    deleteDocument(documentId) {
        webSkel.space.documents = webSkel.space.documents.filter(obj => obj.id !== documentId);
    }

    getDocument(documentId) {
        const document = webSkel.space.documents.find(document => document.id === documentId);
        return document || null;
    }
}