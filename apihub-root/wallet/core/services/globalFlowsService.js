import {DocumentModel} from "../models/documentModel.js";
import {sanitize} from "../../imports.js";

export class GlobalFlowsService{
    constructor() {
        this.documentFlows={
            generateDocument : async function (title, topic, chaptersCount, personalityId, maxTokens) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateDocument");
                return await  webSkel.getService("LlmsService").callFlow(flowId,
                   title, topic, chaptersCount, personalityId, maxTokens);
            },
            addDocument : async function (docData, ...args) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("AddDocument");
                return await webSkel.getService("LlmsService").callFlow(flowId, docData);
            },
            deleteDocument: async function(documentId,...args){
                let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteDocument");
                let result = await webSkel.getService("LlmsService").callFlow(flowId, documentId);
            },
            cloneDocument: async function(documentId, personalityId, newTitle, proofread){
                let flowId = webSkel.currentUser.space.getFlowIdByName("CloneDocument");
                let result = await webSkel.getService("LlmsService").callFlow(flowId, documentId, personalityId, newTitle, proofread);
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
                let flowId = webSkel.currentUser.space.getFlowIdByName("AcceptSuggestedAbstract");
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
                let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestChapterTitles");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, prompt, titlesNr, maxTokens);
            },
            addAlternativeChapterTitles: async function(documentId, chapterId, selectedTitles){
                let flowId = webSkel.currentUser.space.getFlowIdByName("AddAlternativeChapterTitles");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, selectedTitles);
            },
            suggestDocumentTitles: async function(documentId, prompt, titlesNr, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestDocumentTitles");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, prompt, titlesNr, maxTokens);
            },
            addAlternativeDocumentTitles: async function(documentId, selectedTitles){
                let flowId = webSkel.currentUser.space.getFlowIdByName("AddAlternativeDocumentTitles");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, selectedTitles);
            },
            suggestParagraph : async function(documentId, chapterId, paragraphId, prompt){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestParagraph");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, paragraphId, prompt);
            },
            acceptSuggestedParagraph: async function(documentId, chapterId, paragraphId, alternativeParagraph){
                let flowId = webSkel.currentUser.space.getFlowIdByName("AcceptSuggestedParagraph");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, paragraphId, alternativeParagraph);
            },
            summarizeChapter: async function(documentId, chapterId, prompt, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeChapter");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, prompt, maxTokens);
            },
            acceptChapterIdeas: async function(documentId, chapterId, ideas){
                let flowId = webSkel.currentUser.space.getFlowIdByName("AcceptChapterIdeas");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, ideas);
            },
            summarizeDocument: async function(documentId, prompt, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeDocument");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, prompt, maxTokens);
            },
            acceptDocumentIdeas: async function(documentId, ideas){
                let flowId = webSkel.currentUser.space.getFlowIdByName("AcceptDocumentIdeas");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, ideas);
            },
            summarizeParagraph: async function(documentId, chapterId, paragraphId, prompt, maxTokens){
                let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeParagraph");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, paragraphId, prompt, maxTokens);
            },
            acceptParagraphIdea: async function(documentId, chapterId, paragraphId, idea){
                let flowId = webSkel.currentUser.space.getFlowIdByName("AcceptParagraphIdea");
                return await webSkel.getService("LlmsService").callFlow(flowId, documentId, chapterId, paragraphId, idea);
            }
        }
        this.spaceFlows={
            addSpace: async function(spaceData) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("AddSpace");
                return await webSkel.getService("LlmsService").callFlow(flowId, spaceData);
            },
            addAnnouncement: async function(announcementData) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("AddAnnouncement");
                return await webSkel.getService("LlmsService").callFlow(flowId, announcementData);
            },
            addPersonality: async function(personalityData) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("AddPersonality");
                return await webSkel.getService("LlmsService").callFlow(flowId, personalityData);
            },
            updatePersonality: async function(personalityData, personalityId) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("UpdatePersonality");
                return await webSkel.getService("LlmsService").callFlow(flowId, personalityData, personalityId);
            },
            deletePersonality: async function(personalityId) {
                let flowId = webSkel.currentUser.space.getFlowIdByName("DeletePersonality");
                return await webSkel.getService("LlmsService").callFlow(flowId, personalityId);
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