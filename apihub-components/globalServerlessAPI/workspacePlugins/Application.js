const path = require("path");
const fsPromises = require("fs").promises;
const git = require("../../apihub-component-utils/git.js");
async function Application() {
    let self = {};
    let persistence = $$.loadPlugin("DefaultPersistence");

    self.getApplicationPath = function (appName) {
        let apps = self.getAvailableApps();
        let app = apps.find(app => app.name === appName);
        if(!app){
            //is not a default app
            return path.join(process.env.SERVERLESS_ROOT_FOLDER, `applications`, appName);
        }
        if(app.systemApp) {
            return path.join(process.env.SERVERLESS_ROOT_FOLDER, `../../systemApps/${appName}`);
        }
        return path.join(process.env.SERVERLESS_ROOT_FOLDER, `applications`, appName);
    }

    self.getApplicationManifestPath = function (applicationName) {
        return path.join(self.getApplicationPath(applicationName), "manifest.json");
    }


    self.getAvailableApps = function () {
        return require("../applications.json");
    }

    self.updateApplication = async function (appName) {
        const app = self.getAvailableApps().find(app => app.name === appName);
        if (!app) {
            throw new Error("Application not Found");
        }
        const applicationPath = self.getApplicationPath(appName);
        const applicationNeedsUpdate = await git.checkForUpdates(applicationPath, app.repository);
        if (applicationNeedsUpdate) {
            await git.updateRepo(applicationPath);
        } else {
            throw new Error("No updates available");
        }
    }

    self.requiresUpdate = async function (spaceId, appName) {
        const app = self.getAvailableApps().find(app => app.name === appName);
        if (!app) {
            throw new Error("Application not Found");
        }
        const applicationPath = self.getApplicationPath(appName);
        return await git.checkForUpdates(applicationPath, app.repository);
    }

    self.getApplicationManifest = async function (applicationName) {
        const manifestPath = self.getApplicationManifestPath(applicationName);
        let manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
        let manifest = JSON.parse(manifestContent);
        if(manifest.skipUI){
            manifest.webComponents = [];
            return manifest;
        }
        let webComponentsPath = path.join(self.getApplicationPath(applicationName), "web-components");
        let webComponentsDir = await fsPromises.readdir(webComponentsPath);
        const componentPromises = webComponentsDir.map(async (componentName) => {
            const htmlPath = path.join(webComponentsPath, componentName, `${componentName}.html`);
            const cssPath = path.join(webComponentsPath, componentName, `${componentName}.css`);
            const jsPath  = path.join(webComponentsPath, componentName, `${componentName}.js`);

            // check html + css first
            try {
                await Promise.all([
                    fsPromises.access(htmlPath),
                    fsPromises.access(cssPath)
                ]);
            } catch (e) {
                return {
                    name: componentName,
                    error: "Failed to access component files: " + e.message,
                };
            }
            try {
                await fsPromises.access(jsPath);
            } catch {
                return; // no presenter, skip
            }

            let presenterClassName;
            try {
                const code = await fsPromises.readFile(jsPath, "utf8");
                let match = code.match(/export\s+class\s+([A-Za-z0-9_]+)/);
                if (match) {
                    presenterClassName = match[1];
                }
            } catch (e) {
                return {
                    name: componentName,
                    error: "Failed to read presenter: " + e.message,
                };
            }

            return {
                name: componentName,
                presenterClassName,
            };
        });
        manifest.webComponents = await Promise.all(componentPromises);
        return manifest;
    }

    self.installApplication = async function (name) {
        const applications = self.getAvailableApps();
        const application = applications.find(app => app.name === name);
        if (!application) {
            throw new Error("Application not Found");
        }
        const applicationFolderPath = self.getApplicationPath(application.name);

        try {
            await git.clone(application.repository, applicationFolderPath);
        } catch (error) {
            if (error.message.includes("already exists and is not an empty directory")) {
                try {
                    await fsPromises.rm(applicationFolderPath, {recursive: true, force: true});
                } catch (e) {
                    //multiple users
                }
            }
            throw new Error("Failed to clone application repository " + error.message);
        }
        const manifestPath = self.getApplicationManifestPath(application.name);
        let manifestContent, manifest;
        try {
            manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
            manifest = JSON.parse(manifestContent);
        } catch (error) {
            throw new Error("Failed to read or parse Application manifest", error);
        }

        application.lastUpdate = await git.getLastCommitDate(applicationFolderPath);
        await git.installDependencies(manifest.dependencies);
        if (manifest.objects) {
            for (const [type, value] of Object.entries(manifest.objects)) {
                const Type = type.charAt(0).toUpperCase() + type.slice(1);
                const fn = persistence[`create${Type}`];

                if (Array.isArray(value)) {
                    for (const item of value) {
                        await fn(item);
                    }
                } else {
                    await fn(value);
                }
            }
        }
    }

    self.getApplications = async function () {
        let installedApps = [];
        let apssDirs = await fsPromises.readdir(path.join(process.env.SERVERLESS_ROOT_FOLDER, `applications`));
        for(let appName of apssDirs){
            let manifest = await fsPromises.readFile(path.join(process.env.SERVERLESS_ROOT_FOLDER, `applications`, appName, "manifest.json"), 'utf8');
            manifest = JSON.parse(manifest);
            let appIcon;
            try {
                appIcon = await fsPromises.readFile(path.join(process.env.SERVERLESS_ROOT_FOLDER, `applications`, appName, "app.svg"), 'utf8');
            } catch (e) {
                //no icon
            }
            installedApps.push({
                name: appName,
                skipUI: manifest.skipUI,
                svg: appIcon,
            })
        }
        return installedApps;
    }

    self.uninstallApplication = async function (appName) {
        const applications = self.getAvailableApps();
        const application = applications.find(app => app.name === appName);
        const manifestPath = self.getApplicationManifestPath(application.name);
        let manifestContent = JSON.parse(await fsPromises.readFile(manifestPath, 'utf8'));
        await git.uninstallDependencies(manifestContent.dependencies);
        await fsPromises.rm(self.getApplicationPath(appName), {recursive: true, force: true});
    }

    self.getApplicationsPlugins = async function (spaceId) {
        let applications = await persistence.getEveryApplicationObject();
        let plugins = {};
        for (let app of applications) {
            let manifest = await self.loadApplicationConfig(spaceId, app.name);
            if (!manifest.plugins) {
                continue;
            }
            for (let pluginType of Object.keys(manifest.plugins)) {
                if (!plugins[pluginType]) {
                    plugins[pluginType] = [];
                }
                for (let plugin of manifest.plugins[pluginType]) {
                    plugin.applicationId = app.name;
                }
                plugins[pluginType] = plugins[pluginType].concat(manifest.plugins[pluginType]);
            }
        }
        return plugins;
    }

    return self;
}

let singletonInstance;
module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await Application();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (id, name, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return ["Workspace", "DefaultPersistence"];
    }
}

