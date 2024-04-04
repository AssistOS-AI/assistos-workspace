async function loadFlows(spaceId) {
    let result;
    try {
        result = await import(`/flows/${spaceId}`);
    } catch (err) {
        console.error(err);
    }
    return result;
}

async function storeFlow(spaceId, objectId, jsData) {
    let result;
    objectId = encodeURIComponent(objectId);
    try {
        result = await fetch(`/flows/${spaceId}/${objectId}`,
            {
                method: "PUT",
                body: jsData,
                headers: {
                    "Content-type": "application/javascript; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}

async function storeFlows(spaceId, data) {
    let result;
    try {
        result = await fetch(`/flows/${spaceId}/store/flows`,
            {
                method: "PUT",
                body: data,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}

async function loadDefaultFlows() {
    let result;
    try {
        result = await import(`/flows/default`);
    } catch (err) {
        console.error(err);
    }
    return result;
}
async function loadAppFlows(spaceId, appName) {
    let result;
    try {
        result = await import(`/flows/${spaceId}/applications/${appName}`);
    } catch (err) {
        console.error(err);
    }
    return result;
}

async function storeAppFlow(spaceId, appName, objectId, jsData) {
    let result;
    objectId = encodeURIComponent(objectId);
    try {
        result = await fetch(`/flows/${spaceId}/applications/${appName}/${objectId}`,
            {
                method: "PUT",
                body: jsData,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
export default {loadFlows, storeFlow, storeFlows, loadDefaultFlows, loadAppFlows, storeAppFlow};