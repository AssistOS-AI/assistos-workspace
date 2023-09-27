const logger = $$.getLogger("accounting", "apihub-components");
async function getAccountingPage(request, response) {
    const action  = request.params;
    let content = ``;
    switch (action.action) {
        case "login-new-device": content = getLoginNewDevicePage();
        break;
        case "password-recovery": content = getPasswordRecoveryPage();
        break;
        case "password-recovery-confirmation": content = getPasswordRecoveryConfirmationPage();
        break;
        default : console.error("The page you are trying to access doesn't exist");
        break;
    }
    let template = `<link rel="stylesheet" href="./wallet/components/authentication/authentication.css">
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