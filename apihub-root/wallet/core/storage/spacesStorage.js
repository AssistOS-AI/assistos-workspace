async function addSpace(spaceName, apiKey, spaceObject) {
    const headers = {
        "Content-Type": "application/json; charset=UTF-8",
        "apikey": `${apiKey}`,
    };
    const options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(spaceObject)
    };
    const response = await fetch(`/spaces/${spaceName}`, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
}

async function createSpace(spaceName, apiKey) {
    const headers = {
        "Content-Type": "application/json; charset=UTF-8",
    };
    if (apiKey) {
        headers.apikey = apiKey
    }
    const bodyObject = {spaceName: spaceName}
    const options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(bodyObject)
    };
    const response = await fetch(`/spaces`, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
    }

    return (await response.json()).data;
}
async function loadSpace(spaceId) {
    const headers = {
        "Content-Type": "application/json; charset=UTF-8",
    };
    const options = {
        method: "GET",
        headers: headers,
    };

    let requestURL= spaceId?`/spaces/${spaceId}`:`/spaces`;

    const response = await fetch(requestURL, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
    }

    return (await response.json()).data;

}
async function storeSpace(spaceId, jsonData = null, apiKey = null, userId = null) {
    let headers = {
        "Content-type": "application/json; charset=UTF-8"
    };
    if (apiKey) {
        headers["apikey"] = `${apiKey}`;
        headers["initiatorid"] = `${userId}`;
    }

    let options = {
        method: "PUT",
        headers: headers,
        body: jsonData
    };
    let response = await fetch(`/spaces/${spaceId}`, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
}

async function deleteSpace(spaceId) {

}

async function addKeyToSpace(spaceId, userId, keyType, apiKey) {
    let result;
    let headers = {
        "Content-type": "application/json; charset=UTF-8"
    };
    if (apiKey) {
        headers["apikey"] = `${apiKey}`;
        headers["initiatorid"] = `${userId}`;
    }
    try {
        result = await fetch(`/spaces/${spaceId}/secrets`,
            {
                method: "POST",
                headers: headers
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
async function loadObject(spaceId, objectType, objectName) {
    const result = await fetch(`/spaces/${spaceId}/${objectType}/${objectName}`,
        {
            method: "GET"
        });
    return await result.text();
}

async function storeObject(spaceId, objectType, objectName, jsonData) {
    let result;
    try {
        result = await fetch(`/spaces/${spaceId}/${objectType}/${objectName}`,
            {
                method: "PUT",
                body: jsonData,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
export default {addSpace, createSpace, loadSpace, deleteSpace, storeSpace, addKeyToSpace, loadObject, storeObject};