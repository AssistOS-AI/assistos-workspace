import {extractFormInformation} from "../../../imports.js";

export class authenticationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
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
                        <button type="button" class="wide-btn" data-local-action="beginRegistration">Sign Up</button>
                    </div>
                </form>
           </div>`;
              break;
          }
          case "login-new-device":{
              this.subpage = `
               <div>
                  <div class="form-title">
                   Log in
                  </div>
                  <form>
                   <div class="form-item">
                        <label class="form-label" for="user-token">Enter the secret token or just click the link we just sent you by email.</label>
                        <input class="form-input" name="token" type="text" data-id="user-token" id="user-token" required placeholder="Add secret token">
                    </div>
                    <div class="form-footer">
                        <button class="wide-btn" data-local-action="verifyConfirmationLink">Log in</button>
                    </div>
                    <div class="development-mode" data-local-action="verifyConfirmationLink">
                        Log in development mode
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
                        <button type="button" class="wide-btn" data-local-action="verifyConfirmationLink">Log in</button>
                    </div>
                    <div class="development-mode" data-local-action="verifyConfirmationLink">
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
                        <button type="button" class="wide-btn" data-local-action="beginPasswordRecovery">Set New Password</button>
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
                        <button type="button" class="wide-btn" data-local-action="finishPasswordRecovery">Log in</button>
                    </div>
                    <div class="development-mode" data-local-action="finishPasswordRecovery">
                        Log in development mode
                    </div>        
                </form>
              </div>`;
              break;
          }
          default:{
              this.subpage = `
               <div>
                  <div class="form-title">
                      
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
                          <button type="button" class="wide-btn" data-local-action="beginLogin">Log in</button>
                      </div>
                      <div class="suggest-registration">
                          <div>
                              Don't have an account?
                          </div>
                          <div class="sign-up" data-local-action="navigateToRegisterPage">
                              Sign Up
                          </div>
                      </div>
                  </form>
                  <div class="development-mode" data-local-action="loginDefaultUser">
                        Log in development mode
                  </div>
              </div>
          `;
              break;
          }
      }
    }
    async navigateToRegisterPage(){
        this.element.setAttribute("data-subpage", "register-page");
        this.invalidate();
    }

    async navigateToLoginPage(){
        this.element.setAttribute("data-subpage", "login-page");
        this.invalidate();
    }

    async loginDefaultUser(){
        currentUser.id ="1101522431685742196611723790234240113112996125581292472522231319144225195232444191";
        currentUser.isPremium = true;
        currentUser.spaces = (JSON.parse(await storageManager.loadUser(currentUser.id))).spaces;
        let users = webSkel.getService("AuthenticationService").getCachedUsers();
        let userObj;
        try {
            users = JSON.parse(users);
            if(users.find(user => user.id === currentUser.id)){
                await webSkel.getService("AuthenticationService").loginUser("teo@teo", "teo");
                userObj = JSON.parse(webSkel.getService("AuthenticationService").getCachedCurrentUser());
                userObj.spaces = currentUser.spaces;
                webSkel.getService("AuthenticationService").setCachedCurrentUser(userObj);
            }else {
               throw  new Error("user not found");
            }
        }catch (e){
            //users not in localStorage yet or not found
            await webSkel.getService("AuthenticationService").loginFirstTimeUser("teo@teo", "teo");
            userObj = webSkel.getService("AuthenticationService").currentUser;
            userObj.spaces = currentUser.spaces;
            webSkel.getService("AuthenticationService").setCachedCurrentUser(userObj);
            webSkel.getService("AuthenticationService").addCachedUser(userObj);
        }

        window.location = "";
    }
    async beginRegistration(_target){
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            if(await webSkel.getService("AuthenticationService").registerUser(formInfo.data)){
                this.element.setAttribute("data-subpage", "register-confirmation");
                this.invalidate();
            }else{
                console.error("Failed to create user");
            }
        } else {
            console.error("Form invalid");
        }
    }
    verifyConfirmationLink(){
        webSkel.getService("AuthenticationService").verifyConfirmationLink();
        window.location = "";
    }
    async beginLogin(_target){
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            if(await webSkel.getService("AuthenticationService").loginUser(formInfo.data.email, formInfo.data.password)){
                window.location = "";
            }else {
                if(await webSkel.getService("AuthenticationService").loginFirstTimeUser(formInfo.data.email, formInfo.data.password)){
                    this.element.setAttribute("data-subpage", "login-new-device");
                    this.invalidate();
                }else {
                    alert("incorrect email or password");
                }
            }
        }
    }
    navigateToPasswordRecoveryPage(){
        this.element.setAttribute("data-subpage", "password-recovery");
        this.invalidate();
    }
    async beginPasswordRecovery(_target){
        const checkPasswordConfirmation = ()=>{
            let password = document.querySelector("#user-password");
            let confirmPassword = document.querySelector("#user-password-confirm");
            return password.value === confirmPassword.value;
        }

        const conditions = {"checkPasswordConfirmation": checkPasswordConfirmation };
        const formInfo = await extractFormInformation(_target, conditions);
        if (formInfo.isValid) {
            if(await webSkel.getService("AuthenticationService").recoverPassword(formInfo.data.email, formInfo.data.password)){
                this.element.setAttribute("data-subpage", "password-recovery-confirmation");
                this.invalidate();
            }else {
                console.log("Failed to recover password");
            }
        }else {
            console.log("Form invalid");
        }

    }
    async finishPasswordRecovery(){
        if(await webSkel.getService("AuthenticationService").confirmRecoverPassword()){
            window.location = "";
        } else{
            console.error("Failed to confirm password recovery");
        }
    }

}