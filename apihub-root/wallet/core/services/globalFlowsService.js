import {DocumentModel} from "../models/documentModel.js";
import {sanitize} from "../../imports.js";

export class GlobalFlowsService{
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
            },
            suggestAbstract : async function(documentId, prompt){
                let flowId = webSkel.currentUser.space.getFlowIdByName("suggest abstract");
                let userDetails = {prompt:prompt};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, userDetails);
            },
            acceptSuggestedAbstract: async function(documentId, abstract){
                let document = webSkel.currentUser.space.getDocument(documentId);
                await document.addAlternativeAbstract({content:sanitize(abstract), id:webSkel.getService("UtilsService").generateId()});
            },
            generateIdeas: async function(hint, personalityId, variants, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("generate ideas");
                return await webSkel.getService("LlmsService").callFlow(flowId, hint, personalityId, variants, maxTokens);
            },
            generateChapters: async function(ideas, documentId, prompt, chaptersNr){
                let flowId = webSkel.currentUser.space.getFlowIdByName("generate chapters");
                let details = {prompt:prompt, nr:chaptersNr};
                return await webSkel.getService("LlmsService").callFlow(flowId, ideas, documentId, details);
            },
            generateEmptyChapters: async function(ideas, documentId, prompt, chaptersNr){
                let flowId = webSkel.currentUser.space.getFlowIdByName("generate empty chapters");
                let details = {prompt:prompt, nr:chaptersNr};
                return await webSkel.getService("LlmsService").callFlow(flowId, ideas, documentId, details);
            },
            generateParagraphs: async function(ideas, documentId, chapterId, prompt, paragraphsNr){
                let flowId = webSkel.currentUser.space.getFlowIdByName("generate empty chapters");
                let details = {prompt:prompt, nr:paragraphsNr};
                return await webSkel.getService("LlmsService").callFlow(flowId, ideas, documentId, chapterId, details);
            },
            suggestChapterTitles:  async function(documentId, chapterId, prompt, titlesNr, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("suggest chapter titles");
                let details = {prompt:prompt, nr:titlesNr};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, details, maxTokens);
            },
            addAlternativeChapterTitles: async function(documentId, chapterId, selectedTitles){
                let document = webSkel.currentUser.space.getDocument(documentId);
                let chapter = document.getChapter(chapterId);
                chapter.addAlternativeTitles(selectedTitles);
                await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
            },
            suggestDocumentTitles: async function(documentId, prompt, titlesNr, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("suggest document titles");
                let details = {prompt:prompt, nr:titlesNr};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, details, maxTokens);
            },
            addAlternativeDocumentTitles: async function(documentId, selectedTitles){
                let document = webSkel.currentUser.space.getDocument(documentId);
                await document.addAlternativeTitles(selectedTitles);
            },
            suggestParagraph : async function(documentId, chapterId, paragraphId, prompt){
                let flowId = webSkel.currentUser.space.getFlowIdByName("suggest paragraph");
                let details = {prompt:prompt};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, paragraphId, details);
            },
            acceptSuggestedParagraph: async function(documentId, chapterId, paragraphId, alternativeParagraph){
                let document = webSkel.currentUser.space.getDocument(documentId);
                let chapter = document.getChapter(chapterId);
                let paragraph = chapter.getParagraph(paragraphId);

                paragraph.addAlternativeParagraph(alternativeParagraph);
                await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
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
        this.proofreadFlows = {
            proofread: async function(text, personalityId, details){
                let flowId = webSkel.currentUser.space.getFlowIdByName("proofread");
                return await webSkel.getService("LlmsService").callFlow(flowId, text, personalityId, details);
            }
        }
    }

}