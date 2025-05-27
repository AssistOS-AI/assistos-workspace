function mapServerAuthNameToUiAuthName(authName) {
    switch (authName) {
        case "emailCode":
            return "Email Code";
        case "passkey":
            return `Passkey`;
        case "totp":
            return `Authenticator App (OTP)`;
    }
}

function getLoginItems(authMethods) {
    return authMethods.map((method) => {
        if (method.type === "passkey") {
            return `<div class="underlined multi-value">
                <span class="accountDataValue">
                    ${mapServerAuthNameToUiAuthName(method.type)} ${method.name ? `(${method.name})` : ''}
                </span>
                <span>
                <img style="cursor:pointer;" src="./wallet/assets/icons/trash-can.svg" alt="delete" 
                    data-act="deleteAuth" data-auth-type="${method.type}" data-credential-id="${method.id}">
                </span>
            </div>`;
        } else {
            return `<div class="underlined multi-value">
                <span class="accountDataValue">
                    ${mapServerAuthNameToUiAuthName(method.type || method)}
                </span>
                <span>
                <img style="cursor:pointer;" src="./wallet/assets/icons/trash-can.svg" alt="delete" 
                    data-act="deleteAuth" data-auth-type="${method.type || method}">
                </span>
            </div>`;
        }
    }).join('');
}

export class MyAccountLogins {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        try {
            const authMethodsResponse = await fetch(`/auth/getAuthTypes/${encodeURIComponent(localStorage.getItem("userEmail") || '')}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!authMethodsResponse.ok) {
                throw new Error('Failed to get authentication methods');
            }

            const authData = await authMethodsResponse.json();

            if (!authData.authMethods || !Array.isArray(authData.authMethods)) {
                const userInfoResponse = await fetch('/auth/getInfo', {
                    method: 'GET',
                    credentials: 'include'
                });

                if (!userInfoResponse.ok) {
                    throw new Error('Failed to get user information');
                }

                const userInfo = await userInfoResponse.json();
                this.logins = getLoginItems(userInfo.authTypes || []);
            } else {
                this.logins = getLoginItems(authData.authMethods);
            }
        } catch (error) {
            this.logins = '<div class="error-message">Failed to load authentication methods</div>';
        }
    }

    async afterRender() {
        const deleteButtons = this.element.querySelectorAll('[data-act="deleteAuth"]');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const authType = e.target.getAttribute('data-auth-type');
                const credentialId = e.target.getAttribute('data-credential-id');
                this.deleteAuth(e, authType, credentialId);
            });
        });
    }

    async deleteAccount() {
        let message = `Are you sure you want to delete your account ${localStorage.getItem("userEmail") || ""}`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (confirmation) {
            let currentSpaceId;
            let message = await assistOS.loadifyComponent(this.element, async () => {
                return message;
            });
            if (message) {
                await showApplicationError("Error deleting Account", message, "");
            } else {
                window.location.href = window.location.href.split("#")[0] + `#${currentSpaceId}`;
                window.location.reload();
            }
        }
    }

    async addAuthenticationMethod(eventTarget) {
        let modal = await assistOS.UI.showModal("add-authentication-method-modal", {}, true);
        if (modal) {
            this.invalidate();
        }
    }

    async deleteAuth(eventTarget, authType, credentialId) {
        switch (authType) {
            case "emailCode":
                assistOS.showToast('Email code cannot be deleted', "error");
                break;
            case "passkey":
                if (!credentialId) {
                    assistOS.showToast('Cannot delete passkey: Missing credential ID', "error");
                    return false;
                }
                const message = "Are you sure you want to delete this passkey?";
                const confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
                if (confirmation) {
                    const success = await this.deletePasskey(credentialId);
                    if (success) {
                        this.invalidate();
                    }
                }
                break;
            case "totp":
                const totpMessage = "Are you sure you want to delete the authenticator app (OTP) method?";
                const totpConfirmation = await assistOS.UI.showModal("confirm-action-modal", {message: totpMessage}, true);
                if (totpConfirmation) {
                    const success = await this.deleteTotp();
                    if (success) {
                        this.invalidate();
                    }
                }
                break;
            default:
                assistOS.showToast(`Unknown authentication type: ${authType}`, "error");
        }
    }

    async deletePasskey(credentialId) {
        try {
            if (!credentialId) {
                throw new Error('Credential ID is required to delete a passkey');
            }

            let email = localStorage.getItem("userEmail");
            if (!email) {
                const userInfoResponse = await fetch('/auth/getInfo', {
                    method: 'GET',
                    credentials: 'include'
                });

                if (userInfoResponse.ok) {
                    const userInfo = await userInfoResponse.json();
                    email = userInfo.email || userInfo.username;
                }
            }

            if (!email) {
                throw new Error('Could not determine user email');
            }

            const response = await fetch(`/auth/deletePasskey/${encodeURIComponent(email)}/${encodeURIComponent(credentialId)}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete passkey');
            }

            const result = await response.json();

            if (result.status === "success") {
                assistOS.showToast('Passkey deleted successfully', 'success');
                return true;
            } else {
                throw new Error(result.message || 'Unknown error during passkey deletion');
            }
        } catch (error) {
            assistOS.showToast(`Failed to delete passkey: ${error.message}`, 'error');
            return false;
        }
    }

    async deleteTotp() {
        try {
            let email = localStorage.getItem("userEmail");
            if (!email) {
                const userInfoResponse = await fetch('/auth/getInfo', {
                    method: 'GET',
                    credentials: 'include'
                });

                if (userInfoResponse.ok) {
                    const userInfo = await userInfoResponse.json();
                    email = userInfo.email || userInfo.username;
                }
            }

            if (!email) {
                throw new Error('Could not determine user email');
            }

            const response = await fetch(`/auth/deleteTotp/${encodeURIComponent(email)}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete TOTP authentication');
            }

            const result = await response.json();

            if (result.status === "success") {
                assistOS.showToast('Authenticator app (OTP) removed successfully', 'success');
                return true;
            } else {
                throw new Error(result.message || 'Unknown error during TOTP deletion');
            }
        } catch (error) {
            assistOS.showToast(`Failed to delete authenticator app (OTP): ${error.message}`, 'error');
            return false;
        }
    }
}