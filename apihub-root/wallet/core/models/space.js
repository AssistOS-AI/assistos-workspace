import {DocumentModel, Personality,User,Settings,Script,Announcement} from "../../imports.js";

export class Space {
    constructor(spaceData) {
        this.name = spaceData.name||undefined;
        this.id = spaceData.id || undefined;
        this.settings = spaceData.settings ? new Settings(spaceData.settings) : {personalities:[]};
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

   async addDocument(documentData) {
        let newDocument=documentFactory.createDocument(documentData)
        await documentFactory.addDocument(currentSpaceId, newDocument);
        webSkel.space.currentDocumentId = newDocument.id;
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

    createDefaultScripts(){
        let scriptData = [
            {name:"suggest titles",id:"3AeXXLeDVgQM", description:"returns 10 titles as a JSON array",
                content:"\nasync (...args)=>{\nlet prompt = \"Please suggest 10 titles for a book. Return the response as a string JSON array.\";" +
                    "\nlet response = await this.generateResponse(prompt);" +
                    "\n\nconsole.log(response);" +
                    "\nreturn response;\n}\n"},
            {name:"suggest abstract",id:"5pPdhqLZsx62", description:"generates an abstract about cats",
                content:"\nasync (...args)=>{\nlet prompt = \"Please sugest an abstract for a document that is about cats. Return only the abstract text\";" +
                    "\nlet response = await this.generateResponse(prompt);" +
                    "\n\nconsole.log(response);" +
                    "\nreturn response;\n}\n"}
        ];
        for(let item of scriptData){
            this.scripts.push(new Script(item));
        }
    }
}