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
        this.name = spaceData.name||undefined;
        this.id = spaceData.id || undefined;
        this.personalities = (spaceData.personalities || []).map(personalityData => new Personality(personalityData));

        this.settings = spaceData.settings ? new Settings(spaceData.settings) : {};
        this.announcements = (spaceData.announcements || []).map(announcementData => new Announcement(announcementData));
        this.users = (spaceData.users || []).map(userData => new User(userData));
        this.flows = [];
        this.documents = (spaceData.documents || []).map(documentData => new DocumentModel(documentData)).reverse();
        this.admins = [];
        this.pages = spaceData.pages || [];
        if(spaceData.agent){
            this.agent = new Agent(spaceData.agent);
        }
        this.observers = [];
        this.installedApplications = (spaceData.installedApplications || []).map(applicationData => new Application(applicationData));
        Space.instance = this;
    }

    simplifySpace(){
        return {
            name: this.name,
            id: this.id,
            personalities: this.personalities.map(personality => personality.simplify()),
            announcements : this.announcements.map(announcement => announcement.simplify()),
        }
    }
    getSpaceStatus() {
        return {
            name: this.name,
            id: this.id,
            admins: this.admins,
            announcements: this.announcements,
            agent: this.agent,
            installedApplications: this.installedApplications.map(app => app.stringifyApplication())
        }
    }
    stringifySpace() {
        function replacer(key, value) {
            if (key === "observers") return undefined;
            else if (key === "flows") return undefined;
            else return value;
        }
        return JSON.stringify(this, replacer,2);
    }

    stringifyFlows(){
        let arr = [];
        for(let flow of this.flows){
            arr.push({name:flow.name+ "#" + flow.id, class: flow.stringifyClass()})
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
    async loadApplicationsFlows(){
        for(let app of this.installedApplications){
            await app.loadFlows();
        }
    }
    getApplication(name){
        let app = this.installedApplications.find((app) => app.name === name);
        return app || console.error(`installed app not found in space, name: ${name}`);
    }
    getAllFlows(){
        let flows = [];
        for(let app of this.installedApplications){
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
    getFlowIdByName(name){
        let flows = this.getAllFlows();
        let flow = flows.find((flow) => flow.class.name === name);
        return flow.class.id || console.error(`Flow not found in space, flow name: ${name}`);
    }
    getDefaultAgent(){
        return this.agent;
    }
   async addDocument(documentData) {
        let newDocument=documentFactory.createDocument(documentData)
        await documentFactory.addDocument(webSkel.currentUser.space.id, newDocument);
        webSkel.currentUser.space.currentDocumentId = newDocument.id;
        return newDocument.id;
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
    async addPage(pageData) {
        const page = new PageModel(pageData)
        pageData.id = page.id;
        this.pages.push(page);
        await storageManager.storeObject(webSkel.currentUser.space.id, "pages", page.id, JSON.stringify(pageData,null,2));
    }
    async deletePage(pageId) {
        this.pages = this.pages.filter(page => page.id !== pageId);
        await storageManager.storeObject(webSkel.currentUser.space.id, "pages", pageId, "");
    }
    async addFlow(flowClass) {
        let flowObject= new Flow(flowClass);
        this.flows.push(flowObject);
        await storageManager.storeFlow(webSkel.currentUser.space.id, flowObject.fileName, flowObject.stringifyClass());
    }

    async deleteAnnouncement(announcementId) {
        this.announcements = this.announcements.filter(announcement=> announcement.id !== announcementId);
        await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }
    async deleteFlow(flowId, appId) {
        if(!appId){
            let fileName = this.getFlow(flowId).fileName;
            this.flows = this.flows.filter(flow => flow.class.id !== flowId);
            await storageManager.storeFlow(webSkel.currentUser.space.id, fileName, "");
        }else {
            let app = this.getApplication(appId);
            let fileName = this.getFlow(flowId).fileName;
            app.flows = app.flows.filter(flow => flow.class.id !== flowId);
            await storageManager.storeAppFlow(webSkel.currentUser.space.id, app.id, fileName, "");
        }

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
    async updateFlow(flowId, flowClass, appId) {
        let flow = this.getFlow(flowId);
        if(flow!==null) {
            flow.class = flowClass;
            if(!appId){
                await storageManager.storeFlow(webSkel.currentUser.space.id, flow.fileName, flow.stringifyClass());
            }else {
                let app = this.getApplication(appId);
                await storageManager.storeAppFlow(webSkel.currentUser.space.id, app.id, flow.fileName,  flow.stringifyClass());
            }
        }else{
            console.error("Failed to update flow, flow not found.");
        }
    }
    async loadFlows(){
        let flows = await storageManager.loadFlows(this.id);
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
        }
    }
    async createDefaultFlows(){
        let flows = await storageManager.loadDefaultFlows();
        for (let [name, flowClass] of Object.entries(flows)) {
            this.flows.push(new Flow(flowClass));
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
    async deleteApplication(name){
        this.installedApplications = this.installedApplications.filter(app => app.name !== name);
        await storageManager.storeObject(webSkel.currentUser.space.id, "status", "status", JSON.stringify(webSkel.currentUser.space.getSpaceStatus(),null,2));
    }
}