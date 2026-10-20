/**
 * pages/email-links.js - the pages opened from emails, and "Forgot password".
 *
 *   #/forgot               ask for a password-reset email
 *   #/reset?token=...      the link in that email: choose a new password
 *   #/verify?token=...     the link in the "confirm your email" email
 *
 * Also askForEmail(): the one-time "add an email" prompt for accounts made
 * before emails were collected.
 */
import { api, state, loadUser } from '../api.js';
import { esc, icon, toast, openDialog } from '../ui.js';

export async function render(main, { path, query }) {
  if (path === '/forgot') return forgotPage(main);
  if (path === '/reset') return resetPage(main, query.get('token'));
  return verifyPage(main, query.get('token'));
}

const card = (kicker, title, body) => `
  <div class="narrow-page"><section class="card stack">
    <p class="kicker">${kicker}</p><h1>${title}</h1><hr class="rule">${body}
  </section></div>`;

// ── #/forgot ─────────────────────────────────────────────────────────────────
function forgotPage(main) {
  if (!state.mailEnabled) {
    main.innerHTML = card('Account', 'Forgot your password?', `<p>Ask the site admin (or your DM, who can pass it on) to set a new one for you.</p>
      <a class="btn" href="#/account">Back to sign in</a>`);
    return;
  }
  main.innerHTML = card('Account', 'Forgot your password?', `
    <p>Enter the email on your account. If it is confirmed, we will send you a link to choose a new password.</p>
    <form class="stack" novalidate>
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>
      <button class="btn primary" type="submit">Send reset link</button>
    </form>
    <p class="small muted">Never confirmed your email, or no longer have it? Ask the site admin to set a new password for you.</p>`);
  main.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    if (!email) return e.target.email.focus();
    try {
      await api('POST', '/auth/forgot', { email });
      main.querySelector('section').innerHTML = `<p class="kicker">Account</p><h1>Check your email</h1><hr class="rule">
        <p>If <b>${esc(email)}</b> is the confirmed email on an account, a reset link is on its way. It works once and expires in an hour.</p>
        <p class="small muted">Nothing after a few minutes? Check your spam folder.</p>
        <a class="btn" href="#/account">Back to sign in</a>`;
    } catch (err) { toast(err.message, 'error'); }
  });
  main.querySelector('#email').focus();
}

// ── #/reset?token= ───────────────────────────────────────────────────────────
function resetPage(main, token) {
  main.innerHTML = card('Account', 'Choose a new password', `
    <form class="stack" novalidate>
      <div class="field"><label for="password">New password</label>
        <input id="password" name="password" type="password" autocomplete="new-password" required>
        <span class="hint">At least 8 characters.</span><span class="error" id="err-password" hidden></span></div>
      <button class="btn primary" type="submit">Save new password</button>
    </form>`);
  main.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const slot = main.querySelector('#err-password');
    slot.hidden = true;
    try {
      await api('POST', '/auth/reset', { token, password: e.target.password.value });
      main.querySelector('section').innerHTML = `<p class="kicker">Account</p><h1>Password changed</h1><hr class="rule">
        <p>You have been signed out everywhere. Sign in with your new password.</p>
        <a class="btn primary" href="#/account">Sign in</a>`;
      state.user = null;
    } catch (err) {
      if (err.fields?.password) { slot.textContent = err.fields.password; slot.hidden = false; return; }
      main.querySelector('section').innerHTML = `<p class="kicker">Account</p><h1>Link not valid</h1><hr class="rule">
        <p>${esc(err.message)}</p><a class="btn primary" href="#/forgot">Send a new link</a>`;
    }
  });
  main.querySelector('#password').focus();
}

// ── #/verify?token= ──────────────────────────────────────────────────────────
async function verifyPage(main, token) {
  main.innerHTML = card('Account', 'Confirming your email...', '');
  try {
    await api('POST', '/auth/verify', { token });
    if (state.user) await loadUser();
    main.innerHTML = card('Account', 'Email confirmed', `<p>${icon('check')} Thanks! You can now use this address to sign in and to reset your password.</p>
      <a class="btn primary" href="${state.user ? '#/campaigns' : '#/account'}">${state.user ? 'Continue' : 'Sign in'}</a>`);
  } catch (err) {
    main.innerHTML = card('Account', 'Link not valid', `<p>${esc(err.message)}</p><a class="btn primary" href="#/account">Account settings</a>`);
  }
}

// ── One-time prompt for older accounts ───────────────────────────────────────
/** Asks an account that has no email to add one. Shown once: "Not now" stops it for good. */
export function askForEmail() {
  if (!state.user?.askForEmail) return;
  state.user.askForEmail = false;
  const dlg = openDialog({
    title: 'Add your email', narrow: true,
    body: `<p>Accounts now have an email address. It is private (only you and the site admin see it), lets you sign in with it,
        ${state.mailEnabled ? 'and lets you reset your password yourself if you forget it.' : 'and will be used for password resets.'}</p>
      <div class="field"><label for="prompt-email">Email</label><input id="prompt-email" type="email" autocomplete="email"><span class="error" id="prompt-err" hidden></span></div>`,
    footer: `<button class="btn" id="prompt-skip">Not now</button><button class="btn primary" id="prompt-save">Add email</button>`,
  });
  dlg.querySelector('#prompt-skip').addEventListener('click', async () => {
    dlg.close();
    await api('POST', '/auth/email/skip').catch(() => {});
    toast('You can add one any time under Account settings.');
  });
  dlg.querySelector('#prompt-save').addEventListener('click', async () => {
    try {
      await api('PUT', '/auth/email', { email: dlg.querySelector('#prompt-email').value });
      dlg.close();
      await loadUser();
      toast(state.mailEnabled ? 'Saved. Check your inbox for a link to confirm it.' : 'Email saved.');
    } catch (err) {
      const box = dlg.querySelector('#prompt-err');
      box.textContent = err.message; box.hidden = false;
    }
  });
}
