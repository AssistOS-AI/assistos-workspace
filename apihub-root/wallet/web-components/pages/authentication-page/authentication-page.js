export class authenticationSection {
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
                        <button class="wide-btn" data-action="beginRegistration">Sign Up</button>
                    </div>
                </form>
           </div>`;
          }
      }
    }

}