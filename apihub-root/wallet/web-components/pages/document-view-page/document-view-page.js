export class documentViewPage {
    constructor() {
        this.docTitle = "Documents";
        this.name = "Name";
        this.abstractText = "Edit your abstract";
        let url = window.location.hash;
        this.button = "Add new document";
        this.id = url.split('/')[1];
        this._document = webSkel.space.getDocument(this.id);
        if (this._document) {
            setTimeout(()=> {
                this.invalidate();
                this._document.observeChange(this._document.getNotificationId(), this.invalidate);
            }, 0);
            this.docTitle = this._document.title;
            if(this._document.abstract) {
                this.abstractText = this._document.abstract;
            }
            this.chapters = this._document.chapters;
        } else {
            console.log(`this _document doesnt exist: docId: ${this.id}`);
        }

        // this.updateState = ()=> {
        //     this._document = webSkel.space.getDocument(this.id);
        //     this.invalidate();
        // }

    }

    beforeRender() {
        this.chapterDivs = "";
        this.title = `<title-view title="${this.docTitle}"></title-view>`;
        if(this.chapters.length > 0) {
            this._document.setCurrentChapter(this.chapters[0].id);
            let iterator = 0;
            this.chapters.forEach((item) => {
                iterator++;
                this.chapterDivs += `<chapter-unit data-chapter-number="${iterator}" data-chapter-title="${item.title}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openChapterTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-chapter-title/${webSkel.space.currentChapterId}`);
    }

    openChapterBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/chapter-brainstorming/${webSkel.space.currentChapterId}`);
    }

    openParagraphProofreadPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/paragraph-proofread/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    openParagraphBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/paragraph-brainstorming/${webSkel.space.currentChapterId}/${webSkel.space.currentParagraphId}`);
    }

    async addChapter() {
        const crypto = require("opendsu").loadAPI("crypto");
        this.chapterDivs += `<chapter-unit data-chapter-title="New Chapter" data-chapter-id="${this.chapters.length}" data-presenter="chapter-unit"></chapter-unit>`;
        let chapterObj= {
            title: "New Chapter",
            id: crypto.getRandomSecret(16).toString().split(",").join(""),
            paragraphs: [{id: crypto.getRandomSecret(16).toString().split(",").join(""), text: "Edit your paragraph here"}]
        }
        this._document.addChapter(chapterObj);
        await documentFactory.storeDocument(currentSpaceId, this._document);
        this.invalidate();
    }

    afterRender() {
        let chapterSidebar = document.getElementById("chapter-sidebar");
        if(chapterSidebar) {
            document.addEventListener("click", (event) => {
                chapterSidebar.style.display = "none";
                let selectedChapter = document.getElementById("select-chapter-visualise");
                if(selectedChapter) {
                    document.getElementById("select-chapter-visualise").removeAttribute("id");
                }
            }, true);
        }
    }

}