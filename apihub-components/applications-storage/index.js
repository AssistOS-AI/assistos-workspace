const Application = require("./controller.js");

const bodyReader=require("../apihub-component-middlewares/bodyReader.js");
const authentication=require("../apihub-component-middlewares/authentication.js");

function ApplicationsStorage(server) {
    server.use("/applications/*", authentication);
    server.use("/applications/*", bodyReader);

    server.get("/applications/plugins/:spaceId", Application.getApplicationsPlugins);
    server.get("/applications/config/:spaceId/:applicationId", Application.loadApplicationConfig);
    server.get("/applications/metadata/:spaceId", Application.loadApplicationsMetadata);

    server.post("/applications/:spaceId/:applicationId", Application.installApplication);
    server.delete("/applications/:spaceId/:applicationId", Application.uninstallApplication);

    server.get("/applications/files/:spaceId/:applicationId/*", Application.loadApplicationFile);
    server.get("/applications/updates/:spaceId/:applicationId", Application.requiresUpdate);

    server.get("/app/:spaceId/applications/:appName/:objectType", Application.loadObjects);

    server.get("/applications/tasks/:spaceId/:applicationId", Application.getApplicationTasks);
    server.post("/applications/tasks/:spaceId/:applicationId/:taskName", Application.runApplicationTask);
    server.post("/applications/flows/:spaceId/:applicationId/:flowId", Application.runApplicationFlow);
    server.get("/space/:spaceId/applications/widgets", Application.getWidgets);
    server.put("/app/:spaceId/applications/:applicationId/:objectType/:objectId", Application.storeObject);
    server.put("/space/:spaceId/applications/:applicationId/:objectType/:objectId", Application.storeObject);
    server.put("/applications/updates/:spaceId/:applicationId", Application.updateApplication);

    server.get("/app/:spaceId/applications/:applicationId", Application.loadAppFlows);
    server.put("/app/:spaceId/applications/:applicationId/:objectId", Application.storeAppFlow);
}

module.exports = ApplicationsStorage;
