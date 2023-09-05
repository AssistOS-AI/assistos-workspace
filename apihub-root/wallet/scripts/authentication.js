import {checkValidityFormInfo, extractFormInformation} from "../../WebSkel/utils/form-utils.js";
import {addUserToLocalStorage} from "../../WebSkel/utils/authentication-utils.js";

const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
const w3cDID = openDSU.loadAPI("w3cdid");
export function initUser(){

    window.currentUser = {userId:"",isPremium:false};
    const result =localStorage.getItem("currentUser");
    document.querySelector("#logout-button").style.display = "none";
    document.querySelector("#login-button").style.display = "block";
    document.querySelector("#register-button").style.display = "block";
    if(result){
        if(JSON.parse(result).secretToken!== "")
        {
            currentUser.isPremium = true;
            currentUser.userId = JSON.parse(result).userId;
            document.querySelector("#logout-button").style.display = "block";
            document.querySelector("#login-button").style.display = "none";
            document.querySelector("#register-button").style.display = "none";
        }

    }else{
        const user = {userId:crypto.getRandomSecret(32),secretToken:""};
        currentUser.id = user.userId;
        localStorage.setItem("currentUser",JSON.stringify(user));
        console.log("Instantiated currentUser" + JSON.stringify(user));
    }
}

function verifyPassword(secretToken, password){
    //secretToken should be an object with type Buffer or an Uint8Array
    if(secretToken.type === 'Buffer'){
        const uint8Array = new Uint8Array(secretToken.data.length);
        for (let i = 0; i < secretToken.data.length; i++) {
            uint8Array[i] = secretToken.data[i];
        }
        return crypto.decrypt(uint8Array, crypto.deriveEncryptionKey(password));
    }
    return  crypto.decrypt(secretToken,crypto.deriveEncryptionKey(password));
}

export function registerAccountActions(){
    webSkel.registerAction("navigateToRegisterPage", async (...params) => {
        webSkel.setDomElementForPages(mainContent);
        webSkel.changeToStaticPage(`accounting/register`);
    });

    webSkel.registerAction("beginRegistration", async (formElement,_param) => {

        const formInfo = await extractFormInformation(formElement);
        console.log(formInfo)
        if(checkValidityFormInfo(formInfo)) {
            const randomNr = crypto.generateRandom(32);
            const secretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(formInfo.data.password));
            const didDocument = await $$.promisify(w3cDID.createIdentity)("key", undefined, randomNr);
            const result = await $$.promisify(remoteEnclaveClientAccounting.callLambda)("addNewUser",
                formInfo.data.name,
                formInfo.data.email,
                formInfo.data.phone,
                "publicDescription",
                secretToken,
                didDocument.getIdentifier(),
                "isPrivate");

            console.log("Add new user command", result);
            if(typeof result !== "string"){
                addUserToLocalStorage(result);
            }

            webSkel.changeToStaticPage(`accounting/register-confirmation`);
        }
    });
    webSkel.registerAction("navigateToLoginPage", async (...params) => {
        webSkel.setDomElementForPages(mainContent);
        webSkel.changeToStaticPage(`accounting/login`);
    });

    webSkel.registerAction("beginLogin", async (formElement,_param) => {
        const formInfo = await extractFormInformation(formElement);
        //console.log(formInfo)
        
        if(checkValidityFormInfo(formInfo)) {
            const userObj = await $$.promisify(remoteEnclaveClientAccounting.callLambda)("getUserIdByEmail", formInfo.data.email);
            if(typeof userObj === "string"){
                console.error(`Incorrect email: + ${userObj}`);
            }else{
                const userId = userObj.userId;
                let users = JSON.parse(localStorage.getItem("users"));
                if(users){
                    users.forEach((user)=>{
                        if(user.userId === userId){
                            let secretToken = user.secretToken;

                            if(verifyPassword(secretToken,formInfo.data.password)){
                                webSkel.setDomElementForPages(pageContent);
                                localStorage.setItem("currentUser",JSON.stringify({userId:userId,secretToken:secretToken}));
                                window.location="";
                                return "";
                            }else {
                                console.error("Incorrect password");
                            }
                        }
                    });
                }
                console.log(`First time logging in on this device userId: ${JSON.stringify(userId)}`);
                const userSVD = await $$.promisify(remoteEnclaveClientAccounting.callLambda)("getUserSVD", userId);
                if(verifyPassword(userSVD.secretToken,formInfo.data.password)){
                    let user = {userId:userId,secretToken:userSVD.secretToken};
                    addUserToLocalStorage(user);
                    localStorage.setItem("currentUser",JSON.stringify(user));
                    webSkel.changeToStaticPage(`accounting/login-new-device`);
                }
            }
        }
    });

    webSkel.registerAction("logout", async (...params) => {
        const user = {userId:crypto.getRandomSecret(32),secretToken:""};
        localStorage.setItem("currentUser",JSON.stringify(user));
        window.location = "";
    });
    webSkel.registerAction("navigateToPasswordRecoveryPage", async (...params) => {
        webSkel.changeToStaticPage(`accounting/password-recovery`);
    });

    webSkel.registerAction("beginPasswordRecovery", async (formElement, _param) => {
        const formInfo = await extractFormInformation(formElement);

        if(checkValidityFormInfo(formInfo)) {
            const user = await $$.promisify(remoteEnclaveClientAccounting.callLambda)("getUserIdByEmail", formInfo.data.email);
            if(typeof user === "string"){
                console.error(`Incorrect email: + ${user}`);
            }else{
                currentUser.userId=user.userId;
                const randomNr = crypto.generateRandom(32);
                const temporarySecretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(formInfo.data.password));

                const result = await $$.promisify(remoteEnclaveClientAccounting.callLambda)("setTemporarySecretToken", user.userId, temporarySecretToken);
                if(result){
                    console.log(result);
                }else {
                    webSkel.changeToStaticPage(`accounting/password-recovery-confirmation`);
                }
            }
        }
    });

    webSkel.registerAction("finishPasswordRecovery", async (...params) => {

        const result = await $$.promisify(remoteEnclaveClientAccounting.callLambda)("replaceSecretToken", currentUser.userId);
        if(result){
            console.error(result);
        }
        webSkel.setDomElementForPages(pageContent);
        window.location="";
    });

    webSkel.registerAction("navigateToLandingPage", async (...params) => {
        webSkel.setDomElementForPages(pageContent);
        window.location="";
    })
}
