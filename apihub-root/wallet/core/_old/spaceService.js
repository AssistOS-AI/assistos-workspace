export class spaceService {
    constructor() {

    }

    // async addSpace(title) {
    //     let currentDate = new Date();
    //     let today = currentDate.toISOString().split('T')[0];
    //     let textString = "Space " + title + " was successfully created. You can now add documents, users and settings to your space.";
    //     let newAnnouncements = [{
    //         id: 1,
    //         title: "Welcome to AIAuthor!",
    //         text: textString,
    //         date: today
    //     }];
    //     this.changeSpace(await webSkel.localStorage.addSpace({
    //         name: title, documents: [], personalities: [], admins: [], settings: {llms: [], personalities: []}, announcements: newAnnouncements, users: []}
    //     ));
    // }
    //
    // changeSpace(spaceId) {
    //     window.currentSpaceId = spaceId;
    //     let user = JSON.parse(localStorage.getItem("currentUser"));
    //     user.currentSpaceId = currentSpaceId;
    //     localStorage.setItem("currentUser", JSON.stringify(user));
    //     // let docService = webSkel.getService('documentService');
    //     // docService.getAllDocuments().forEach((doc) => {
    //     //     doc.observeChange(()=>{});
    //     // });
    //     window.location = "";
    // }
    //
    // getSpaceNames() {
    //     return currentUser.spaces.filter(space => space.id !== currentSpaceId) || [];
    // }
    //
    // deleteSpace() {
    //
    // }
}