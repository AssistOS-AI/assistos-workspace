const logger = $$.getLogger("accounting", "apihub-components");
async function getAccountingPage(request, response)
{
    const action  = request.params;
    let content=``;
    switch (action.action){
        case "register": content= getRegisterPage();
        break;
        case "register-confirmation" : content = getRegisterConfirmationPage();
        break;
        case "login": content = getLoginPage();
        break;
        case "login-new-device": content = getLoginNewDevicePage();
        break;
        case "password-recovery": content = getPasswordRecoveryPage();
        break;
        case "password-recovery-confirmation": content = getPasswordRecoveryConfirmationPage();
        break;
        default : console.error("The page you are trying to access doesn't exist");
        break;
    }
    let template=`<link rel="stylesheet" href="./wallet/components/authentication/authentication.css">
          <div class="content-container">
          <div class="img-container"> 
            <img src="./wallet/assets/icons/accounting.svg" alt="">
           </div>
          <div class="form-container">
                    <div class="logo-container">LOGO APP</div>
                ${content}            
           </div>        
       </div>`;
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(template);
    response.end();
}

const getRegisterPage = function (){
 return `
           <div>
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
                        <button class="wide-btn" data-action="beginRegistration">Sign Up</button>
                    </div>
                </form>
           </div>
                
`;
}

const getRegisterConfirmationPage = function (){
    return `
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
                        <button class="wide-btn" data-action="createUser">Log in</button>
                    </div>
                    <div class="development-mode" data-action="navigateToLandingPage">
                        Log in development mode
                    </div>        
                </form>
              </div>
                
 `;
}

const getLoginPage = function (){
    return `
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
                    <div class="forgot-password" data-action="navigateToPasswordRecoveryPage">
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
}

const getLoginNewDevicePage= function (){
    return `
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
                        <button class="wide-btn" data-action="createUser">Log in</button>
                    </div>
                    <div class="development-mode" data-action="navigateToLandingPage">
                        Log in development mode
                    </div>        
                </form>
              </div>
                
 `;
}
const getPasswordRecoveryPage = function (){
    return `
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
                        <input class="form-input" name="password-confirm" type="password" data-id="user-password-confirm" id="user-password-confirm" required placeholder="Confirm new password">
                    </div>
                    <div class="form-footer">
                        <button class="wide-btn" data-action="beginPasswordRecovery">Set New Password</button>
                    </div>
                </form>
              </div>
                
 `;
}

const getPasswordRecoveryConfirmationPage = function (){
    return `
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
                        <button class="wide-btn" data-action="createUser">Log in</button>
                    </div>
                    <div class="development-mode" data-action="finishPasswordRecovery">
                        Log in development mode
                    </div>        
                </form>
              </div>
                
 `;
}
module.exports = {
    getAccountingPage,
};