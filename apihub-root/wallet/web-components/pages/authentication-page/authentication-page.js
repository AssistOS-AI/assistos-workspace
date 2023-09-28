import {extractFormInformation} from "../../../imports.js";

export class authenticationPage {
    constructor(element) {
        this.element = element;
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }

    }

    beforeRender() {
      switch (this.element.getAttribute("data-subpage")){
          case "register-page":{
              this.subpage = ` <div>
             <div class="form-title">
             Registration
             </div>
             <form>
                    <div class="form-item">
                        <label class="form-label" for="user-name">Name</label>
                        <input class="form-input" name="name" data-id="user-name" type="text" id="user-name" required placeholder="Add name">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-email">E-mail</label>
                        <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" required placeholder="Add e-mail">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-phone">Phone</label>
                        <input class="form-input" name="phone" data-id="user-phone" type="text" id="user-phone" required
                            placeholder="Add phone">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-password">Password</label>
                        <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="Add password">
                    </div>
                    <div class="form-footer">
                        <button class="wide-btn" data-local-action="beginRegistration">Sign Up</button>
                    </div>
                </form>
           </div>`;
              break;
          }
          case "login-page":{
              this.subpage = `
               <div>
                  <div class="form-title">
                      Log in
                  </div>
                  <form>
                      <div class="form-item">
                          <label class="form-label" for="user-email">E-mail</label>
                          <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" required placeholder="Add e-mail">
                      </div>
                      <div class="form-item">
                          <label class="form-label" for="user-password">Password</label>
                          <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="Add password">
                      </div>
                      <div class="forgot-password" data-local-action="navigateToPasswordRecoveryPage">
                          Forgot password?
                      </div>
                      <div class="form-footer">
                          <button class="wide-btn" data-action="beginLogin">Log in</button>
                      </div>
                      <div class="suggest-registration">
                          <div>
                              Don't have an account?
                          </div>
                          <div class="sign-up" data-action="navigateToRegisterPage">
                              Sign Up
                          </div>
                      </div>
                  </form>
              </div>
          `;
              break;
          }
          case "register-confirmation":{
              this.subpage = `
              <div>
                  <div class="form-title">
                   Registration
                  </div>
                  <form>
                   <div class="form-item">
                        <label class="form-label" for="user-token">Enter the secret token or just click the link we just sent you by email.</label>
                        <input class="form-input" name="token" type="text" data-email="user-token" id="user-token" required placeholder="Add secret token">
                    </div>
                    <div class="form-footer">
                        <button class="wide-btn" data-action="verifyConfirmationLink">Log in</button>
                    </div>
                    <div class="development-mode" data-local-action="navigateToLandingPage">
                        Log in development mode
                    </div>        
                </form>
              </div>`;
              break;
          }
          case "password-recovery":{
              this.subpage =`
              <div>
                  <div class="form-title">
                   Password Recovery
                  </div>
                  <div class="form-description">
                  Before you introduce your email and new password, we will send you a verification link on your email.
                  </div>
                  <form>
                   <div class="form-item">
                        <label class="form-label" for="user-email">E-mail</label>
                        <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" required placeholder="Add e-mail">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-password">New Password</label>
                        <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="Add new password">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-password-confirm">Confirm new Password</label>
                        <input class="form-input" name="password-confirm" type="password" data-condition="checkPasswordConfirmation" data-id="user-password-confirm" id="user-password-confirm" required placeholder="Confirm new password">
                    </div>
                    <div class="form-footer">
                        <button class="wide-btn" data-local-action="beginPasswordRecovery">Set New Password</button>
                    </div>
                </form>
              </div>`;
              break;
          }
          case "password-recovery-confirmation":{
              this.subpage =`
              <div>
                  <div class="form-title">
                   Password Recovery
                  </div>
                  <form>
                   <div class="form-item">
                        <label class="form-label" for="user-token">Enter the secret token or just click the link we just sent you by email.</label>
                        <input class="form-input" name="token" type="text" data-id="user-token" id="user-token" required placeholder="Add secret token">
                    </div>
                    <div class="form-footer">
                        <button class="wide-btn" data-local-action="verifyConfirmationLink">Log in</button>
                    </div>
                    <div class="development-mode" data-local-action="finishPasswordRecovery">
                        Log in development mode
                    </div>        
                </form>
              </div>`;
              break;
          }
      }
    }

    async beginRegistration(_target){
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {

            //const didDocument = await $$.promisify(w3cDID.createIdentity)("key", undefined, randomNr);
            let result = await webSkel.getService("AuthenticationService").createUser(formInfo.data);
            if(result){
                webSkel.getService("AuthenticationService").addCachedUser(result);
                this.element.setAttribute("data-subpage", "register-confirmation");
            }else {
                console.error("Failed to create user");
            }
        } else {
            console.error("Form invalid");
        }
    }

    async beginLogin(_target){
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            const userObj = await webSkel.getService("AuthenticationService").getStoredUserByEmail(formInfo.data.email);
            if(typeof userObj === "string") {
                console.error(`Incorrect email: + ${userObj}`);
            } else {
                const userId = userObj.userId;

                let users = webSkel.getService("AuthenticationService").getCachedUsers();
                if(users) {
                    users.forEach((user)=> {
                        if(user.userId === userId) {
                            let secretToken = user.secretToken;
                            if(webSkel.getService("AuthenticationService").verifyPassword(secretToken, formInfo.data.password)) {

                                webSkel.getService("AuthenticationService").setCachedCurrentUser({ userId: userId, secretToken: secretToken });

                                window.location = "";
                                return "";
                            } else {
                                console.error("Incorrect password");
                            }
                        }
                    });
                }
                console.log(`First time logging in on this device userId: ${JSON.stringify(userId)}`);

                const result = await webSkel.getService("AuthenticationService").getStoredUser(userId);
                if(webSkel.getService("AuthenticationService").verifyPassword(result.secretToken, formInfo.data.password)) {
                    let user = { userId: userId, secretToken: result.secretToken};

                    webSkel.getService("AuthenticationService").addCachedUser(user);
                    webSkel.getService("AuthenticationService").setCachedCurrentUser(user);
                    await webSkel.changeToStaticPage(`accounting/login-new-device`);
                }
            }
        }
    }
    navigateToPasswordRecoveryPage(){
        this.element.setAttribute("data-subpage", "password-recovery");
    }
    async beginPasswordRecovery(_target){
        const checkPasswordConfirmation = ()=>{
            let password = document.querySelector("#password");
            let confirmPassword = document.querySelector("#confirm-password");
            return password.value === confirmPassword.value;
        }


        const conditions = {"checkPasswordConfirmation": checkPasswordConfirmation };
        const formInfo = await extractFormInformation(_target, conditions);
        if (formInfo.isValid) {
            const user = await webSkel.getService("AuthenticationService").getStoredUserByEmail(formInfo.data.email);
            if (typeof user === "string") {
                console.error(`Incorrect email: + ${user}`);
            } else {
                currentUser.userId = user.userId;
                const randomNr = crypto.generateRandom(32);
                user.temporarySecretToken = crypto.encrypt(randomNr, crypto.deriveEncryptionKey(formInfo.data.password));
                const result = await webSkel.getService("AuthenticationService").updateStoredUser(user);
                if(typeof result === "string") {
                    console.log(result);
                } else {
                    this.element.setAttribute("data-subpage", "password-recovery-confirmation");
                }
            }
        }

    }
    async finishPasswordRecovery(){
         const user = await webSkel.getService("AuthenticationService").getStoredUser(currentUser.userId);
         user.secretToken = user.temporarySecretToken;
         delete user.temporarySecretToken;
         const result = await webSkel.getService("AuthenticationService").updateStoredUser(user);
         if(typeof result === "string") {
             console.error(result);
         }
         window.location = "";
    }
    navigateToLandingPage(){
        window.location = "";
    }

    verifyConfirmationLink(){
        console.log("link verified!");
    }
}