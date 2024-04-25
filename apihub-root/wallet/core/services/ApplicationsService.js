export class ApplicationsService {
    constructor() {
    }



    async changeApplicationLocation(appLocation, presenterParams) {
        let baseURL = `${assistOS.space.id}/${assistOS.currentApplicationName}`
        let webComponentPage = appLocation.split("/").slice(-1)[0];
        let completeURL = [baseURL, appLocation].join("/");
        await assistOS.UI.changeToDynamicPage(webComponentPage, completeURL, presenterParams)
    }

    async initialiseApplication(appName) {
    }


}
