export default {
    name: "CloneChapter",
    description: "Creates an alternative for a chapter using a personality, using proofread if specified",
    tags: ["presenters", "agents", "documents"],

    start: function(documentId, chapterId, personalityId, newTitle, proofread) {
        const document = webSkel.currentUser.space.getDocument(documentId);
        const chapter = document.getChapter(chapterId);
        const simplifiedChapter = JSON.stringify(chapter.simplifyChapter());

        if (proofread) {
            const promptBase = `Please review this chapter in its JSON format: ${simplifiedChapter}.`;

            if (personalityId === "copy") {
                this.prompt = `${promptBase} Your task is to replicate the chapter as it is, maintaining its original context and format. Additionally, conduct a thorough proofreading to correct any grammatical errors, ambiguities, or inconsistencies, thereby refining the document to ensure clarity and accuracy.`;
            } else {
                const personality = webSkel.currentUser.space.getPersonality(personalityId);
                this.prompt = `${promptBase} Your challenge is to replicate this chapter from the perspective of ${personality.description}. In doing so, preserve the original context, yet adapt the language to reflect the unique linguistic style of this personality. Additionally, attentively identify and rectify any grammatical errors, ambiguities, or inconsistencies in the text, enhancing it with improved, clearer expressions.`;
            }
        } else {
            if (personalityId === "copy") {
                this.prompt = `Your objective is to duplicate this chapter exactly as it is, presented in JSON format: ${simplifiedChapter}. Please ensure that the copy you create is an exact replica of the original, maintaining the same context and structure, without making any modifications or corrections.`;
            } else {
                const personality = webSkel.currentUser.space.getPersonality(personalityId);
                this.prompt = `Please analyze and replicate this chapter, presented in JSON format: ${simplifiedChapter}, from the perspective of ${personality.description}. While preserving the original context, adapt the language to mirror the linguistic style associated with these personality traits. Note that no proofreading for grammatical accuracy or consistency is required in this task.`;
            }
        }
        this.setDefaultValues();
        this.setIntelligenceLevel(3);
        this.execute(document, chapter, newTitle);
    },
    execute: async function(document, chapter, newTitle) {
        try {
            const text = await this.request(this.prompt);
            let chapterObj = JSON.parse(text);
            chapterObj.title = newTitle;
            await chapter.addAlternativeChapter(chapterObj);
            await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
            this.return(JSON.stringify(chapterObj));
        } catch (e) {
            this.fail(e);
        }
    }
};

