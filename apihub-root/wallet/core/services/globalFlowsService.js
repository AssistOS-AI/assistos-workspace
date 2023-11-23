import {DocumentModel} from "../models/documentModel.js";
import {sanitize} from "../../imports.js";

export class GlobalFlowsService{
    constructor() {
        this.documentFlows={
            generateDocument : async function (docData, maxTokens) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateDocument");
                return await  webSkel.getService("LlmsService").callFlow(flowId,
                   docData.documentTitle, docData.documentTopic, docData.chaptersCount, docData.documentPersonality, maxTokens);
            },
            addDocument : async function (docData, ...args) {
                await webSkel.currentUser.space.addDocument(docData);
            },
            deleteDocument: async function(documentId,...args){
                await webSkel.currentUser.space.deleteDocument(documentId);
            },
            cloneDocument: async function(documentId,documentTitle,personalityId="copy", proofread=false, ...args){
                let scriptId = webSkel.currentUser.space.getFlowIdByName("CloneDocument");
                let clonedDocJson = await webSkel.getService("LlmsService").callFlow(scriptId,documentId,personalityId,proofread,documentTitle);

                let docData = clonedDocJson.responseJson;
                docData.title = documentTitle;
                await documentFactory.addDocument(window.webSkel.currentUser.space.id, new DocumentModel(docData));

            },
            renameDocument: async function(documentId,titleText, ...args) {
                await webSkel.currentUser.space.getDocument(documentId).updateTitle(titleText);
            },
            suggestAbstract : async function(documentId, prompt){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestAbstract");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, prompt);
            },
            acceptSuggestedAbstract: async function(documentId, abstract, validityCallback){
                if (typeof validityCallback === 'function' && !validityCallback()) {
                    return;
                }
                let flowId = webSkel.currentUser.space.getFlowIdByName("acceptSuggestedAbstract");
                await webSkel.getService("LlmsService").callFlow(flowId, documentId, abstract);
            },
            generateIdeas: async function(hint, personalityId, variants, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateIdeas");
                return await webSkel.getService("LlmsService").callFlow(flowId, hint, personalityId, variants, maxTokens);
            },
            generateChapters: async function(ideas, documentId, prompt, chaptersNr){
                let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateChapters");
                return await webSkel.getService("LlmsService").callFlow(flowId, ideas, documentId, prompt, chaptersNr);
            },
            generateEmptyChapters: async function(ideas, documentId, prompt, chaptersNr){
                let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateEmptyChapters");
                return await webSkel.getService("LlmsService").callFlow(flowId, ideas, prompt, chaptersNr);
            },
            generateParagraphs: async function(ideas, documentId, chapterId, prompt, paragraphsNr){
                let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateEmptyChapters");
                return await webSkel.getService("LlmsService").callFlow(flowId, ideas, documentId, chapterId, prompt, paragraphsNr);
            },
            suggestChapterTitles:  async function(documentId, chapterId, prompt, titlesNr, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("GuggestChapterTitles");
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
                let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestDocumentTitles");
                let details = {prompt:prompt, nr:titlesNr};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, details, maxTokens);
            },
            addAlternativeDocumentTitles: async function(documentId, selectedTitles){
                let document = webSkel.currentUser.space.getDocument(documentId);
                await document.addAlternativeTitles(selectedTitles);
            },
            suggestParagraph : async function(documentId, chapterId, paragraphId, prompt){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestParagraph");
                let details = {prompt:prompt};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, paragraphId, details);
            },
            acceptSuggestedParagraph: async function(documentId, chapterId, paragraphId, alternativeParagraph){
                let document = webSkel.currentUser.space.getDocument(documentId);
                let chapter = document.getChapter(chapterId);
                let paragraph = chapter.getParagraph(paragraphId);

                paragraph.addAlternativeParagraph(alternativeParagraph);
                await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
            },
            summarizeChapter: async function(documentId, chapterId, prompt, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeChapter");
                let details = {prompt:prompt};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, details, maxTokens);
            },
            acceptChapterIdeas: async function(documentId, chapterId, ideas){
                let document = webSkel.currentUser.space.getDocument(documentId);
                let chapter = document.getChapter(chapterId);
                await chapter.setMainIdeas(ideas.map((chapterIdea)=>{return sanitize(chapterIdea)}))
                await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
            },
            summarizeDocument: async function(documentId, prompt, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeDocument");
                let details = {prompt:prompt};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, details, maxTokens);
            },
            acceptDocumentIdeas: async function(documentId, ideas){
                let document = webSkel.currentUser.space.getDocument(documentId);
                await document.setMainIdeas(ideas.map((documentIdea)=>{return sanitize(documentIdea)}))
                await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
            },
            summarizeParagraph: async function(documentId, chapterId, paragraphId, prompt, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeParagraph");
                let details = {prompt:prompt};
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, paragraphId, details, maxTokens);
            },
            acceptParagraphIdea: async function(documentId, chapterId, paragraphId, idea){
                let document = webSkel.currentUser.space.getDocument(documentId);
                let chapter = document.getChapter(chapterId);
                let paragraph = chapter.getParagraph(paragraphId);
                await paragraph.setMainIdea(sanitize(idea));
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
            },
            deleteSpace: async function(spaceId, ...args) {
              await storageManager.storeSpace(spaceId, "");
              await webSkel.getService("AuthenticationService").removeSpaceFromUser(webSkel.currentUser.id,spaceId);
              await webSkel.currentUser.space.changeSpace(webSkel.currentUser.id);
            }
        }
        this.proofreadFlows = {
            proofread: async function(text, personalityId, details){
                let flowId = webSkel.currentUser.space.getFlowIdByName("Proofread");
                let additionalDetails = {prompt:details};
                return await webSkel.getService("LlmsService").callFlow(flowId, text, personalityId, additionalDetails);
            }
        }
        this.translateFlows = {
         translate: async function(text, personalityId, language, details){
             let flowId = webSkel.currentUser.space.getFlowIdByName("Translate");
             let additionalDetails = {prompt:details};
             return await webSkel.getService("LlmsService").callFlow(flowId, text, personalityId, language, additionalDetails);
         }
        }
    }

}