let userModule = require("assistos").loadModule("user", {});
let spaceModule = require("assistos").loadModule("space", {});

function bufferToBase64url(buffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function base64urlToBuffer(base64urlString) {
    const base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        buffer[i] = raw.charCodeAt(i);
    }
    return buffer.buffer; // Return ArrayBuffer
}
function stringToUint8Array(str) {

    const encoder = new TextEncoder();
    return encoder.encode(str);
}

function generateChallenge(length = 32) {
    const challenge = new Uint8Array(length);
    window.crypto.getRandomValues(challenge);
    return challenge;
}

async function passKeyLogin(email, publicKeyCredentialRequestOptions, challengeKey, createSpace) {
    const requestOptions = JSON.parse(publicKeyCredentialRequestOptions);
    requestOptions.challenge = base64urlToBuffer(requestOptions.challenge);
    if (requestOptions.allowCredentials) {
        requestOptions.allowCredentials = requestOptions.allowCredentials.map(cred => ({
            ...cred,
            id: base64urlToBuffer(cred.id)
        }));
    }


    const assertion = await navigator.credentials.get({publicKey: requestOptions});

    const assertionForServer = {
        id: assertion.id,
        rawId: bufferToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
            authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
            clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
            signature: bufferToBase64url(assertion.response.signature),
            userHandle: assertion.response.userHandle ? bufferToBase64url(assertion.response.userHandle) : null,
        }
    };

    let resp = await userModule.passkeyLogin(email, assertionForServer, challengeKey);
    if (resp.operation === "success") {
        localStorage.setItem("userEmail", email);
        let spaceId;
        if(createSpace){
            let spaceName = email.split('@')[0];
            await assistOS.UI.showLoading();
            spaceId = await spaceModule.createSpace(spaceName);
            await assistOS.UI.hideLoading();
        }
        await assistOS.loadPage(email, spaceId);
    } else {
        throw new Error("Passkey authentication failed!");
    }

}

async function passKeyRegister(email, referer) {
    let passKeyConfig = await userModule.getPassKeyConfig();

    const userId = email;
    const userName = email;
    const userDisplayName = passKeyConfig.app_name;
    const challengeBuffer = generateChallenge();

    const publicKeyCredentialCreationOptions = {
        challenge: challengeBuffer,
        rp: {
            name: passKeyConfig.rp_id,
            id: passKeyConfig.rp_id,
        },
        user: {
            id: stringToUint8Array(userId),
            name: userName,
            displayName: userDisplayName,
        },
        pubKeyCredParams: [
            {type: 'public-key', alg: -7}, // ES256
            {type: 'public-key', alg: -257}, // RS256
        ],
        authenticatorSelection: {
            requireResidentKey: false,
            userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct'
    };

    const credential = await navigator.credentials.create({publicKey: publicKeyCredentialCreationOptions});
    console.log('Credential created:', credential);

    const credentialForServer = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
            attestationObject: bufferToBase64url(credential.response.attestationObject),
        },
    };
    if (credential.response.getTransports) {
        credentialForServer.response.transports = credential.response.getTransports();
    }

    let resp = await userModule.generateAuthCode(email, referer, "passkey", credentialForServer);
    if (resp.status === "success") {
        console.log("Passkey registered successfully! Logging you in automatically...");

        let userExistsResp = await userModule.userExists(email);
        if (userExistsResp.activeAuthType === "passkey" && userExistsResp.publicKeyCredentialRequestOptions) {
            await passKeyLogin(email, userExistsResp.publicKeyCredentialRequestOptions, userExistsResp.challengeKey, true);
        } else {
            await assistOS.UI.changeToDynamicPage("login-page", "login-page",{"authtype": "login", email});
        }
    }
}


export {
    generateChallenge,
    passKeyLogin,
    passKeyRegister
}
