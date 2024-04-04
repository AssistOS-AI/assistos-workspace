async function registerUser(name, email, password) {
    const headers = {
        "Content-Type": "application/json; charset=UTF-8",
    };
    const options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    };
    const response = await fetch(`/users`, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
    }

    return await response.json();
}
async function activateUser(activationToken) {
    const headers = {
        "Content-Type": "application/json; charset=UTF-8",
    };
    const options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            activationToken: activationToken
        })
    };
    const response = await fetch(`/users/verify`, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
    }

    return await response.json();
}
async function loginUser(email,password) {
    const headers = {
        "Content-Type": "application/json; charset=UTF-8",
    };
    const options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            email: email,
            password: password
        })
    };
    const response = await fetch(`/users/login`, options);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
    }

    return await response.json();
}

async function loadUser() {
    const response = await fetch(`/users`,
        {
            method: "GET"
        });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
    }
    return (await response.json()).data;
}
async function logoutUser(){
    const response = await fetch(`/users/logout`,
        {
            method: "POST"
        });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
    }
    return (await response.json()).data;
}
async function storeUser(userId, jsonData) {
    let result = await fetch(`/users/${userId}`,
        {
            method: "PUT",
            body: jsonData,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });

    return await result.text();
}

async function loadUserByEmail(email) {
    const result = await fetch(`/users/email`,
        {
            method: "PUT",
            body: email,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });
    return await result.text();
}

async function storeGITCredentials(spaceId, userId, stringData) {
    let result;
    try {
        result = await fetch(`/users/${spaceId}/${userId}/secret`,
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

async function getUsersSecretsExist(spaceId) {
    let result;
    try {
        result = await fetch(`/users/${spaceId}/secrets`,
            {
                method: "GET"
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
async function deleteKey(spaceId, keyType, keyId) {
    let result;
    try {
        result = await fetch(`/users/${spaceId}/secrets/${keyType}/${keyId}`,
            {
                method: "DELETE"
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
export default {registerUser, activateUser, loginUser, loadUser, logoutUser, storeUser, loadUserByEmail, storeGITCredentials, getUsersSecretsExist, deleteKey};
