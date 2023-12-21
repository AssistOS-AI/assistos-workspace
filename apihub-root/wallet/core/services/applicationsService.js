export class ApplicationsService {
    constructor() {}

    async installApplication(appName){
        await storageManager.installApplication(webSkel.currentUser.space.id, appName);
    }
    async uninstallApplication(appName){
        await storageManager.uninstallApplication(webSkel.currentUser.space.id, appName);
        await webSkel.currentUser.space.deleteApplication(appName);
    }

   async reinstallApplication(appName){
        await this.uninstallApplication(appName);
        await this.installApplication(appName);
   }
}
