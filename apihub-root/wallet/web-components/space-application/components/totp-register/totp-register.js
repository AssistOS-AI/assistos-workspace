let userModule = require("assistos").loadModule("user", {});

export class TotpRegister {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.email = this.element.variables["email"];
        this.userIsRegisrerd = this.element.variables["user-is-registered"];
        this.referer = this.element.variables["referer"];
        this.invalidate(async () => {
            if (this.userIsRegisrerd) {
                // This is for an authenticated user, so we use registerTotp endpoint
                this.totpResult = await userModule.registerTotp();
            } else {
                this.totpResult = await userModule.generateAuthCode(this.email, this.referer, "totp");
            }
        });
    }

    beforeRender() {
    }

    setQrCode() {
        // Display QR code using the bundled QR code library
        const qrCodeContainer = document.getElementById("totp_qrcode");
        const secretDisplay = document.getElementById("totp_secret");

        if (typeof QRCode === 'undefined') {
            // Load QR Code library if not available
            const script = document.createElement('script');
            script.src = "./wallet/lib/qrcode/index.js";
            script.onload = () => {
                new QRCode(qrCodeContainer, {
                    text: this.totpResult.uri,
                    width: 150,
                    height: 150,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            };
            document.head.appendChild(script);
        } else {
            // Use existing QR Code library
            new QRCode(qrCodeContainer, {
                text: this.totpResult.uri,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        // Display secret key for manual entry
        secretDisplay.textContent = this.totpResult.secret;
    }

    async afterRender() {
        try {
            if (this.totpResult.status !== "success") {
                throw new Error(this.totpResult.error || "Failed to register user with TOTP authentication");
            }

            // Extract TOTP info from response
            if (!this.totpResult.uri || !this.totpResult.secret) {
                throw new Error("TOTP setup information missing from response");
            }
            this.setQrCode();
            // Add event listeners
            const verifyInput = this.element.querySelector(".totp_verify_input");
            const verifyButton = this.element.querySelector(".totp_verify_button");

            verifyInput.addEventListener("input", (event) => {
                if (event.target.value.length === 6 && /^\d{6}$/.test(event.target.value)) {
                    verifyButton.removeAttribute("disabled");
                } else {
                    verifyButton.setAttribute("disabled", "");
                }
            });

            verifyButton.addEventListener("click", async () => {
                try {
                    const token = verifyInput.value.trim();

                    if (!token || !/^\d{6}$/.test(token)) {
                        throw new Error("Please enter a valid 6-digit code");
                    }

                    // Verify and enable TOTP
                    const result = await userModule.verifyTotp(token, this.email, true);

                    if (result.status === "success") {
                        //   await navigateToPage("my-account-page");
                        let event = new CustomEvent('totp-verified', {
                            detail: {token},
                            bubbles: true
                        });
                        this.element.dispatchEvent(event);
                    } else {
                        throw new Error(result.error || "Verification failed");
                    }
                } catch (error) {
                    await showApplicationError("Error", assistOS.UI.sanitize(error.message));
                }
            });
            // Handle Enter key
            verifyInput.addEventListener("keydown", (event) => {
                if (event.key === 'Enter' && !verifyButton.hasAttribute("disabled")) {
                    verifyButton.click();
                }
            });

        } catch (error) {
            let errModal = await showApplicationError("Error", error.message);
            errModal.addEventListener("close", async () => {
                await assistOS.UI.changeToDynamicPage("landing-page", "landing-page");
            });
        }
    }


}
