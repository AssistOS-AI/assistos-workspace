export class spaceRightSidebar {
    constructor(element,invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {

    }

    async navigateToAgentPage(){
        await webSkel.changeToDynamicPage("agent-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/agent-page`);
    }
    async navigateToAnnouncementsPage(){
        await webSkel.changeToDynamicPage("announcements-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/announcements-page`);
    }
    async navigateToPersonalitiesPage(){
        await webSkel.changeToDynamicPage("personalities-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/personalities-page`);
    }
    async navigateToFlowsPage(){
        await webSkel.changeToDynamicPage("flows-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/flows-page`);
    }
    async navigateToKnowledgePage(){
        await webSkel.changeToDynamicPage("knowledge-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/knowledge-page`);
    }
    async navigateToTasksPage(){
        await webSkel.changeToDynamicPage("tasks-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/tasks-page`);
    }
    async navigateToCollaboratorsPage(){
        await webSkel.changeToDynamicPage("collaborators-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/collaborators-page`);
    }
    async navigateToSettingsPage(){
        await webSkel.changeToDynamicPage("settings-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/settings-page`);
    }
    async navigateToApplicationsMarketplacePage(){
        await webSkel.changeToDynamicPage("applications-marketplace-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/applications-marketplace-page`);
    }
}