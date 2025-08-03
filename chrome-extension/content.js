// content.js - FULLY UPDATED

// --- DOM Manipulation & Event Handling ---

function findPasswordFields() {
  return Array.from(document.querySelectorAll('input[type="password"]'));
}

function findUsernameField(passwordField) {
  if (!passwordField.form) return null;
  const commonSelectors = [
      "input[type='email']",
      "input[type='text']",
      "input[autocomplete='username']"
  ];
  for (const selector of commonSelectors) {
      const usernameInput = passwordField.form.querySelector(selector);
      if (usernameInput) return usernameInput;
  }
  return null;
}

// --- NEW FUNCTION: Creates the Autofill Icon UI ---
function createAutofillUI(credentials) {
  const passwordFields = findPasswordFields();
  if (!passwordFields.length || !credentials.length) {
      console.log("Autofill UI: No password fields found or no credentials.");
      return;
  }

  // For simplicity, we'll focus on the first credential and first login form.
  // A more advanced version could handle multiple accounts for one site.
  const credential = credentials[0];
  const passwordField = passwordFields[0];
  const usernameField = findUsernameField(passwordField);

  if (!usernameField) {
      console.warn("Autofill UI: Could not find a suitable username field associated with the password field.");
      return;
  }
  if (!passwordField) {
      console.warn("Autofill UI: Password field not found, despite passwordFields.length > 0. This is unexpected.");
      return;
  }

  // Wrap the input to position the icon, if not already wrapped
  if (!usernameField.parentElement.classList.contains('pwm-input-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'pwm-input-wrapper';
      usernameField.parentNode.insertBefore(wrapper, usernameField);
      wrapper.appendChild(usernameField);
  }

  // Create and add the icon
  const icon = document.createElement('div');
  icon.className = 'pwm-autofill-icon';
  icon.title = 'Autofill with your saved credentials';

  icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      usernameField.value = credential.username;
      passwordField.value = credential.password;

      // IMPORTANT: Dispatch events to let frameworks like React know the inputs have changed.
      // Dispatch both 'input' and 'change' events for broader compatibility.
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true })); // Added change event
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('change', { bubbles: true })); // Added change event
      
      console.log("Autofill: Values set. Username:", usernameField.value, "Password (length):", passwordField.value.length);
      
      icon.style.display = 'none'; // Hide icon after use
  });

  usernameField.parentElement.appendChild(icon);
  console.log("Autofill UI: Icon attached to username field wrapper.");
}


// --- MODIFIED: On-page prompt with success feedback ---
function showSavePasswordPrompt(data) {
  if (document.getElementById('pwm-save-prompt')) return;

  const prompt = document.createElement('div');
  prompt.id = 'pwm-save-prompt';
  prompt.style.cssText = `
    position: fixed; top: 20px; right: 20px; background-color: #fff;
    border: 1px solid #ccc; border-radius: 8px; padding: 16px; z-index: 9999;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1); font-family: sans-serif;
    font-size: 14px;
  `;

  let promptContent = `
    <div style="font-weight: bold; margin-bottom: 10px;">Save to your Vault?</div>
    <div style="margin-bottom: 5px;"><strong>Username:</strong> ${data.username}</div>
    <div style="margin-bottom: 15px;"><strong>URL:</strong> ${new URL(data.url).hostname}</div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button id="pwm-close-btn" style="padding: 8px 12px; border: 1px solid #ccc; background: #f7f7f7; border-radius: 4px; cursor: pointer;">Close</button>
      <button id="pwm-save-btn" style="padding: 8px 12px; border: none; background: #0d6efd; color: white; border-radius: 4px; cursor: pointer;">Save</button>
    </div>
  `;
  prompt.innerHTML = promptContent;
  document.body.appendChild(prompt);

  document.getElementById('pwm-save-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'SAVE_CREDENTIALS', data: data });
      
      // Provide immediate feedback
      prompt.innerHTML = `<div style="color: #198754; font-weight: bold;">✅ Saved to Vault!</div>`;
      
      // Remove the prompt after a short delay
      setTimeout(() => {
          prompt.remove();
      }, 2000);
  });

  document.getElementById('pwm-close-btn').addEventListener('click', () => {
      prompt.remove();
  });
}


// --- Listeners ---

// Listen for captured passwords to send to background
function handlePasswordInput(event) {
  const passwordField = event.target;
  const form = passwordField.form;
  if (!form || form.dataset.pwmCaptured) return; // Prevent multiple captures on submit

  const password = passwordField.value;
  const usernameField = findUsernameField(passwordField);
  const username = usernameField ? usernameField.value : '';
  const url = window.location.href;

  if (password && username) {
      // Mark the form as captured to avoid sending again
      form.dataset.pwmCaptured = 'true';
      console.log("Password Captured: Sending to background for URL:", url);
      chrome.runtime.sendMessage({
          type: 'PASSWORD_CAPTURED',
          data: { password, username, url }
      });
  } else {
      console.log("Password Captured: Username or password not found or empty. Username:", username, "Password present:", !!password);
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROMPT_TO_SAVE_PASSWORD') {
      console.log("Content Script: Received PROMPT_TO_SAVE_PASSWORD message.", message.data);
      showSavePasswordPrompt(message.data);
  }
});


// Initial page load listener: Check for credentials to autofill
window.addEventListener('load', () => {
  console.log("Content Script: Window loaded, requesting credentials for autofill.");
  chrome.runtime.sendMessage({
      type: 'GET_CREDENTIALS_FOR_URL',
      url: window.location.href
  }, (response) => {
      if (response.success && response.data && response.data.length > 0) {
          console.log('Content Script: Found credentials for this site:', response.data);
          // Call the new function to build the UI
          createAutofillUI(response.data);
      } else if (response.success && response.data && response.data.length === 0) {
          console.log('Content Script: No credentials found for this site.');
      } else {
          console.error('Content Script: Error getting credentials:', response.error);
      }
  });
});


// Attach event listeners to all password fields
function attachListeners() {
  // We listen on form submission now, which is more reliable
  document.querySelectorAll('form').forEach(form => {
      if (!form.dataset.pwmListenerAttached) {
          form.addEventListener('submit', () => {
              const passwordField = form.querySelector('input[type="password"]');
              if (passwordField) {
                  handlePasswordInput({ target: passwordField });
              }
          });
          form.dataset.pwmListenerAttached = 'true';
      }
  });
}

// Initial attach and re-attach for Single Page Applications
attachListeners();
const observer = new MutationObserver(attachListeners);
observer.observe(document.body, { childList: true, subtree: true });