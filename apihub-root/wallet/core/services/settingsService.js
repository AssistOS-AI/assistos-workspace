
export class settingsService{
    constructor(){}
    getDocSettings(documentId) {
        const documentSettings = company.documents.find(document => document.id === documentId).settings;
        return documentSettings || [];
    }
    async setDocSettings(documentId, settings){
        const documentIndex = company.documents.findIndex(document => document.id === documentId);
        company.documents[documentIndex].settings = settings;
        await webSkel.localStorage.setDocSettings(documentId, settings);
    }

}