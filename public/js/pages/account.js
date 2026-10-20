/**
 * pages/account.js - sign in, create an account (#/account). Once signed in:
 * your email (add, change, confirm), change password, and - for the site
 * admin - every account on the site, with "Set password" for anyone locked
 * out. Campaigns are on pages/campaigns.js; the pages opened from emailed
 * links (and "Forgot password") are in pages/email-links.js.
 */
import { api, state, loadUser, refreshCatalog, campaignHref } from '../api.js';
import { askForEmail } from './email-links.js';
import { reloadPage } from '../nav.js';
import { esc, icon, toast, openDialog } from '../ui.js';

export function render(main, { query }) {
  if (state.user) return renderProfile(main);
  let mode = 'login';
  const next = query.get('next') || '/characters';

  const draw = (errors = {}, message = '') => {
    const creating = mode === 'register';
    const err = (key) => (errors[key] ? `<span class="error" id="err-${key}">${esc(errors[key])}</span>` : '');
    const attrs = (key) => (errors[key] ? ` aria-invalid="true" aria-describedby="err-${key}"` : '');
    const keep = Object.fromEntries([...main.querySelectorAll('input')].map((i) => [i.name, i.value]));
    main.innerHTML = `
      <div class="grid cols-2">
        <section class="card">
          <p class="kicker">${creating ? 'New here?' : 'Welcome back'}</p>
          <h1>${creating ? 'Create an account' : 'Sign in'}</h1>
          <hr class="rule">
          ${message ? `<p class="error" role="alert" tabindex="-1" id="form-error">${icon('alert')} ${esc(message)}</p>` : ''}
          <form class="stack" novalidate>
            <div class="field">
              <label for="username">${creating ? 'Username' : 'Username or email'} <span aria-hidden="true">*</span></label>
              <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${esc(keep.username || '')}"${attrs('username')}>
              ${creating ? '<span class="hint">3-24 letters, numbers, dashes or underscores. Other players see this.</span>' : ''}${err('username')}
            </div>
            ${creating ? `<div class="field">
              <label for="email">Email <span aria-hidden="true">*</span></label>
              <input id="email" name="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" required value="${esc(keep.email || '')}"${attrs('email')}>
              <span class="hint">Private - only you and the site admin see it. You can sign in with it, and reset your password if you forget it.</span>${err('email')}
            </div>` : ''}
            ${creating ? `<div class="field">
              <label for="displayName">Display name</label>
              <input id="displayName" name="displayName" autocomplete="nickname" maxlength="40" value="${esc(keep.displayName || '')}">
              <span class="hint">How your name appears to the DM. Optional.</span>
            </div>` : ''}
            <div class="field">
              <label for="password">Password <span aria-hidden="true">*</span></label>
              <div class="stepper">
                <input id="password" name="password" type="password" autocomplete="${creating ? 'new-password' : 'current-password'}" required${attrs('password')}>
                <button type="button" class="btn icon-only" id="show-pw" aria-label="Show password" aria-pressed="false">${icon('eye')}</button>
              </div>
              ${creating ? '<span class="hint">At least 8 characters. Your password manager can save it.</span>' : ''}${err('password')}
            </div>
            ${creating ? `<div class="field">
              <label for="inviteCode">Invite code${state.inviteRequired ? ' <span aria-hidden="true">*</span>' : ''}</label>
              <input id="inviteCode" name="inviteCode" autocomplete="off" autocapitalize="characters" spellcheck="false"${state.inviteRequired ? ' required' : ''} value="${esc(keep.inviteCode || '')}"${attrs('inviteCode')}>
              <span class="hint">${state.inviteRequired ? 'Your DM gives this to their players. It also adds you to their campaign.' : "Optional. Your DM's campaign invite code adds you to their campaign straight away."}</span>${err('inviteCode')}
            </div>` : ''}
            <button class="btn primary" type="submit">${creating ? 'Create account' : 'Sign in'}</button>
          </form>
          <p class="muted">${creating ? 'Already have an account?' : 'No account yet?'}
            <button class="btn ghost sm" id="swap">${creating ? 'Sign in instead' : 'Create one'}</button></p>
          ${creating ? '' : state.mailEnabled
            ? '<p class="small"><a href="#/forgot">Forgot your password?</a></p>'
            : '<p class="small muted">Forgot your password? Ask the site admin (or your DM, who can pass it on) to set a new one for you.</p>'}
        </section>
        <aside class="stack">
          <div class="note-box"><h4>Why an account?</h4>
            <p>Your characters are saved to your account, so the sheet you edit on your phone at the table is the same one on your desktop at home.</p></div>
          <div class="plain-box"><h4>No account needed for</h4>
            <ul><li>Reading the <a href="#/codex">Field Codex</a></li><li>Using the <a href="#/craft">Spellcrafter</a> and <a href="#/tools">calculators</a></li><li>Browsing the <a href="#/spells">spell lists</a></li></ul></div>
        </aside>
      </div>`;

    main.querySelector('#swap').addEventListener('click', () => { mode = creating ? 'login' : 'register'; draw(); });
    main.querySelector('#show-pw').addEventListener('click', (e) => {
      const input = main.querySelector('#password');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      e.currentTarget.setAttribute('aria-pressed', String(show));
      e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
    main.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const button = e.target.querySelector('[type=submit]');
      const body = Object.fromEntries(new FormData(e.target));
      button.disabled = true;
      button.textContent = 'One moment...';
      try {
        const { joinedGroup } = await api('POST', `/auth/${creating ? 'register' : 'login'}`, body);
        await loadUser();
        await refreshCatalog();
        toast(creating
          ? (state.mailEnabled ? `Welcome, ${state.user.displayName}! Check your email to confirm your address.` : `Welcome, ${state.user.displayName}!`)
          : 'Signed in.');
        askForEmail();
        // An invite code took them into a campaign: go straight to it.
        location.hash = joinedGroup ? campaignHref(joinedGroup) : `#${next.startsWith('/') ? next : '/characters'}`;
      } catch (error) {
        draw(error.fields || {}, error.message);
        // Send keyboard and screen-reader users straight to the problem.
        (main.querySelector('[aria-invalid="true"]') || main.querySelector('#form-error'))?.focus();
      }
    });
    if (message) return;
    main.querySelector('#username').focus({ preventScroll: true });
  };
  draw();
}

function renderProfile(main) {
  const u = state.user;
  main.innerHTML = `
    <div class="page-head"><p class="kicker">Account</p><h1>${esc(u.displayName)}</h1><hr class="rule"></div>
    <div class="grid cols-2">
      <section class="card stack">
        <h2>Details</h2>
        <dl class="stat-grid">
          <div><dt>Username</dt><dd>${esc(u.username)}</dd></div>
          <div><dt>Email</dt><dd>${u.email ? `${esc(u.email)} ${u.emailVerified ? '<span class="badge">Confirmed</span>' : '<span class="badge gold">Not confirmed</span>'}` : '<span class="muted">None</span>'}</dd></div>
          <div><dt>Campaigns</dt><dd>${state.groups.length}</dd></div>
          ${u.isAdmin ? '<div><dt>Site role</dt><dd>Admin</dd></div>' : ''}
        </dl>
        <div class="row"><a class="btn primary" href="#/characters">${icon('users')}My characters</a>
          <a class="btn" href="#/campaigns">${icon('flag')}My campaigns</a></div>
      </section>
      <section class="card stack">
        <h2>${u.email ? 'Change email' : 'Add an email'}</h2>
        ${u.email && !u.emailVerified && state.mailEnabled ? `<p class="small">We sent a link to <b>${esc(u.email)}</b>. Open it to confirm the address - until then it cannot be used to reset your password.
          <button class="btn sm" id="resend" type="button">Send it again</button></p>` : ''}
        <form class="stack" id="email-form" novalidate>
          <input type="text" name="username" autocomplete="username" value="${esc(u.username)}" hidden>
          <div class="field"><label for="new-email">${u.email ? 'New email' : 'Email'}</label><input id="new-email" name="email" type="email" autocomplete="email" required><span class="error" id="err-email" hidden></span></div>
          ${u.email ? '<div class="field"><label for="email-pw">Your password</label><input id="email-pw" name="password" type="password" autocomplete="current-password" required><span class="error" id="err-password" hidden></span></div>' : ''}
          <button class="btn" type="submit">${u.email ? 'Change email' : 'Add email'}</button>
        </form>
      </section>
      <section class="card">
        <h2>Change password</h2>
        <form class="stack" id="pw-form" novalidate>
          <input type="text" name="username" autocomplete="username" value="${esc(u.username)}" hidden>
          <div class="field"><label for="current">Current password</label><input id="current" name="current" type="password" autocomplete="current-password" required><span class="error" id="err-current" hidden></span></div>
          <div class="field"><label for="next">New password</label><input id="next" name="next" type="password" autocomplete="new-password" required><span class="hint">At least 8 characters.</span><span class="error" id="err-next" hidden></span></div>
          <button class="btn primary" type="submit">Update password</button>
        </form>
      </section>
    </div>
    ${u.isAdmin ? '<section class="card stack gap-above" id="admin"><h2>All accounts</h2><p class="muted">Loading...</p></section>' : ''}`;

  main.querySelector('#resend')?.addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try { await api('POST', '/auth/verify/resend'); toast('Sent. Check your inbox (and spam folder).'); } catch (err) { toast(err.message, 'error'); }
  });
  main.querySelector('#email-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    form.querySelectorAll('.error').forEach((el) => { el.hidden = true; });
    try {
      await api('PUT', '/auth/email', { email: form.email.value, password: form.password?.value });
      await loadUser();
      toast(state.mailEnabled ? 'Saved. Check that inbox for a link to confirm it.' : 'Email saved.');
      reloadPage();
    } catch (error) {
      const key = Object.keys(error.fields || {})[0];
      const slot = key && form.querySelector(`#err-${key}`);
      if (slot) { slot.textContent = error.fields[key]; slot.hidden = false; form[key].focus(); } else toast(error.message, 'error');
    }
  });

  main.querySelector('#pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    form.querySelectorAll('.error').forEach((el) => { el.hidden = true; });
    try {
      await api('POST', '/auth/password', { current: form.current.value, next: form.next.value });
      form.reset();
      toast('Password updated.');
    } catch (error) {
      const key = Object.keys(error.fields || {})[0];
      const slot = key && form.querySelector(`#err-${key}`);
      if (slot) { slot.textContent = error.fields[key]; slot.hidden = false; form[key].focus(); } else toast(error.message, 'error');
    }
  });

  if (u.isAdmin) adminSection(main.querySelector('#admin'));
}

/** Site admin only: every account, with "Set password". (Admins are made on the server: npm run make-admin.) */
async function adminSection(box) {
  const { users } = await api('GET', '/admin/users');
  box.innerHTML = `
    <h2>All accounts</h2>
    <p class="small muted">You are the site admin. Set a temporary password for anyone who is locked out and tell them in person. Admins are added or removed on the server with <code>npm run make-admin</code>.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Groups</th><th>Actions</th></tr></thead>
      <tbody>${users.map((x) => `<tr>
        <td><b>${esc(x.displayName)}</b>${x.isAdmin ? ' <span class="badge gold">Admin</span>' : ''}${x.id === state.user.id ? ' (you)' : ''}</td>
        <td>${esc(x.username)}</td><td>${esc(x.email || '-')}${x.email && !x.emailVerified ? ' <span class="small muted">(not confirmed)</span>' : ''}</td><td>${esc(x.groups || '-')}</td>
        <td><div class="row">${x.id === state.user.id ? '' : `
          <button class="btn sm" data-pw="${x.id}" data-name="${esc(x.displayName)}">Set password</button>`}</div></td></tr>`).join('')}</tbody></table></div>`;

  box.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.pw) {
      const dlg = openDialog({
        title: `New password for ${esc(btn.dataset.name)}`, narrow: true,
        body: `<p>Set a temporary password and tell them in person. They are signed out everywhere and can change it under Account settings.</p>
          <div class="field"><label for="temp-pw">Temporary password</label><input id="temp-pw" type="text" autocomplete="off" minlength="8"><span class="hint">At least 8 characters.</span><span class="error" id="temp-err" hidden></span></div>`,
        footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="temp-save">Set password</button>`,
      });
      dlg.querySelector('#temp-save').addEventListener('click', async () => {
        try {
          await api('PUT', `/admin/users/${btn.dataset.pw}/password`, { password: dlg.querySelector('#temp-pw').value });
          dlg.close();
          toast('Password updated.');
        } catch (err) {
          const box2 = dlg.querySelector('#temp-err');
          box2.textContent = err.message; box2.hidden = false;
        }
      });
    }
  });
}
