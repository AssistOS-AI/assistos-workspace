async function installApplication(spaceId, applicationId) {
    let result;
    try {
        result = await fetch(`/space/${spaceId}/applications/${applicationId}`,
            {
                method: "POST",
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return {response: await result.text(), status: result.status};
}

async function getApplicationConfigs(spaceId, appId) {

    let result;
    try {
        result = await fetch(`/space/${spaceId}/applications/${appId}/configs`,
            {
                method: "GET"
            });
    } catch (err) {
        console.error(err);
    }
    return await result.json();
}

async function getApplicationFile(spaceId, appId, relativeAppFilePath) {
    const pathParts = relativeAppFilePath.split(".")
    const type = pathParts[pathParts.length - 1] || "";
    if (type !== "js") {
        let result;
        try {
            result = await fetch(`/app/${spaceId}/applications/${appId}/file/${relativeAppFilePath}`,
                {
                    method: "GET",
                });
        } catch (err) {
            console.error(err);
        }
        return result;
    } else {
        return await import(`/app/${spaceId}/applications/${appId}/file/${relativeAppFilePath}`);
    }
}
async function storeAppObject(appName, objectType, objectId, stringData) {
    objectId = encodeURIComponent(objectId);
    let result;
    try {
        result = await fetch(`/app/${system.space.id}/applications/${appName}/${objectType}/${objectId}`,
            {
                method: "PUT",
                body: stringData,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}

async function loadAppObjects(appName, objectType) {
    let result;
    try {
        result = await fetch(`/app/${system.space.id}/applications/${appName}/${objectType}`,
            {
                method: "GET"
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}

async function uninstallApplication(spaceId, appName) {
    let result;
    try {
        result = await fetch(`/space/${spaceId}/applications/${appName}`,
            {
                method: "DELETE",
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return {response: await result.text(), status: result.status};
}

export default {installApplication, getApplicationConfigs, getApplicationFile, storeAppObject, loadAppObjects, uninstallApplication};