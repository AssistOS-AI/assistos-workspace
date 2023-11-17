import {DocumentModel} from "../models/documentModel.js";

export class globalFlowsService{
    constructor() {
        this.documentFlows={
            generateDocument : async function (docData,...args) {
                let scriptId = webSkel.currentUser.space.getFlowIdByName("generate document");
                let result = await  webSkel.getService("LlmsService").callFlow(scriptId,
                   docData.documentTitle, docData.documentTopic,docData.chaptersCount);

                let generatedDocJson= result.responseJson;
                await webSkel.currentUser.space.addDocument(generatedDocJson);
            },
            addDocument : async function (docData, ...args) {
                await webSkel.currentUser.space.addDocument(docData);
            },
            deleteDocument: async function(documentId,...args){
                await webSkel.currentUser.space.deleteDocument(documentId);
            },
            cloneDocument: async function(documentId,documentTitle,personalityId="copy", proofread=false, ...args){
                let scriptId = webSkel.currentUser.space.getFlowIdByName("clone document");
                let clonedDocJson = await webSkel.getService("LlmsService").callFlow(scriptId,documentId,personalityId,proofread,documentTitle);

                let docData = clonedDocJson.responseJson;
                docData.title = documentTitle;
                await documentFactory.addDocument(window.webSkel.currentUser.space.id, new DocumentModel(docData));

            },
            renameDocument: async function(documentId,titleText, ...args) {
                await webSkel.currentUser.space.getDocument(documentId).updateTitle(titleText);
            }
        }
        this.spaceFlows={
            addSpace: async function(spaceId, ...args) {},
            addAnnouncement: async function(announcementData, ...args) {
                await webSkel.currentUser.space.addAnnouncement(announcementData);
            },
            addPersonality: async function(personalityData, ...args) {
                await webSkel.currentUser.space.addPersonality(personalityData);
            },
            addFlow: async function(flowData, ...args) {
                await webSkel.currentUser.space.addFlow(flowData);
            }
        }
    }

}