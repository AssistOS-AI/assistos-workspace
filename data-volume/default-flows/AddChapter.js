export class AddChapter {
    static description = "Adds a new chapter to a document";
    static inputSchema = {
        documentId: "string",
    }
    async start(context) {
        if (!context.title) {
            context.title = "NewChapter";
        }

        try {
            let document = assistOS.space.getDocument(context.documentId);

            // Create chapter data
            let chapterData = {
                title: context.title,
                paragraphs: [
                    {
                        text: "New Paragraph",
                        position: 0
                    },
                ],
            };

            let position = document.chapters.length;

            // Find the position to add the new chapter
            if (assistOS.space.currentChapterId) {
                position = document.chapters.findIndex(
                    (chapter) => chapter.id === assistOS.space.currentChapterId
                ) + 1;
            }

            // Add the chapter to the document
            chapterData.position = position;
            await document.addChapter(chapterData);

            // Update current chapter and paragraph IDs in the user assistOS.space
            assistOS.space.currentChapterId = chapterData.id;
            assistOS.space.currentParagraphId = chapterData.paragraphs[0].id;

            this.return(context.title);
        } catch (e) {
            this.fail(e);
        }
    }
}