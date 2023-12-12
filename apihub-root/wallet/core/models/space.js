import {
    DocumentModel,
    Personality,
    User,
    Settings,
    Flow,
    Announcement,
    Agent
} from "../../imports.js";

export class Space {
    constructor(spaceData) {
        this.name = spaceData.name||undefined;
        this.id = spaceData.id || undefined;
        this.personalities = (spaceData.personalities || []).map(personalityData => new Personality(personalityData));

        this.settings = spaceData.settings ? new Settings(spaceData.settings) : {};
        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = (spaceData.users || []).map(userData => new User(userData));
        this.flows = (spaceData.flows|| []).map(flowData => new Flow(flowData));

        this.documents = (spaceData.documents || []).map(documentData => new DocumentModel(documentData)).reverse();
        this.admins = [];
        this.pages = spaceData.pages || [];
        this.createDefaultAgent();
        this.observers = [];
        this.installedApplications =spaceData.installedApplications || [];
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

    async changeSpace(spaceId) {
        let user = JSON.parse(await storageManager.loadUser(webSkel.currentUser.id));
        user.currentSpaceId = spaceId;
        await storageManager.storeUser(user.id,JSON.stringify(user));
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
    getFlow(flowId) {
        let flow = this.flows.find((flow) => flow.id === flowId);
        return flow || console.error(`Flow not found in space, flowId: ${flowId}`);
    }
    getFlowIdByName(name){
        let flow = this.flows.find((flow) => flow.name === name);
        return flow.id || console.error(`Flow not found in space, flow name: ${name}`);
    }
    getDefaultAgent(){
        return this.agent;
    }
   async addDocument(documentData,locationRedirect="document-view-page") {
        let newDocument=documentFactory.createDocument(documentData)
        await documentFactory.addDocument(webSkel.currentUser.space.id, newDocument);
        webSkel.currentUser.space.currentDocumentId = newDocument.id;
        await webSkel.changeToDynamicPage(`${locationRedirect}`, `documents/${newDocument.id}/${locationRedirect}`);
    }
    async deleteDocument(documentId) {
        this.documents = this.documents.filter(document => document.id !== documentId);
        await storageManager.storeObject(webSkel.currentUser.space.id, "documents", documentId, "");

    }

    async addPersonality(personalityData) {
        let personalityObj = new Personality(personalityData);
        this.personalities.push(personalityObj);
        await storageManager.storeObject(webSkel.currentUser.space.id, "personalities", personalityObj.id, JSON.stringify(personalityObj,null,2));
    }

    async updatePersonality(personalityData, id){
        let personality = this.getPersonality(id);
        personality.update(personalityData);
        await storageManager.storeObject(webSkel.currentUser.space.id, "personalities", id, JSON.stringify(personality,null,2));
    }

    getPersonality(id){
        return this.personalities.find(pers => pers.id === id);
    }
    async addAnnouncement(announcementData) {
        this.announcements.unshift(new Announcement(announcementData));
        await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }
    async addFlow(flowData) {
        let flowObject= new Flow(flowData);
        this.flows.push(flowObject);
        await storageManager.storeObject(webSkel.currentUser.space.id, "flows", flowObject.id, JSON.stringify(flowObject,null,2));
    }


    async deleteAnnouncement(announcementId) {
        this.announcements = this.announcements.filter(announcement=> announcement.id !== announcementId);
        await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }
    async deleteFlow(flowId) {
        this.flows = this.flows.filter(flow => flow.id !== flowId);
        await storageManager.storeObject(webSkel.currentUser.space.id, "flows", flowId, "");
    }
    async deletePersonality(personalityId){
        this.personalities = this.personalities.filter(personality => personality.id !== personalityId);
        await storageManager.storeObject(webSkel.currentUser.space.id, "personalities", personalityId, "");
    }

    async updateAnnouncement(announcementId, content) {
        let announcement = this.getAnnouncement(announcementId);
        if(announcement!==null) {
            announcement.text = content;
            await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
        }else{
            console.error("Failed to update announcement, announcement not found.");
        }
    }
    async updateFlow(flowId, content) {
        let flow = this.getFlow(flowId);
        if(flow!==null) {
            flow.content = content;
            await storageManager.storeObject(webSkel.currentUser.space.id, "flows", flow.id, JSON.stringify(flow,null,2));
        }else{
            console.error("Failed to update flow, flow not found.");
        }
    }

    async createDefaultFlows(){
        let flows = JSON.parse(await storageManager.loadDefaultFlows());
        for(let flow of flows){
            this.flows.push(new Flow(flow));
        }
    }
    async createDefaultPersonalities(){
        let personalities = JSON.parse(await storageManager.loadDefaultPersonalities());
        for(let personality of personalities){
            this.personalities.push(new Personality(personality));
        }
    }
    async createDefaultAgent(){
        this.agent=new Agent(JSON.parse(await storageManager.loadDefaultAgent()));
    }
}