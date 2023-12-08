export class spaceRightSidebar {
    constructor(element,invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {

    }

    async navigateToAgentPage(){
        await webSkel.changeToDynamicPage("agent-page", "space/agent-page");
    }
    async navigateToAnnouncementsPage(){
        await webSkel.changeToDynamicPage("announcements-page", "space/announcements-page");
    }
    async navigateToPersonalitiesPage(){
        await webSkel.changeToDynamicPage("personalities-page", "space/personalities-page");
    }
    async navigateToFlowsPage(){
        await webSkel.changeToDynamicPage("flows-page", "space/flows-page");
    }
    async navigateToKnowledgePage(){
        await webSkel.changeToDynamicPage("knowledge-page", "space/knowledge-page");
    }
    async navigateToTasksPage(){
        await webSkel.changeToDynamicPage("tasks-page", "space/tasks-page");
    }
    async navigateToCollaboratorsPage(){
        await webSkel.changeToDynamicPage("collaborators-page", "space/collaborators-page");
    }
    async navigateToSettingsPage(){
        await webSkel.changeToDynamicPage("settings-page", "space/settings-page");
    }
    async navigateToApplicationsMarketplacePage(){
        await webSkel.changeToDynamicPage("applications-marketplace-page", "space/applications-marketplace-page");
    }
}