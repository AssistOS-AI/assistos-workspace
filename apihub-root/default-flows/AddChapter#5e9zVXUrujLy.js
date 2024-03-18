export class AddChapter {
    static id = "5e9zVXUrujLy";
    static description = "Adds a new chapter to a document";

    constructor() {
    }

    async start(documentId, title) {
        if (!title) {
            title = "NewChapter";
        }

        try {
            let document = webSkel.currentUser.space.getDocument(documentId);

            // Create chapter data
            let chapterData = {
                title: title,
                id: webSkel.appServices.generateId(),
                paragraphs: [
                    {
                        text: "New Paragraph",
                        id: webSkel.appServices.generateId(),
                    },
                ],
            };

            let position = document.chapters.length;

            // Find the position to add the new chapter
            if (webSkel.currentUser.space.currentChapterId) {
                position = document.chapters.findIndex(
                    (chapter) => chapter.id === webSkel.currentUser.space.currentChapterId
                ) + 1;
            }

            // Add the chapter to the document
            await document.addChapter(chapterData, position);

            // Update current chapter and paragraph IDs in the user space
            webSkel.currentUser.space.currentChapterId = chapterData.id;
            webSkel.currentUser.space.currentParagraphId = chapterData.paragraphs[0].id;

            this.return(title);
        } catch (e) {
            this.fail(e);
        }
    }
}