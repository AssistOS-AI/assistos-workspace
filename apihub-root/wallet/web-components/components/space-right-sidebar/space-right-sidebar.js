export class spaceRightSidebar {
    constructor(element,invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {

    }

    async navigateToAgentPage(){
        await webSkel.changeToDynamicPage("agent-page", "agent-page");
    }
    async navigateToAnnouncementsPage(){
        await webSkel.changeToDynamicPage("announcements-page", "announcements-page");
    }
    async navigateToPersonalitiesPage(){
        await webSkel.changeToDynamicPage("personalities-page", "personalities-page");
    }
    async navigateToFlowsPage(){
        await webSkel.changeToDynamicPage("flows-page", "flows-page");
    }
    async navigateToKnowledgePage(){
        await webSkel.changeToDynamicPage("knowledge-page", "knowledge-page");
    }
    async navigateToTasksPage(){
        await webSkel.changeToDynamicPage("tasks-page", "tasks-page");
    }
    async navigateToCollaboratorsPage(){
        await webSkel.changeToDynamicPage("collaborators-page", "collaborators-page");
    }
    async navigateToMyWebPage(){
        await webSkel.changeToDynamicPage("my-web-page", "my-web-page");
    }
    async navigateToSettingsPage(){
        await webSkel.changeToDynamicPage("settings-page", "settings-page");
    }
}