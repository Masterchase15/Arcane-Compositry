/**
 * pages/account.js - sign in, create an account (#/account). Once signed in:
 * your groups (create, join, leave), change password, and - for the site
 * admin - every account on the site, with "Set password" for anyone locked out.
 */
import { api, state, loadUser, setGroup, refreshCatalog } from '../api.js';
import { reloadPage } from '../nav.js';
import { esc, icon, toast, openDialog, confirmDialog } from '../ui.js';

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
            ${creating ? `<div class="field">
              <label for="inviteCode">Invite code${state.inviteRequired ? ' <span aria-hidden="true">*</span>' : ''}</label>
              <input id="inviteCode" name="inviteCode" autocomplete="off" autocapitalize="characters" spellcheck="false"${state.inviteRequired ? ' required' : ''} value="${esc(keep.inviteCode || '')}"${attrs('inviteCode')}>
              <span class="hint">${state.inviteRequired ? 'Your DM gives this to their players. It also adds you to their group.' : "Optional. Your DM's group code adds you to their group straight away."}</span>${err('inviteCode')}
            </div>` : ''}
            <button class="btn primary" type="submit">${creating ? 'Create account' : 'Sign in'}</button>
          </form>
          <p class="muted">${creating ? 'Already have an account?' : 'No account yet?'}
            <button class="btn ghost sm" id="swap">${creating ? 'Sign in instead' : 'Create one'}</button></p>
          ${creating ? '' : '<p class="small muted">Forgot your password? Ask the site admin (or your DM, who can pass it on) to set a new one for you.</p>'}
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
        await setGroup(joinedGroup || state.group?.id);
        toast(creating ? `Welcome, ${state.user.displayName}!` : 'Signed in.');
        // Not in any group yet: stay here, where groups are created and joined.
        if (!state.group) return reloadPage();
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
  const roleLabel = (g) => (g.role === 'dm' ? '<span class="badge gold">DM</span>' : '<span class="badge">Player</span>');
  main.innerHTML = `
    <div class="page-head"><p class="kicker">Account</p><h1>${esc(u.displayName)}</h1><hr class="rule"></div>
    <div class="grid cols-2">
      <section class="card stack" id="groups">
        <h2>Your groups</h2>
        <p class="small muted">Each group is one campaign, with its own DM, characters and homebrew. ${u.isAdmin ? 'You are also the <b>site admin</b>.' : ''}</p>
        ${state.groups.length
          ? `<div class="table-wrap"><table>
              <tbody>${state.groups.map((g) => `<tr>
                <td><b>${esc(g.name)}</b> ${roleLabel(g)}${g.id === state.group?.id ? ' <span class="small muted">(showing)</span>' : ''}</td>
                <td><div class="row end">
                  ${g.id === state.group?.id ? '' : `<button class="btn sm" data-show="${g.id}">Show</button>`}
                  <button class="btn sm ghost" data-leave="${g.id}" data-name="${esc(g.name)}">Leave</button>
                </div></td></tr>`).join('')}</tbody></table></div>`
          : '<p>You are not in a group yet. Join your DM\'s group with their invite code, or start your own.</p>'}
        <form class="stack" id="join-form" novalidate>
          <div class="field"><label for="join-code">Join a group</label>
            <div class="inline-form"><input id="join-code" name="code" placeholder="Invite code" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn" type="submit">Join</button></div>
            <span class="error" id="err-code" hidden></span></div>
        </form>
        <form class="stack" id="create-form" novalidate>
          <div class="field"><label for="group-name">Start a new group (you will be its DM)</label>
            <div class="inline-form"><input id="group-name" name="name" maxlength="60" placeholder="Campaign name" autocomplete="off"><button class="btn" type="submit">Create</button></div>
            <span class="error" id="err-name" hidden></span></div>
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

  const showError = (form, error) => {
    const key = Object.keys(error.fields || {})[0];
    const slot = key && form.querySelector(`#err-${key}`);
    if (slot) { slot.textContent = error.fields[key]; slot.hidden = false; form.querySelector(`[name=${key}]`)?.focus(); } else toast(error.message, 'error');
  };
  const switchTo = async (id, message) => {
    await loadUser();
    await setGroup(id);
    toast(message);
    reloadPage();
  };

  main.querySelector('#join-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { group } = await api('POST', '/groups/join', { code: e.target.code.value });
      await switchTo(group.id, `You joined ${group.name}.`);
    } catch (error) { showError(e.target, error); }
  });
  main.querySelector('#create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { group } = await api('POST', '/groups', { name: e.target.name.value });
      await switchTo(group.id, `${group.name} created. Share its invite code from the DM page.`);
    } catch (error) { showError(e.target, error); }
  });
  main.querySelector('#groups').addEventListener('click', async (e) => {
    const show = e.target.closest('[data-show]');
    if (show) { await setGroup(show.dataset.show); toast(`Now showing ${state.group.name}.`); reloadPage(); return; }
    const leave = e.target.closest('[data-leave]');
    if (!leave) return;
    const ok = await confirmDialog({
      title: 'Leave group?',
      message: `You will leave "${leave.dataset.name}". Your characters stay on your account, but the DM will no longer see them. If you are the last member, the group and its notes, encounters and homebrew are deleted.`,
      confirmLabel: 'Leave group',
      danger: true,
    });
    if (!ok) return;
    try {
      const { deleted } = await api('DELETE', `/groups/${leave.dataset.leave}/membership`);
      await switchTo(state.group?.id === leave.dataset.leave ? null : state.group?.id, deleted ? 'Group deleted.' : 'You left the group.');
    } catch (error) { toast(error.message, 'error'); }
  });

  main.querySelector('#pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    form.querySelectorAll('.error').forEach((el) => { el.hidden = true; });
    try {
      await api('POST', '/auth/password', { current: form.current.value, next: form.next.value });
      form.reset();
      toast('Password updated.');
    } catch (error) { showError(form, error); }
  });

  if (u.isAdmin) adminSection(main.querySelector('#admin'));
}

/** Site admin only: every account, with "Set password" and "Make admin". */
async function adminSection(box) {
  const { users } = await api('GET', '/admin/users');
  box.innerHTML = `
    <h2>All accounts</h2>
    <p class="small muted">You are the site admin. Set a temporary password for anyone who is locked out and tell them in person.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Username</th><th>Groups</th><th>Actions</th></tr></thead>
      <tbody>${users.map((x) => `<tr>
        <td><b>${esc(x.displayName)}</b>${x.isAdmin ? ' <span class="badge gold">Admin</span>' : ''}${x.id === state.user.id ? ' (you)' : ''}</td>
        <td>${esc(x.username)}</td><td>${esc(x.groups || '-')}</td>
        <td><div class="row">${x.id === state.user.id ? '' : `
          <button class="btn sm" data-pw="${x.id}" data-name="${esc(x.displayName)}">Set password</button>
          <button class="btn sm ghost" data-admin="${x.isAdmin ? '' : '1'}" data-id="${x.id}" data-name="${esc(x.displayName)}">${x.isAdmin ? 'Remove admin' : 'Make admin'}</button>`}</div></td></tr>`).join('')}</tbody></table></div>`;

  box.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.id && 'admin' in btn.dataset) {
      const making = btn.dataset.admin === '1';
      const ok = await confirmDialog({
        title: making ? 'Make site admin?' : 'Remove site admin?',
        message: making ? `${btn.dataset.name} will be able to reset anyone's password and make other admins.` : `${btn.dataset.name} will no longer be a site admin.`,
        confirmLabel: making ? 'Make admin' : 'Remove admin',
      });
      if (!ok) return;
      try { await api('PUT', `/admin/users/${btn.dataset.id}/admin`, { isAdmin: making }); reloadPage(); } catch (err) { toast(err.message, 'error'); }
    }
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
