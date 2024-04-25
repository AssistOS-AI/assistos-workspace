import {
    Announcement,
    Application,
    constants,
    Flow,
    PageModel,
    Personality,
    LLM,
    Document
} from "../../imports.js";

export class Space {
    constructor(spaceData) {
        this.name = spaceData.name || undefined;
        this.id = spaceData.id || undefined;
        this.personalities = (spaceData.personalities || []).map(personalityData => new Personality(personalityData));
        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = spaceData.users || [];
        this.flows = [];
        this.admins = [];
        this.apiKeys = spaceData.apiKeys || {};
        this.documents = (spaceData.documents|| []).map(documentData => new Document(documentData)).reverse();
        this.pages = spaceData.pages || [];
        this.currentPersonalityId = spaceData.currentPersonalityId || this.personalities.find(personality => personality.id === constants.PERSONALITIES.DEFAULT_PERSONALITY_ID).id;
        this.llms = spaceData.llms || [{name:"GPT 3.5 Turbo",id:"q12437rgq39r845t"}, {name:"GPT 4",id:"q124wsreg"}].map(llm => new LLM(llm));
        this.currentLlmId = spaceData.currentLlmId || "q12437rgq39r845t";
        this.observers = [];
        this.installedApplications = (spaceData.installedApplications || []).map(applicationData => new Application(applicationData));
        Space.instance = this;
    }

    simplifySpace() {
        return {
            name: this.name,
            id: this.id,
            personalities: this.personalities.map(personality => personality.simplify()),
            announcements: this.announcements.map(announcement => announcement.simplify()),
            installedApplications: this.installedApplications.map(application => application.stringifyApplication()),
            apiKeys:this.apiKeys,
            documents: this.documents.map(document => {
                return {
                    id: document.id,
                    title: document.title,
                }
            }),
        }
    }

    getSpaceStatus() {
        return {
            name: this.name,
            id: this.id,
            admins: this.admins,
            users:this.users,
            announcements: this.announcements,
            currentPersonalityId: this.currentPersonalityId,
            installedApplications: this.installedApplications.map(app => app.stringifyApplication()),
            apiKeys:this.apiKeys
        }
    }

    async getDocument(documentId){
        let document = this.documents.find(document=>document.id === documentId);
        if(document){
            return document;
        } else{
            let documentModule = require("assistOS").loadModule("document");
            let response = JSON.parse(await documentModule.getDocument(assistOS.space.id, documentId));
            let document = new Document(response.data);
            this.documents.push(document);
            return document;
        }
    }
    async getDocuments(){
        if(this.documentsMetadata){
            return this.documentsMetadata;
        } else {
            let documentModule = require("assistOS").loadModule("document");
            let response = JSON.parse(await documentModule.getDocumentsMetadata(assistOS.space.id));
            this.documentsMetadata = response.data;
            return this.documentsMetadata;
        }
    }
    getKey(keyType,keyId){
        return this.apiKeys[keyType].find(key=>key.id===keyId)||null;
    }
    stringifySpace() {
        function replacer(key, value) {
            if (key === "observers") return undefined;
            else if (key === "flows") return undefined;
            else return value;
        }

        return JSON.stringify(this, replacer, 2);
    }

    stringifyFlows() {
        let arr = [];
        for (let flow of this.flows) {
            arr.push({name: flow.class.name + "#" + flow.class.id, class: flow.stringifyClass()})
        }
        return JSON.stringify(arr);
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
            if (observer && observer.elementId.startsWith(prefix)) {
                observer.callback();
            }
        }
    }
    getAgent(){
        return this.personalities.find(personality=> personality.id === this.currentPersonalityId);
    }
    async setAgent(personalityId){
        this.currentPersonalityId = personalityId;
        await assistOS.storage.storeObject(assistOS.space.id, "status", "status", JSON.stringify(assistOS.space.getSpaceStatus(), null, 2));
    }
    getLLM(){
        return this.llms.find(llm=> llm.id === this.currentLlmId);
    }
    setLlm(llmId){
        this.currentLlmId = llmId;
    }

    getNotificationId() {
        return "space";
    }



    getAnnouncement(announcementId) {
        let announcement = this.announcements.find((announcement) => announcement.id === announcementId);
        return announcement || console.error(`Announcement not found, announcementId: ${announcementId}`);
    }

    async loadApplicationsFlows() {
        for (let app of this.installedApplications) {
            await app.loadFlows();
        }
    }

    getApplication(id) {
        let app = this.installedApplications.find((app) => app.id === id);
        return app || console.error(`installed app not found in space, id: ${id}`);
    }

    getApplicationByName(name) {
        let app = this.installedApplications.find((app) => app.name === name);
        return app || console.error(`installed app not found in space, id: ${name}`);
    }

    getAllFlows() {
        let flows = [];
        for (let app of this.installedApplications) {
            flows = flows.concat(app.flows);
        }
        flows = flows.concat(this.flows);
        //removes duplicates by id
        flows = flows.filter((element, index, self) => {
            return index === self.findIndex(e => e.class.name === element.class.name);
        });
        return flows;
    }

    getFlow(flowName) {
        let flow = this.flows.find((flow) => flow.class.name === flowName);
        return flow || console.error(`Flow not found in space, flowId: ${flowName}`);
    }


    getDefaultAgent() {
        return this.agent;
    }

    async addPersonality(personalityData) {
        let personalityObj = new Personality(personalityData);
        this.personalities.push(personalityObj);
        await assistOS.storage.storeObject(assistOS.space.id, "personalities", personalityObj.getFileName(), JSON.stringify(personalityObj, null, 2));
    }

    async updatePersonality(personalityData, id) {
        let personality = this.getPersonality(id);
        personality.update(personalityData);
        await assistOS.storage.storeObject(assistOS.space.id, "personalities", personality.getFileName(), JSON.stringify(personality, null, 2));
    }

    getPersonality(id) {
        return this.personalities.find(pers => pers.id === id);
    }
    getPersonalityByName(name){
        return this.personalities.find(pers => pers.name === name);
    }

    async addAnnouncement(announcementData) {
        this.announcements.unshift(new Announcement(announcementData));
        await assistOS.storage.storeObject(assistOS.space.id, "status", "status", JSON.stringify(assistOS.space.getSpaceStatus(), null, 2));
    }

    async addPage(pageData) {
        const page = new PageModel(pageData)
        pageData.id = page.id;
        this.pages.push(page);
        await assistOS.storage.storeObject(assistOS.space.id, "pages", page.id, JSON.stringify(pageData, null, 2));
    }

    async deletePage(pageId) {
        this.pages = this.pages.filter(page => page.id !== pageId);
        await assistOS.storage.storeObject(assistOS.space.id, "pages", pageId, "");
    }

    async addFlow(flowClass) {
        let flowObject = new Flow(flowClass, true);
        this.flows.push(flowObject);
        await assistOS.storage.storeFlow(assistOS.space.id, flowObject.fileName, flowObject.stringifyClass());
    }

    async deleteAnnouncement(announcementId) {
        this.announcements = this.announcements.filter(announcement => announcement.id !== announcementId);
        await assistOS.storage.storeObject(assistOS.space.id, "status", "status", JSON.stringify(assistOS.space.getSpaceStatus(), null, 2));
    }

    async deleteFlow(flowName, appId) {
        if (!appId) {
            let fileName = this.getFlow(flowName).fileName;
            this.flows = this.flows.filter(flow => flow.class.name !== flowName);
            await assistOS.storage.storeFlow(assistOS.space.id, fileName, "");
        } else {
            let app = this.getApplication(appId);
            let fileName = this.getFlow(flowId).fileName;
            app.flows = app.flows.filter(flow => flow.class.name !== flowName);
            await assistOS.storage.storeAppFlow(assistOS.space.id, app.name, fileName, "");
        }
    }

    async deletePersonality(personalityId) {
        let personality = this.personalities.find(personality => personality.id === personalityId);
        let fileName = personality.getFileName();
        this.personalities = this.personalities.filter(personality => personality.id !== personalityId);
        await assistOS.storage.storeObject(assistOS.space.id, "personalities", fileName, "");
    }

    async updateAnnouncement(announcementId, title, content) {
        let announcement = this.getAnnouncement(announcementId);
        if (announcement !== null) {
            announcement.title = title;
            announcement.text = content;
            await assistOS.storage.storeObject(assistOS.space.id, "status", "status", JSON.stringify(assistOS.space.getSpaceStatus(), null, 2));
        } else {
            console.error("Failed to update announcement, announcement not found.");
        }
    }

    async updateFlow(flowName, flowClass, appId) {
        let flow = this.getFlow(flowName);
        if (flow !== null) {
            flow.class = flowClass;
            if (!appId) {
                await assistOS.storage.storeFlow(assistOS.space.id, flow.fileName, flow.stringifyClass());
            } else {
                let app = this.getApplication(appId);
                await assistOS.storage.storeAppFlow(assistOS.space.id, app.name, flow.fileName, flow.stringifyClass());
            }
        } else {
            console.error("Failed to update flow, flow not found.");
        }
    }

    async loadFlows() {
        let flows = await assistOS.storage.loadFlows(this.id);
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
        }
    }

    async createDefaultFlows() {
        let flows = await assistOS.storage.loadDefaultFlows();
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
        }
    }

    async createDefaultPersonalities() {
        let personalities = JSON.parse(await assistOS.storage.loadDefaultPersonalities());
        for (let personality of personalities) {
            this.personalities.push(new Personality(personality));
        }
    }

   /* TODO TBD makes sense only if the intent is to have the application also working offline */
    createDefaultAnnouncement(spaceData) {
        let defaultAnnouncement = {
            id: assistOS.services.generateId(),
            title: "Welcome to AIAuthor!",
            text: `Space ${this.name} was successfully created. You can now add documents, users and settings to your space.`,
            date: new Date().toISOString().split('T')[0]
        };
        this.announcements.push(new Announcement(defaultAnnouncement));
    }

    async deleteApplication(name) {
        this.installedApplications = this.installedApplications.filter(app => app.name !== name);
        await assistOS.storage.storeObject(assistOS.space.id, "status", "status", JSON.stringify(assistOS.space.getSpaceStatus(), null, 2));
    }
}