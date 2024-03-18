export class AddDocument {
    static id = "7SFvE1v84fPx";
    static description = "Adds a new document. All the information needed is just its title and its topic. The topic should be no longer than a sentence";
    static parameters=[
        {
            name: "title",
            type: "string",
            description: "The title of the document",
            optional: false,
        },
        {
            name: "topic",
            type: "string",
            description: "The topic of the document",
            optional: false,
        },
    ]
    constructor() {

    }

    async start(title, topic) {
        try {
            let docData = {
                title: title,
                topic: topic,
            };
            let docId = await webSkel.currentUser.space.addDocument(docData);
            this.return(docId);
        } catch (e) {
            this.fail(e);
        }
    }
}