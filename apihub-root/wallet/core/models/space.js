import {DocumentModel, LLM, Personality,User,Settings,Script,Announcement} from "../../imports.js";

export class Space {
    constructor(spaceData) {
        this.name = spaceData.name||undefined;
        this.id = spaceData.id || undefined;
        this.settings = spaceData.settings ? new Settings(spaceData.settings) : {llms:[], personalities:[]};
        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = (spaceData.users || []).map(userData => new User(userData));
        this.scripts = (spaceData.scripts|| []).map(scriptData => new Script(scriptData));
        this.documents = (spaceData.documents || []).map(documentData => new DocumentModel(documentData));
        this.admins = [];
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
        return JSON.stringify(this, replacer,2);
    }

    observeChange(elementId, callback) {
        let obj = {elementId: elementId, callback: callback};
        callback.refferenceObject = obj;
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
    getDocument(documentId) {
        const document = this.documents.find(document => document.id === documentId);
        return document || null;
    }
    getAnnouncement(announcementId) {
        let announcement = this.announcements.find((announcement) => announcement.id === announcementId);
        return announcement || console.error(`Announcement not found, announcementId: ${announcementId}`);
    }
    getScript(scriptId) {
        let script = this.scripts.find((script) => script.id === scriptId);
        return script || console.error(`Script not found in Settings, scriptId: ${scriptId}`);
    }
    getLLM(llmSelector) {
        return this.settings.llms.find(llm => llm.name === llmSelector || llm.id === parseInt(llmSelector)) || null;
    }

   async addDocument(documentData) {
        let newDocument=documentFactory.createDocument(documentData)
        await documentFactory.addDocument(currentSpaceId, newDocument);
        await webSkel.changeToDynamicPage("edit-title-page", `documents/${newDocument.id}/edit-title-page`);
    }
    async addPersonality(personalityData) {
        this.settings.personalities.push(new Personality(personalityData));
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
    }
    async addAnnouncement(announcementData) {
        this.announcements.unshift(new Announcement(announcementData));
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
    }
    async addScript(scriptData) {
        let scriptObject= new Script(scriptData);
        this.scripts.push(scriptObject);
        await storageManager.storeObject(currentSpaceId, "scripts", scriptObject.id, JSON.stringify(scriptObject,null,2));
    }
    async addLLM(llmData) {
        this.settings.llms.push(new LLM(llmData));
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
    }

    deleteDocument(documentId) {
        webSkel.space.documents = webSkel.space.documents.filter(obj => obj.id !== documentId);
    }

    async deleteAnnouncement(announcementId) {
        this.announcements = this.announcements.filter(announcement=> announcement.id !== announcementId);
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
    }
    async deleteScript(scriptId) {
        this.scripts = this.scripts.filter(script => script.id !== scriptId);
        await storageManager.storeObject(currentSpaceId, "scripts", scriptId, "");
    }
    async deleteLLM(llmId) {
        this.settings.llms = this.settings.llms.filter(llm=> llm.id !== llmId);
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
    }
    async deletePersonality(personalityId){
        this.settings.personalities = this.settings.personalities.filter(personality => personality.id !== personalityId);
        await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
    }

    async updateAnnouncement(announcementId, content) {
        let announcement = this.getAnnouncement(announcementId);
        if(announcement!==null) {
            announcement.text = content;
            await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
        }else{
            console.error("Failed to update announcement, announcement not found.");
        }
    }
    async updateScript(scriptId, content) {
        let script = this.getScript(scriptId);
        if(script!==null) {
            script.content = content;
            await storageManager.storeObject(currentSpaceId, "scripts", script.id, JSON.stringify(script,null,2));
        }else{
            console.error("Failed to update script, script not found.");
        }
    }
    async updateLLM(llmId,content) {
        let llm = this.getLLM(llmId);
        if(llm!==null) {
            llm.url = content;
            await storageManager.storeObject(currentSpaceId, "status", "status", JSON.stringify(webSkel.space.getSpaceStatus(),null,2));
        }else{
            console.error("Failed to update LLM, LLM not found.");
        }
    }
}