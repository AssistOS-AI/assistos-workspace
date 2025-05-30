export class AddAuthenticationMethodModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.shouldInvalidate = false;
        this.invalidate();
    }

    async beforeRender() {

    }

    async afterRender() {

    }

    async closeModal() {
        await assistOS.UI.closeModal(this.element, {shouldInvalidate: this.shouldInvalidate});
    }

    async addLoginMethod(eventTarget) {
        let radios = document.querySelectorAll('.custom-radio[data-local-action="selectRadio"]');
        let selectedOption = null;
        for (const radio of radios) {
            if (radio.classList.contains('selected')) {
                selectedOption = radio;
                break;
            }
        }
        if (!selectedOption) {
            assistOS.showToast('Please select an authentication method', "error");
            return;
        }

        let type = selectedOption.getAttribute('data-value');
        try {
            if (type === "otp") {
                await this.setupOTP();
            } else if (type === "passkey") {
                await this.setupPasskey();
            } else {
                assistOS.showToast('Unknown authentication method', "error");
                return;
            }
            this.shouldInvalidate = true;
        } catch (error) {
            assistOS.showToast(`Failed to set up authentication method: ${error.message}`, "error");
        }
    }

    async setupOTP() {
        try {
            const originalContent = this.element.innerHTML;
            this.element.style.height = 'auto';
            this.element.innerHTML = `
        <div class="modal-header">
            <div>Set Up Authenticator App</div>
            <div class="close" data-local-action="closeModal" aria-label="Close">
                <img class="close-icon" src="./wallet/assets/icons/x-mark.svg" alt="close">
            </div>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; padding:20px;">
            <p>Initializing authenticator setup...</p>
            <div class="loading-spinner" style="margin:20px 0;"></div>
        </div>
    `;

            const setupResponse = await fetch('/auth/setupTotp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!setupResponse.ok) {
                const errorData = await setupResponse.json();
                throw new Error(errorData.error || 'Failed to initialize TOTP setup');
            }

            const setupData = await setupResponse.json();

            if (setupData.status !== "SUCCESS" && setupData.status !== "success") {
                throw new Error(setupData.error || 'Failed to initialize TOTP setup');
            }

            const uri = setupData.uri;
            const secret = setupData.secret;

            this.element.innerHTML = `
        <div class="modal-header">
            <div>Set up an authenticator app</div>
            <div class="close" data-local-action="closeModal" aria-label="Close">
                <img class="close-icon" src="./wallet/assets/icons/x-mark.svg" alt="close">
            </div>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; padding:25px;">
            <h3 style="margin-top:0; margin-bottom:20px;">Set Up Authenticator</h3>
            
            <ol style="margin-left:0; padding-left:20px; margin-bottom:20px;">
                <li style="margin-bottom:12px;">Search for 'authenticator' app for your device (Google Authenticator, Authy, etc.)</li>
                <li style="margin-bottom:12px;">Open the app.</li>
                <li style="margin-bottom:12px;">Pair your app with AssistOS by scanning this QR Code.</li>
            </ol>
            
            <div style="display:flex; justify-content:center; width:100%;">
                <div id="qrcode-container" style="width:200px; height:200px; margin:10px 0; background:#f5f5f5; display:flex; justify-content:center; align-items:center;"></div>
            </div>
            
            <p style="margin-bottom:5px;">or enter this key manually:</p>
            <div class="secret-code" style="font-family:monospace; font-size:16px; background:#f5f5f5; padding:10px; border-radius:4px; letter-spacing:2px; text-align:center; margin-bottom:15px;">${secret}</div>
            
            <ol start="4" style="margin-left:0; padding-left:20px; margin-bottom:20px;">
                <li>Enter the 6-digit code from your authenticator.</li>
            </ol>
            
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="text" id="verification-code" class="fit-content" maxlength="6" pattern="[0-9]{6}" required 
                    style="flex:1; font-size:18px; letter-spacing:2px; padding:8px; text-align:left; border-radius:4px; border:1px solid #ccc;" 
                    placeholder="Verification code">
                <button id="verify-totp" class="general-button fit-content" 
                    style="padding:8px 20px; border-radius:4px; background:#4285f4; color:white; border:none; cursor:pointer;">
                    Verify
                </button>
            </div>
            
            <div id="totp-error" style="color:red; margin-top:10px;"></div>
        </div>
    `;

            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
            const qrContainer = this.element.querySelector('#qrcode-container');
            if (qrContainer) {
                qrContainer.innerHTML = `<img src="${qrCodeUrl}" alt="TOTP QR Code" style="width:200px; height:200px;">`;
            }

            const closeButton = this.element.querySelector('[data-local-action="closeModal"]');
            if (closeButton) {
                closeButton.addEventListener('click', () => this.closeModal());
            }

            const verifyButton = this.element.querySelector('#verify-totp');
            const verificationInput = this.element.querySelector('#verification-code');
            const errorDisplay = this.element.querySelector('#totp-error');

            if (verifyButton && verificationInput) {
                const handleVerification = async (code) => {
                    if (!code || !/^[0-9]{6}$/.test(code)) {
                        if (errorDisplay) errorDisplay.textContent = 'Please enter a valid 6-digit code';
                        return;
                    }

                    if (verifyButton) verifyButton.disabled = true;
                    if (verificationInput) verificationInput.disabled = true;

                    try {
                        const verifyResponse = await fetch('/auth/enableTotp', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: code
                            }),
                            credentials: 'include'
                        });

                        const result = await verifyResponse.json();

                        // Check for both "SUCCESS" and "success" to be safe
                        if (verifyResponse.ok && (result.status === "SUCCESS" || result.status === "success")) {
                            assistOS.showToast('TOTP authentication enabled successfully', 'success');
                            this.shouldInvalidate = true;
                            await this.closeModal();
                        } else {
                            throw new Error(result.error || 'Invalid verification code');
                        }
                    } catch (error) {
                        if (errorDisplay) errorDisplay.textContent = error.message;
                        if (verifyButton) verifyButton.disabled = false;
                        if (verificationInput) verificationInput.disabled = false;
                    }
                };

                verificationInput.addEventListener('input', async () => {
                    const code = verificationInput.value.trim();
                    if (code.length === 6 && /^[0-9]{6}$/.test(code)) {
                        await handleVerification(code);
                    }
                });

                verifyButton.addEventListener('click', async () => {
                    const code = verificationInput.value.trim();
                    await handleVerification(code);
                });
            }

            return true;
        } catch (error) {
            console.error('OTP setup error:', error);
            assistOS.showToast(`Failed to set up OTP: ${error.message}`, 'error');
            await this.closeModal();
            return false;
        }
    }

    async setupPasskey() {
        if (!window.PublicKeyCredential) {
            assistOS.showToast('Your browser does not support passkeys', "error");
            return;
        }

        try {
            const setupOptionsResponse = await fetch('/auth/generatePasskeySetupOptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!setupOptionsResponse.ok) {
                const errorData = await setupOptionsResponse.json();
                throw new Error(errorData.error || 'Failed to get passkey setup options');
            }

            const setupData = await setupOptionsResponse.json();

            if (setupData.status !== "success") {
                throw new Error(setupData.error || 'Failed to get passkey setup options');
            }

            const publicKeyCredentialCreationOptions = JSON.parse(setupData.publicKeyCredentialCreationOptions);
            const challengeKey = setupData.challengeKey;

            publicKeyCredentialCreationOptions.challenge = this._base64UrlToArrayBuffer(publicKeyCredentialCreationOptions.challenge);
            publicKeyCredentialCreationOptions.user.id = this._base64UrlToArrayBuffer(publicKeyCredentialCreationOptions.user.id);

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            const registrationData = {
                id: credential.id,
                rawId: this._bufferToBase64Url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: this._bufferToBase64Url(credential.response.clientDataJSON),
                    attestationObject: this._bufferToBase64Url(credential.response.attestationObject)
                },
                clientExtensionResults: credential.getClientExtensionResults()
            };

            const addPasskeyResponse = await fetch('/auth/addPasskey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    registrationData: registrationData,
                    challengeKey: challengeKey
                }),
                credentials: 'include'
            });

            if (!addPasskeyResponse.ok) {
                const errorData = await addPasskeyResponse.json();
                throw new Error(errorData.error || 'Failed to verify passkey registration');
            }

            const result = await addPasskeyResponse.json();

            if (result.operation === "success") {
                assistOS.showToast('Passkey setup successful', "success");
                this.shouldInvalidate = true;
                await this.closeModal();
            } else {
                throw new Error(result.error || 'Unknown error during passkey registration');
            }
        } catch (error) {
            console.error("WebAuthn Error:", error);
            if (error.name === 'NotAllowedError') {
                assistOS.showToast('Passkey registration was cancelled or not allowed', "error");
            } else {
                assistOS.showToast(`Passkey registration failed: ${error.message}`, "error");
            }
        }
    }

    _bufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let str = '';
        bytes.forEach(byte => {
            str += String.fromCharCode(byte);
        });
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    _base64UrlToArrayBuffer(base64url) {
        const base64 = base64url
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const padLen = (4 - (base64.length % 4)) % 4;
        const padded = base64 + '='.repeat(padLen);
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    _stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str).buffer;
    }
}