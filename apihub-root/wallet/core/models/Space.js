import {
    DocumentModel,
    Personality,
    User,
    Settings,
    Flow,
    Announcement,
    Agent, PageModel,
    Application
} from "../../imports.js";

export class Space {
    constructor(spaceData) {
        this.name = spaceData.name || undefined;
        this.id = spaceData.id || undefined;
        this.personalities = (spaceData.personalities || []).map(personalityData => new Personality(personalityData));

        this.settings = spaceData.settings ? new Settings(spaceData.settings) : {};
        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = (spaceData.users || []).map(userData => new User(userData));
        this.flows = [];
        this.documents = (spaceData.documents || []).map(documentData => new DocumentModel(documentData)).reverse();
        this.admins = [];
        this.apiKeys = spaceData.apiKeys || {};
        this.pages = spaceData.pages || [];
        if (spaceData.agent) {
            this.agent = new Agent(spaceData.agent);
        }
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
            apiKeys:this.apiKeys
        }
    }

    getSpaceStatus() {
        return {
            name: this.name,
            id: this.id,
            admins: this.admins,
            users:this.users,
            announcements: this.announcements,
            agent: this.agent,
            installedApplications: this.installedApplications.map(app => app.stringifyApplication()),
            apiKeys:this.apiKeys
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

    getNotificationId() {
        return "space";
    }

    async changeSpace(spaceId) {
        let user = JSON.parse(await system.storage.loadUser(system.user.id));
        user.currentSpaceId = spaceId;
        await system.storage.storeUser(user.id, JSON.stringify(user));
        window.location = "";
    }

    getDocument(documentId) {
        const document = this.documents.find(document => document.id === documentId);
        return document || null;
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
            return index === self.findIndex(e => e.class.id === element.class.id);
        });
        return flows;
    }

    getFlow(flowId) {
        let flows = this.getAllFlows();
        let flow = flows.find((flow) => flow.class.id === flowId);
        return flow || console.error(`Flow not found in space, flowId: ${flowId}`);
    }

    getFlowIdByName(name) {
        let flows = this.getAllFlows();
        let flow = flows.find((flow) => flow.class.name === name);
        return flow.class.id || console.error(`Flow not found in space, flow name: ${name}`);
    }

    getDefaultAgent() {
        return this.agent;
    }

    async addDocument(documentData) {
        let newDocument = system.factories.createDocument(documentData)
        await system.factories.addDocument(system.space.id, newDocument);
        system.space.currentDocumentId = newDocument.id;
        return newDocument.id;
    }

    async deleteDocument(documentId) {
        this.documents = this.documents.filter(document => document.id !== documentId);
        await system.storage.storeObject(system.space.id, "documents", documentId, "");

    }

    async addPersonality(personalityData) {
        let personalityObj = new Personality(personalityData);
        this.personalities.push(personalityObj);
        await system.storage.storeObject(system.space.id, "personalities", personalityObj.getFileName(), JSON.stringify(personalityObj, null, 2));
    }

    async updatePersonality(personalityData, id) {
        let personality = this.getPersonality(id);
        personality.update(personalityData);
        await system.storage.storeObject(system.space.id, "personalities", personality.getFileName(), JSON.stringify(personality, null, 2));
    }

    getPersonality(id) {
        return this.personalities.find(pers => pers.id === id);
    }
    getPersonalityByName(name){
        return this.personalities.find(pers => pers.name === name);
    }

    async addAnnouncement(announcementData) {
        this.announcements.unshift(new Announcement(announcementData));
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(), null, 2));
    }

    async addPage(pageData) {
        const page = new PageModel(pageData)
        pageData.id = page.id;
        this.pages.push(page);
        await system.storage.storeObject(system.space.id, "pages", page.id, JSON.stringify(pageData, null, 2));
    }

    async deletePage(pageId) {
        this.pages = this.pages.filter(page => page.id !== pageId);
        await system.storage.storeObject(system.space.id, "pages", pageId, "");
    }

    async addFlow(flowClass) {
        let flowObject = new Flow(flowClass, true);
        this.flows.push(flowObject);
        await system.storage.storeFlow(system.space.id, flowObject.fileName, flowObject.stringifyClass());
    }

    async deleteAnnouncement(announcementId) {
        this.announcements = this.announcements.filter(announcement => announcement.id !== announcementId);
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(), null, 2));
    }

    async deleteFlow(flowId, appId) {
        if (!appId) {
            let fileName = this.getFlow(flowId).fileName;
            this.flows = this.flows.filter(flow => flow.class.id !== flowId);
            await system.storage.storeFlow(system.space.id, fileName, "");
        } else {
            let app = this.getApplication(appId);
            let fileName = this.getFlow(flowId).fileName;
            app.flows = app.flows.filter(flow => flow.class.id !== flowId);
            await system.storage.storeAppFlow(system.space.id, app.name, fileName, "");
        }

    }

    async deletePersonality(personalityId) {
        let personality = this.personalities.find(personality => personality.id === personalityId);
        let fileName = personality.getFileName();
        this.personalities = this.personalities.filter(personality => personality.id !== personalityId);
        await system.storage.storeObject(system.space.id, "personalities", fileName, "");
    }

    async updateAnnouncement(announcementId, title, content) {
        let announcement = this.getAnnouncement(announcementId);
        if (announcement !== null) {
            announcement.title = title;
            announcement.text = content;
            await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(), null, 2));
        } else {
            console.error("Failed to update announcement, announcement not found.");
        }
    }

    async updateFlow(flowId, flowClass, appId) {
        let flow = this.getFlow(flowId);
        if (flow !== null) {
            flow.class = flowClass;
            if (!appId) {
                await system.storage.storeFlow(system.space.id, flow.fileName, flow.stringifyClass());
            } else {
                let app = this.getApplication(appId);
                await system.storage.storeAppFlow(system.space.id, app.name, flow.fileName, flow.stringifyClass());
            }
        } else {
            console.error("Failed to update flow, flow not found.");
        }
    }

    async loadFlows() {
        let flows = await system.storage.loadFlows(this.id);
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
        }
    }

    async createDefaultFlows() {
        let flows = await system.storage.loadDefaultFlows();
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
        }
    }

    async createDefaultPersonalities() {
        let personalities = JSON.parse(await system.storage.loadDefaultPersonalities());
        for (let personality of personalities) {
            this.personalities.push(new Personality(personality));
        }
    }

    async createDefaultAgent() {
        this.agent = new Agent(JSON.parse(await system.storage.loadDefaultAgent()));
    }

    createDefaultAnnouncement(spaceData) {
        let defaultAnnouncement = {
            id: system.services.generateId(),
            title: "Welcome to AIAuthor!",
            text: `Space ${this.name} was successfully created. You can now add documents, users and settings to your space.`,
            date: new Date().toISOString().split('T')[0]
        };
        this.announcements.push(new Announcement(defaultAnnouncement));
    }

    async deleteApplication(name) {
        this.installedApplications = this.installedApplications.filter(app => app.name !== name);
        await system.storage.storeObject(system.space.id, "status", "status", JSON.stringify(system.space.getSpaceStatus(), null, 2));
    }
}