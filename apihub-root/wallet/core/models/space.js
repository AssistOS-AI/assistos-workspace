/* pass storage data as constructor parameter */
/* both the user and space know of each other */
/* the user has a list of spaces, and the space has a list of users */

import {DocumentModel, LLM} from "../../imports.js";
import { User } from "../../imports.js";
import { Settings } from "../../imports.js";
import { Announcement } from "../../imports.js";

export class Space {
    constructor(spaceData) {
        this.name = spaceData.name || "";
        this.id = spaceData.id || undefined;
        this.settings = spaceData.settings ? new Settings(spaceData.settings) : {llms:[], personalities:[]};
        this.admins = [];
        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = (spaceData.users || []).map(userData => new User(userData));
        this.scripts = spaceData.scripts || [];
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
    getSpaceStatus() {
        return {
            name: this.name,
            id: this.id,
            settings: this.settings,
            admins: this.admins,
            announcements: this.announcements
        }
    }
    stringifySpace() {
        function replacer(key, value) {
            if (key === "observers") return undefined;
            else return value;
        }
        return JSON.stringify(this, replacer);
    }

    observeChange(elementId, callback) {
        let obj = {elementId: elementId, callback: callback};
        this.observers.push(new WeakRef(obj));

    }

    notifyObservers(prefix) {
        this.observers = this.observers.reduce((accumulator, item) => {
            if (item.deref()) {
                accumulator.push(item);
            }
            return accumulator;
        }, []);
        for (const observerRef of this.observers) {
            const observer = observerRef.deref();
            if(observer && observer.elementId.startsWith(prefix)) {
                observer.callback();
            }
        }
    }

    getNotificationId(){
        return "space";
    }

    changeSpace(spaceId) {
        window.currentSpaceId = spaceId;

        let user = JSON.parse(webSkel.getService("AuthenticationService").getCachedCurrentUser());
        user.currentSpaceId = currentSpaceId;
        webSkel.getService("AuthenticationService").setCachedCurrentUser(user);
        window.location = "";
    }

    getSpaceNames() {
        return currentUser.spaces.filter(space => space.id !== currentSpaceId) || [];
    }

    async addPersonality(personality) {
        webSkel.space.settings.personalities.push(personality);
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

    addAnnouncement(announcement) {
        this.scripts.push(announcement);
    }

    getAnnouncement(announcementId) {
        let announcement = this.announcements.find((announcement) => announcement.id = announcementId);
        return announcement || console.error(`Announcement not found, announcementId: ${announcementId}`);
    }

    deleteAnnouncement(announcementId) {
        this.announcements.slice(announcementId, 1);
    }

    updateAnnouncement(announcementId, content) {
        let announcement = this.getAnnouncement(announcementId);
        announcement.text = content;
    }

    getScript(scriptId) {
        let script = this.scripts.find((script) => script.id = scriptId);
        return script || console.error(`Script not found in Settings, scriptId: ${scriptId}`);
    }

    async addScript(script) {
        await storageManager.storeObject(currentSpaceId, "scripts", script.id, JSON.stringify(script));
        webSkel.space.notifyObservers();
        this.scripts.push(script);
    }

    async deleteScript(scriptId) {
        this.scripts = this.scripts.filter(script => script.id !== scriptId);
        await storageManager.storeObject(currentSpaceId, "scripts", scriptId, "");
    }
    async deleteLLM(llmId) {
        this.settings.llms = this.settings.llms.filter(llm=> llm.id !== llmId);
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus()));
    }
    async updateScript(scriptId, content) {
        let script = this.getScript(scriptId);
        script.content = content;
        await storageManager.storeObject(currentSpaceId, "scripts", script.id, JSON.stringify(script));
    }

    getLLM(llmSelector) {
        return this.settings.llms.find(llm => llm.name === llmSelector || llm.id === parseInt(llmSelector)) || null;
    }

    addLLMKey(llmSelector, key) {
        let llm = this.getLLM(llmSelector);
        if(llm.apiKeys[llm.apiKeys.length - 1] === null) {
            llm.apiKeys[llm.apiKeys.length - 1] = key;
        }
        else {
            llm.apiKeys.push(key);
        }
        return llm;
    }
    editLLM(){

    }

    addLLM(llm) {
        this.settings.llms.push(llm);
    }
    async storeLLM(llmData) {
        this.settings.llms.push(new LLM(llmData));
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus()));
    }
}