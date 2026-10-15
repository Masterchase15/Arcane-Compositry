/**
 * pages/account.js - sign in, create an account, change password (#/account).
 */
import { api, state, refreshCatalog } from '../api.js';
import { esc, icon, toast } from '../ui.js';

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
              <label for="username">Username <span aria-hidden="true">*</span></label>
              <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${esc(keep.username || '')}"${attrs('username')}>
              ${creating ? '<span class="hint">3-24 letters, numbers, dashes or underscores.</span>' : ''}${err('username')}
            </div>
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
            <button class="btn primary" type="submit">${creating ? 'Create account' : 'Sign in'}</button>
          </form>
          <p class="muted">${creating ? 'Already have an account?' : 'No account yet?'}
            <button class="btn ghost sm" id="swap">${creating ? 'Sign in instead' : 'Create one'}</button></p>
          ${creating ? '' : '<p class="small muted">Forgot your password? Ask your DM - they can set a new one for you from the DM page.</p>'}
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
        state.user = (await api('POST', `/auth/${creating ? 'register' : 'login'}`, body)).user;
        await refreshCatalog();
        toast(creating ? `Welcome, ${state.user.displayName}!` : 'Signed in.');
        location.hash = `#${next.startsWith('/') ? next : '/characters'}`;
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
          <div><dt>Role</dt><dd>${u.role === 'dm' ? 'Dungeon Master' : 'Player'}</dd></div>
        </dl>
        <div class="row"><a class="btn primary" href="#/characters">${icon('users')}My characters</a>
          ${u.role === 'dm' ? `<a class="btn" href="#/dm">${icon('shield')}DM tools</a>` : ''}</div>
      </section>
      <section class="card">
        <h2>Change password</h2>
        <form class="stack" novalidate>
          <input type="text" name="username" autocomplete="username" value="${esc(u.username)}" hidden>
          <div class="field"><label for="current">Current password</label><input id="current" name="current" type="password" autocomplete="current-password" required><span class="error" id="err-current" hidden></span></div>
          <div class="field"><label for="next">New password</label><input id="next" name="next" type="password" autocomplete="new-password" required><span class="hint">At least 8 characters.</span><span class="error" id="err-next" hidden></span></div>
          <button class="btn primary" type="submit">Update password</button>
        </form>
      </section>
    </div>`;
  main.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    form.querySelectorAll('.error').forEach((el) => { el.hidden = true; });
    try {
      await api('POST', '/auth/password', { current: form.current.value, next: form.next.value });
      form.reset();
      toast('Password updated.');
    } catch (error) {
      const key = Object.keys(error.fields || {})[0];
      const slot = form.querySelector(`#err-${key}`);
      if (slot) { slot.textContent = error.fields[key]; slot.hidden = false; form[key].focus(); } else toast(error.message, 'error');
    }
  });
}
