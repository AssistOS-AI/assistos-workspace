import {extractFormInformation} from "../../../imports.js";

export class AuthenticationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();

        this.rotations = 0;
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
                        <button type="button" class="general-button" data-local-action="beginRegistration">Sign Up</button>
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
                        <button class="general-button" data-local-action="verifyConfirmationLink">Log in</button>
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
                        <button type="button" class="general-button" data-local-action="verifyConfirmationLink">Log in</button>
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
                        <button type="button" class="general-button" data-local-action="beginPasswordRecovery">Set New Password</button>
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
                        <button type="button" class="general-button" data-local-action="finishPasswordRecovery">Log in</button>
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
                          <button type="button" class="general-button" data-local-action="beginLogin">Log in</button>
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

    sendFormOnEnter(event){
        if(event.key === "Enter"){
            event.preventDefault();
            this.element.querySelector(".general-button").click();
        }
    }
    afterRender(){
        this.carousel = this.element.querySelector(".images");
        this.dots = this.element.querySelectorAll(".dot");
        setTimeout(async()=>{
           await this.startSlideshow(0);
        });
        let inputs = this.element.querySelectorAll("input");
        this.lastInput = inputs[inputs.length-1];
        this.lastInput.removeEventListener("keypress", this.boundFn);
        this.boundFn = this.sendFormOnEnter.bind(this);
        this.lastInput.addEventListener("keypress", this.boundFn);
    }

    async startSlideshow(milliseconds){
        const delay = ms => new Promise(res => setTimeout(res, ms));
        await delay(milliseconds);
        this.intervalId = setInterval(this.nextImage.bind(this, "", -1),3000);
    }
    async setCurrentImage(_target, position){
        clearInterval(this.intervalId);
        this.dots.forEach((dot)=>{
            dot.classList.remove("active");
        });
        _target.classList.add("active");
        if(position === "1"){
            this.rotations = 0;
            this.carousel.style.transform = "translateX(0%)"
        }else if(position === "2"){
            this.rotations = -33;
            this.carousel.style.transform = "translateX(-33%)"
        }else {
            this.rotations = -66;
            this.carousel.style.transform = "translateX(-66%)"
        }
    }

    nextImage(_target, direction, stop){
        if(stop){
            clearInterval(this.intervalId);
        }
        this.dots.forEach((dot)=>{
            dot.classList.remove("active");
        });
        this.rotations += parseInt(direction)* 33;
        if(this.rotations < -67){
            this.rotations = 0;
        }
        if(this.rotations > 1)
        {
            this.rotations = -66;
        }
        this.carousel.style.transform = `translateX(${this.rotations}%)`;
        if(this.rotations === 0){
            this.dots[0].classList.add("active");
        }else if(this.rotations === -33){
            this.dots[1].classList.add("active");
        }else {
            this.dots[2].classList.add("active");
        }
    }
    async navigateToRegisterPage(){
        await system.UI.changeToDynamicPage("authentication-page", "authentication-page",{subpage:"register-page"});
    }

    async navigateToLoginPage(){
        await system.UI.changeToDynamicPage("authentication-page", "authentication-page",{subpage:"login-page"});
    }

    async loginDefaultUser(){
        let currentUserId = "5jURBE8WE3YH";
        let currentUser = JSON.parse(await system.storage.loadUser(currentUserId));
        /* incarcare json user de pe server*/
        let users = system.services.getCachedUsers();
        /* incarcare users din localstorage */
        let userObj;
        try {
            //* users present in local storage -> default login
            users = JSON.parse(users);
            /* daca se gaseste id-ul userului default */
            if(users.find(user => user.id === currentUser.id)){
                await system.services.loginUser("teo@teo", "teo");
            }else {
               throw new Error("user not found");
            }
        }catch (e){
            //users not present in localStorage yet or not found - > default login
            await system.services.loginFirstTimeUser("teo@teo", "teo");
            system.services.setCachedCurrentUser({id:currentUser.id,secretToken:currentUser.secretToken});
            system.services.addCachedUser({id:currentUser.id,secretToken:currentUser.secretToken});
        }
        window.location = "";
    }
    async beginRegistration(_target){
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            if(await system.services.registerUser(formInfo.data)){
                await system.UI.changeToDynamicPage("authentication-page", "authentication-page",{subpage:"register-confirmation"});
            }else{
                console.error("Failed to create user");
            }
        } else {
            console.error("Form invalid");
        }
    }
    verifyConfirmationLink(){
        system.services.verifyConfirmationLink();
        window.location = "";
    }
    async beginLogin(_target){
        const formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            if(await system.services.loginUser(formInfo.data.email, formInfo.data.password)){
                window.location = "";
            }else {
                if(await system.services.loginFirstTimeUser(formInfo.data.email, formInfo.data.password)){
                    await system.UI.changeToDynamicPage("authentication-page", "authentication-page",{subpage:"login-new-device"});
                }else {
                    alert("incorrect email or password");
                }
            }
        }
    }
    async navigateToPasswordRecoveryPage(){
        await system.UI.changeToDynamicPage("authentication-page", "authentication-page",{subpage:"password-recovery"});
    }
    async beginPasswordRecovery(_target){
        const checkPasswordConfirmation = (confirmPassword)=>{
            let password = document.querySelector("#user-password");
            return password.value === confirmPassword.value;
        }

        const conditions = {"checkPasswordConfirmation": {fn:checkPasswordConfirmation, errorMessage:"Passwords do not match!"} };
        const formInfo = await extractFormInformation(_target, conditions);
        if (formInfo.isValid) {
            if(await system.services.recoverPassword(formInfo.data.email, formInfo.data.password)){
                await system.UI.changeToDynamicPage("authentication-page", "authentication-page",{subpage:"password-recovery-confirmation"});
            }else {
                console.log("Failed to recover password");
            }
        }else {
            console.log("Form invalid");
        }

    }
    async finishPasswordRecovery(){
        if(await system.services.confirmRecoverPassword()){
            window.location = "";
        } else{
            console.error("Failed to confirm password recovery");
        }
    }

}