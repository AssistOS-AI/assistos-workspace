import {navigateToPage} from "../../../uiutils/utils.js";

// Method for TOTP login
async function totpLogin(email) {
    try {
        // Show TOTP input section
        const loginSection = document.querySelector(".login_section");
        if (loginSection) {
            loginSection.style.display = "none";
        }

        const totpSection = document.querySelector(".totp_section");
        if (totpSection) {
            totpSection.style.display = "flex";
        }

        const formTitle = document.querySelector(".form_title");
        if (formTitle) {
            formTitle.textContent = "Login with Authenticator";
        }

        // Setup TOTP input validation
        const totpInput = document.querySelector(".totp_input");
        const totpButton = document.querySelector(".totp_action_button");

        if (totpInput && totpButton) {
            // Enable button when valid 6-digit code is entered
            totpInput.addEventListener("input", (event) => {
                if (event.target.value.length === 6 && /^\d{6}$/.test(event.target.value)) {
                    totpButton.removeAttribute("disabled");
                } else {
                    totpButton.setAttribute("disabled", "");
                }
            });

            // Handle Enter key
            totpInput.addEventListener("keydown", (event) => {
                if (event.key === 'Enter' && !totpButton.hasAttribute("disabled")) {
                    totpButton.click();
                }
            });

            // Focus the input field
            totpInput.focus();
        }

        // Store email for the submitTotp method
        localStorage.setItem("userEmail", email);

    } catch (error) {
        webSkel.notificationHandler.reportUserRelevantError(error);
    }
}

// Method to submit TOTP code during login
async function submitTotp() {
    try {
        const totpInput = document.querySelector(".totp_input");
        const token = totpInput.value.trim();

        if (!token || !/^\d{6}$/.test(token)) {
            throw new Error("Please enter a valid 6-digit code");
        }

        // Verify TOTP code for login
        const result = await webSkel.appServices.verifyTotp(token, localStorage.getItem("userEmail"));

        if (result.operation === "success") {
            await navigateToPage("my-account-page");
        } else {
            throw new Error("Invalid authentication code");
        }
    } catch (err) {
        if (err.details && err.details.status === 403) {
            let lockModal = await showModal("lock-login", {
                message: `Exceeded number of attempts. Login is locked for ${new Date(err.details.detailsData.lockTime).getMinutes()} minutes`,
            })
            setTimeout(async () => {
                if (lockModal) {
                    await webSkel.closeModal(lockModal);
                }
            }, err.details.detailsData.lockTime);
        } else {
            webSkel.notificationHandler.reportUserRelevantError(err);
        }
    }
}

// Method to set up TOTP for a new user
async function setupTotp(email, referer) {
    try {

        // Call generateAuthCode to create the user with TOTP auth type
        // We'll get the TOTP setup information directly from this response
        const authResult = await webSkel.appServices.generateAuthCode(email, referer, "totp");

        if (authResult.result !== "success") {
            throw new Error(authResult.error || "Failed to register user with TOTP authentication");
        }

        // Extract TOTP info from response
        if (!authResult.uri || !authResult.secret) {
            throw new Error("TOTP setup information missing from response");
        }

        // Show TOTP setup container or create it if it doesn't exist
        let totpSetupContainer = document.querySelector(".totp_setup_container");
        if (!totpSetupContainer) {
            totpSetupContainer = document.createElement("div");
            totpSetupContainer.className = "totp_setup_container";
            totpSetupContainer.innerHTML = `
                    <h3>Set Up Authenticator</h3>
                    <p>
                    <ol>
                        <li>Search for ‘authenticator’ app for your device (Google Authenticator, Authy, etc.)</li>
                        <li>Open the app.</li>
                        <li>Pair your app with OutfinityGift by scanning this QR Code
                            <div class="qrcode_container">
                                <div class="qrcode" id="totp_qrcode"></div>
                                <div>Or enter this key manually:</div> 
                                <p class="secret_key" id="totp_secret"></p>
                            </div> 
                       </li>
                       <li>
                           <div class="verification_section">
                            <p>Enter the 6-digit code from your authenticator:</p>
                            <div class="input_container">
                                <input class="totp_verify_input form-input" type="text" pattern="[0-9]*" 
                                       inputmode="numeric" maxlength="6" placeholder="Verification code">
                                <button class="totp_verify_button general-button" disabled>Verify</button>
                            </div>
                             </div>
                       </li>
                    </ol>
                `;

            // Append to page section
            const pageSection = document.querySelector(".component_container .content");
            pageSection.innerHTML = "";
            pageSection.appendChild(totpSetupContainer);

            // Add event listeners
            const verifyInput = totpSetupContainer.querySelector(".totp_verify_input");
            const verifyButton = totpSetupContainer.querySelector(".totp_verify_button");

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
                    const result = await webSkel.appServices.verifyTotp(token, email, true);

                    if (result.status === "success") {
                        await navigateToPage("my-account-page");
                    } else {
                        throw new Error(result.error || "Verification failed");
                    }
                } catch (error) {
                    webSkel.notificationHandler.reportUserRelevantError(error);
                }
            });

            // Handle Enter key
            verifyInput.addEventListener("keydown", (event) => {
                if (event.key === 'Enter' && !verifyButton.hasAttribute("disabled")) {
                    verifyButton.click();
                }
            });
        }

        // Display QR code using the bundled QR code library
        const qrCodeContainer = document.getElementById("totp_qrcode");
        const secretDisplay = document.getElementById("totp_secret");

        if (typeof QRCode === 'undefined') {
            // Load QR Code library if not available
            const script = document.createElement('script');
            script.src = "/scripts/qrcode/index.js";
            script.onload = () => {
                new QRCode(qrCodeContainer, {
                    text: authResult.uri,
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
                text: authResult.uri,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        // Display secret key for manual entry
        secretDisplay.textContent = authResult.secret;

        // Show the TOTP setup container
        totpSetupContainer.style.display = "block";

        // Focus on verification input
        setTimeout(() => {
            totpSetupContainer.querySelector(".totp_verify_input").focus();
        }, 500);

    } catch (error) {
        webSkel.notificationHandler.reportUserRelevantError(error);
    }
}

export {
    totpLogin,
    submitTotp,
    setupTotp
}
