// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('masterPassword');
    const errorMessage = document.getElementById('error-message');

    // Simple view switching
    const showLoggedInView = () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('logged-in-view').style.display = 'block';
    };

    const showLoginForm = () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('logged-in-view').style.display = 'none';
        emailInput.value = '';
        passwordInput.value = '';
    };

    // Check login status on popup open
    chrome.runtime.sendMessage({ type: 'GET_LOGIN_STATUS' }, (response) => {
        if (response && response.isLoggedIn) {
            showLoggedInView();
        } else {
            showLoginForm();
        }
    });

    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const masterPassword = passwordInput.value;

        if (!email || !masterPassword) {
            errorMessage.textContent = 'Please enter email and password.';
            return;
        }

        // Send login credentials to the background script
        chrome.runtime.sendMessage({
            type: 'LOGIN',
            data: { email, masterPassword }
        }, (response) => {
            if (response.success) {
                showLoggedInView();
                errorMessage.textContent = '';
            } else {
                errorMessage.textContent = response.error || 'Login failed.';
            }
        });
    });

    logoutBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
            showLoginForm();
        });
    });
});