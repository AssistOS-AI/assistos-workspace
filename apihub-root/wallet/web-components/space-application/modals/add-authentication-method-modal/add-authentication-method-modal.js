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
                assistOS.showToast('OTP setup initiated', "success");
            } else if (type === "passkey") {
                await this.setupPasskey();
            } else {
                assistOS.showToast('Unknown authentication method', "error");
                return;
            }
            this.shouldInvalidate = true;
        } catch (error) {
            assistOS.showToast(`Failed to set up authentication method: ${error.message}`, "error");
        } finally {
            await this.closeModal();
        }
    }
    async setupOTP() {
        try {
            const registerResponse = await fetch('/auth/registerTotp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json();
                throw new Error(errorData.error || 'Failed to initialize TOTP setup');
            }

            const setupData = await registerResponse.json();

            if (setupData.status !== "SUCCESS") {
                throw new Error(setupData.error || 'Failed to initialize TOTP setup');
            }

            const uri = setupData.uri;
            const secret = setupData.secret;

            const qrContainer = document.createElement('div');
            qrContainer.innerHTML = `
            <div class="totp-setup-container">
                <h3>Scan this QR code with your authenticator app</h3>
                <div id="qrcode"></div>
                <p>Or enter this code manually:</p>
                <div class="secret-code">${secret}</div>
                <div class="verification-form">
                    <label for="verification-code">Enter the 6-digit code from your app:</label>
                    <input type="text" id="verification-code" maxlength="6" pattern="[0-9]{6}" required>
                    <button id="verify-totp" class="general-button">Verify and Enable</button>
                </div>
            </div>
        `;

            document.body.appendChild(qrContainer);
            document.getElementById('verify-totp').addEventListener('click', async () => {
                const verificationCode = document.getElementById('verification-code').value;
                if (!/^[0-9]{6}$/.test(verificationCode)) {
                    assistOS.showToast('Please enter a valid 6-digit code', 'error');
                    return;
                }

                const verificationResult = await this.verifyAndEnableOTP(verificationCode);
                if (verificationResult) {
                    document.body.removeChild(qrContainer);
                }
            });

            return true;
        } catch (error) {
            console.error('OTP setup error:', error);
            assistOS.showToast(`Failed to set up OTP: ${error.message}`, 'error');
            return false;
        }
    }

    async verifyAndEnableOTP(token) {
        try {
            if (!token || !/^[0-9]{6}$/.test(token)) {
                assistOS.showToast('Please enter a valid 6-digit code', 'error');
                return false;
            }

            const verifyResponse = await fetch('/auth/verifyTotp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    enableTotp: true
                }),
                credentials: 'include'
            });

            if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json();
                throw new Error(errorData.error || 'Failed to verify TOTP code');
            }

            const result = await verifyResponse.json();

            if (result.status === "SUCCESS") {
                assistOS.showToast('TOTP authentication enabled successfully', 'success');
                this.shouldInvalidate = true;
                return true;
            } else {
                throw new Error(result.error || 'Invalid verification code');
            }
        } catch (error) {
            assistOS.showToast(`Failed to verify TOTP: ${error.message}`, 'error');
            return false;
        }
    }
    async setupPasskey() {
        if (!window.PublicKeyCredential) {
            assistOS.showToast('Your browser does not support passkeys', "error");
            return;
        }

        const userInfoResponse = await fetch('/auth/getInfo', {
            method: 'GET',
            credentials: 'include'
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to get user information');
        }

        const userInfo = await userInfoResponse.json();
        const email = userInfo.email || userInfo.username;

        if (!email) {
            throw new Error('Could not determine user email');
        }

        try {
            const publicKeyCredentialCreationOptions = {
                challenge: this._generateRandomChallenge(),
                rp: {
                    name: document.location.hostname,
                    id: document.location.hostname
                },
                user: {
                    id: this._stringToArrayBuffer(email),
                    name: email,
                    displayName: email
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },
                    { type: "public-key", alg: -257 }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    requireResidentKey: false
                },
                attestation: "direct",
                timeout: 60000
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            const credentialResponse = {
                id: credential.id,
                rawId: this._bufferToBase64Url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: this._bufferToBase64Url(credential.response.clientDataJSON),
                    attestationObject: this._bufferToBase64Url(credential.response.attestationObject)
                },
                clientExtensionResults: credential.getClientExtensionResults(),
                origin: window.location.origin
            };

            const verificationResponse = await fetch('/auth/registerNewPasskey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentialResponse),
                credentials: 'include'
            });

            if (!verificationResponse.ok) {
                const errorData = await verificationResponse.json();
                throw new Error(errorData.error || 'Failed to verify passkey registration');
            }

            const result = await verificationResponse.json();

            if (result.operation === "success") {
                assistOS.showToast('Passkey setup successful', "success");
            } else {
                throw new Error(result.error || 'Unknown error during passkey registration');
            }
        } catch (error) {
            console.error("WebAuthn Error:", error);
            throw new Error(`Passkey registration failed: ${error.message}`);
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


    _generateRandomChallenge() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return array.buffer;
    }

    _stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str).buffer;
    }
}