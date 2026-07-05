<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Family Tree</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

      :root {
        --bg: #182119;
        --bg-grain: #1c2620;
        --surface: #232d1d;
        --surface-2: #2c3824;
        --ink: #f3ecda;
        --ink-dim: #aab49a;
        --brass: #c9a24b;
        --brass-soft: #8c7638;
        --line: rgba(201, 162, 75, 0.5);
        --danger: #d97b64;
        --radius: 10px;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        height: 100%;
      }
      body {
        margin: 0;
        background: radial-gradient(ellipse at top, #202b1c 0%, var(--bg) 55%);
        color: var(--ink);
        font-family: 'Inter', sans-serif;
        overflow-x: hidden;
        min-height: 100vh;
      }

      /* ---------- header ---------- */
      header {
        padding: 28px 24px 18px;
        text-align: center;
        border-bottom: 1px solid rgba(201, 162, 75, 0.18);
      }
      header .eyebrow {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--brass);
        margin-bottom: 6px;
      }
      header h1 {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-optical-sizing: auto;
        font-size: clamp(26px, 4vw, 38px);
        margin: 0;
        letter-spacing: -0.01em;
      }
      header p.sub {
        color: var(--ink-dim);
        font-size: 13px;
        margin: 8px 0 0;
      }

      /* ---------- onboarding ---------- */
      #onboard {
        max-width: 420px;
        margin: 12vh auto;
        padding: 0 24px;
        text-align: center;
      }
      #onboard .leaf {
        width: 34px;
        height: 34px;
        margin: 0 auto 18px;
        opacity: 0.9;
      }
      #onboard h2 {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 24px;
        margin: 0 0 8px;
      }
      #onboard p {
        color: var(--ink-dim);
        font-size: 14px;
        line-height: 1.5;
        margin: 0 0 22px;
      }
      #onboard input {
        width: 100%;
        padding: 13px 14px;
        background: var(--surface);
        border: 1px solid var(--brass-soft);
        border-radius: var(--radius);
        color: var(--ink);
        font-family: 'Fraunces', serif;
        font-size: 18px;
        text-align: center;
        outline: none;
      }
      #onboard input:focus {
        border-color: var(--brass);
      }
      #onboard button {
        margin-top: 14px;
        width: 100%;
      }

      /* ---------- buttons ---------- */
      button {
        font-family: 'Inter', sans-serif;
        cursor: pointer;
      }
      .btn {
        background: var(--brass);
        color: #1b2314;
        border: none;
        padding: 12px 18px;
        border-radius: var(--radius);
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.01em;
      }
      .btn:hover {
        background: #d8b45f;
      }
      .btn.ghost {
        background: transparent;
        color: var(--ink-dim);
        border: 1px solid rgba(201, 162, 75, 0.35);
      }
      .btn.ghost:hover {
        color: var(--ink);
        border-color: var(--brass);
      }
      .btn.small {
        padding: 8px 12px;
        font-size: 12px;
      }
      .btn.danger {
        background: var(--danger);
        color: #2a1410;
      }
      .btn.danger:hover {
        background: #e6907a;
      }

      /* ---------- stage / focused view ---------- */
      #wrap {
        display: none;
        position: relative;
      }
      #toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: linear-gradient(var(--bg) 70%, transparent);
        backdrop-filter: blur(2px);
      }
      #toolbar .status {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        color: var(--ink-dim);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #toolbar .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--brass);
        box-shadow: 0 0 6px var(--brass);
      }

      #stage {
        max-width: 640px;
        margin: 0 auto;
        padding: 18px 20px 110px;
      }

      #backBtn {
        display: none;
        margin: 0 auto 16px;
      }

      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 2px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        color: var(--ink-dim);
        margin-bottom: 22px;
      }
      .breadcrumb .crumb {
        cursor: pointer;
        padding: 2px 3px;
      }
      .breadcrumb .crumb:hover {
        color: var(--brass);
      }
      .breadcrumb .crumb.current {
        color: var(--ink);
        cursor: default;
      }
      .breadcrumb .sep {
        color: var(--brass-soft);
        padding: 2px 0;
      }

      .up-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-bottom: 10px;
      }
      .pill {
        background: var(--surface-2);
        border: 1px solid rgba(201, 162, 75, 0.32);
        color: var(--ink-dim);
        border-radius: 999px;
        padding: 7px 15px;
        font-size: 12px;
        font-family: 'IBM Plex Mono', monospace;
      }
      .pill:hover {
        color: var(--ink);
        border-color: var(--brass);
      }
      .pill.add {
        border-style: dashed;
        color: var(--brass-soft);
      }
      .pill.add:hover {
        color: var(--brass);
      }

      .stem {
        width: 1px;
        height: 26px;
        background: var(--line);
        margin: 0 auto;
      }

      .focus-wrap {
        display: flex;
        justify-content: center;
        margin-bottom: 2px;
      }

      .card {
        position: relative;
        background: var(--surface);
        border: 1px solid rgba(201, 162, 75, 0.28);
        border-radius: var(--radius);
        padding: 14px 16px 12px;
        min-width: 150px;
        max-width: 190px;
        text-align: center;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
      }
      .card::before,
      .card::after {
        content: '';
        position: absolute;
        width: 6px;
        height: 6px;
        border: 1px solid var(--brass-soft);
      }
      .card::before {
        top: 5px;
        left: 5px;
        border-right: none;
        border-bottom: none;
      }
      .card::after {
        bottom: 5px;
        right: 5px;
        border-left: none;
        border-top: none;
      }
      .card.root {
        border-color: var(--brass);
      }
      .card .name {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 16px;
        line-height: 1.25;
        word-break: break-word;
      }
      .card .dob {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10.5px;
        color: var(--ink-dim);
        margin-top: 4px;
      }
      .card .root-tag {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--brass);
        margin-top: 3px;
        display: block;
      }
      .card .actions {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin-top: 10px;
      }
      .mini {
        background: var(--surface-2);
        border: 1px solid rgba(201, 162, 75, 0.3);
        color: var(--ink-dim);
        border-radius: 6px;
        padding: 5px 8px;
        font-size: 11px;
        font-family: 'IBM Plex Mono', monospace;
      }
      .mini:hover {
        color: var(--ink);
        border-color: var(--brass);
      }
      .mini.edit {
        display: inline-block;
        width: auto;
        margin-top: 8px;
        background: transparent;
        border: none;
        color: var(--ink-dim);
        text-decoration: underline;
        text-underline-offset: 2px;
        font-size: 10px;
        padding: 2px 6px;
      }
      .mini.edit:hover {
        color: var(--brass);
        border-color: transparent;
      }
      .focus-links {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 2px;
      }

      /* focus card sits larger than child cards */
      .card.focus {
        min-width: 190px;
        max-width: 230px;
        padding: 20px 20px 16px;
      }
      .card.focus .name {
        font-size: 21px;
      }
      .card.focus .dob {
        font-size: 11.5px;
      }

      .children-section {
        margin-top: 8px;
      }
      .children-header {
        text-align: center;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--brass-soft);
        margin-bottom: 16px;
      }
      .children-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        justify-content: center;
      }
      .child-card {
        width: 150px;
        cursor: pointer;
        transition:
          transform 0.15s ease,
          border-color 0.15s ease;
      }
      .child-card:hover {
        border-color: var(--brass);
        transform: translateY(-3px);
      }
      .child-card .see-more {
        display: block;
        margin-top: 8px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.04em;
        color: var(--brass);
      }
      .child-card .see-more::after {
        content: ' ↓';
      }

      .delete-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--surface-2);
        border: 1px solid rgba(201, 162, 75, 0.4);
        color: var(--ink-dim);
        font-size: 13px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 5;
        padding: 0;
      }
      .delete-btn:hover {
        background: var(--danger);
        border-color: var(--danger);
        color: #2a1410;
      }

      .add-tile {
        width: 150px;
        min-height: 78px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: transparent;
        border: 1px dashed rgba(201, 162, 75, 0.4);
        border-radius: var(--radius);
        color: var(--brass-soft);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12px;
        cursor: pointer;
      }
      .add-tile:hover {
        color: var(--brass);
        border-color: var(--brass);
      }

      .empty-note {
        text-align: center;
        color: var(--ink-dim);
        font-size: 13px;
        margin-bottom: 16px;
      }

      footer {
        text-align: center;
        padding: 18px;
        color: var(--ink-dim);
        font-size: 11px;
        font-family: 'IBM Plex Mono', monospace;
      }

      /* ---------- modal ---------- */
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(10, 14, 9, 0.72);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }
      .overlay.open {
        display: flex;
      }
      .modal {
        background: var(--surface);
        border: 1px solid var(--brass-soft);
        border-radius: var(--radius);
        padding: 26px;
        width: 90%;
        max-width: 340px;
        text-align: center;
      }
      .modal .kicker {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--brass);
        margin-bottom: 6px;
      }
      .modal h3 {
        font-family: 'Fraunces', serif;
        font-size: 19px;
        margin: 0 0 16px;
        font-weight: 600;
      }
      .modal p.hint {
        color: var(--ink-dim);
        font-size: 12.5px;
        margin: -10px 0 16px;
      }
      .modal input,
      .modal select {
        width: 100%;
        padding: 11px 12px;
        background: var(--bg);
        border: 1px solid rgba(201, 162, 75, 0.35);
        border-radius: 8px;
        color: var(--ink);
        font-size: 15px;
        outline: none;
        margin-bottom: 16px;
        font-family: 'Inter', sans-serif;
        color-scheme: dark;
      }
      .modal input:focus,
      .modal select:focus {
        border-color: var(--brass);
      }
      .modal .error-msg {
        display: none;
        text-align: left;
        color: var(--danger);
        font-size: 12.5px;
        line-height: 1.4;
        margin: -10px 0 14px;
      }
      .modal .error-msg.show {
        display: block;
      }
      .modal .row {
        display: flex;
        gap: 10px;
      }
      .modal .row button {
        flex: 1;
      }
      .modal .clear-link {
        display: inline-block;
        margin-top: 14px;
        background: none;
        border: none;
        color: var(--ink-dim);
        font-size: 11.5px;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .modal .clear-link:hover {
        color: var(--danger);
      }
      .modal p.body-text {
        color: var(--ink-dim);
        font-size: 13px;
        line-height: 1.55;
        margin: 0 0 18px;
        text-align: left;
      }

      @media (max-width: 520px) {
        .card.focus {
          min-width: 170px;
          max-width: 210px;
          padding: 16px 14px 14px;
        }
        .card.focus .name {
          font-size: 18px;
        }
        .child-card,
        .add-tile {
          width: 130px;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Lineage Registry</div>
      <h1 id="pageTitle">Family Tree</h1>
      <p class="sub">
        Move up to parents or down into children. Everyone with this link edits
        the same record.
      </p>
    </header>

    <div id="onboard">
      <svg
        class="leaf"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#c9a24b"
        stroke-width="1.4"
      >
        <path d="M12 2C7 6 4 11 4 15a8 8 0 0016 0c0-4-3-9-8-13z" />
        <path d="M12 8v13" />
      </svg>
      <h2>Start the tree</h2>
      <p>
        Enter the first name. Everyone who opens this link afterward can branch
        out from it.
      </p>
      <input
        id="rootInput"
        type="text"
        placeholder="e.g. Dambudzo"
        autocomplete="off"
      />
      <button class="btn" id="rootSubmit">Plant the first name</button>
    </div>

    <div id="wrap">
      <div id="toolbar">
        <div class="status">
          <span class="dot"></span><span id="statusText">synced</span>
        </div>
        <button class="btn ghost small" id="refreshBtn">Refresh</button>
      </div>
      <div id="stage">
        <button class="btn ghost small" id="backBtn">← Back</button>
        <div class="breadcrumb" id="breadcrumb"></div>
        <div class="up-row" id="upRow"></div>
        <div class="focus-wrap" id="focusWrap"></div>
        <div class="stem"></div>
        <div class="children-section">
          <div class="children-header" id="childrenHeader">Children</div>
          <div class="children-grid" id="childrenGrid"></div>
        </div>
      </div>
    </div>

    <footer>Shared registry &middot; changes save automatically</footer>

    <!-- name add/edit modal -->
    <div class="overlay" id="overlay">
      <div class="modal">
        <div class="kicker" id="modalKicker">Add relative</div>
        <h3 id="modalTitle">Add a name</h3>
        <input
          id="modalInput"
          type="text"
          placeholder="Full name"
          autocomplete="off"
        />
        <div class="row">
          <button class="btn ghost" id="modalCancel">Cancel</button>
          <button class="btn" id="modalConfirm">Add</button>
        </div>
      </div>
    </div>

    <!-- duplicate-person match modal -->
    <div class="overlay" id="matchOverlay">
      <div class="modal">
        <div class="kicker">Possible match</div>
        <h3 id="matchTitle">Is this the same person?</h3>
        <p id="matchBody" class="body-text"></p>
        <div
          id="matchOptions"
          style="
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 8px;
          "
        ></div>
        <button
          class="btn ghost"
          id="matchCancel"
          style="width: 100%; margin-top: 8px"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- birth date modal -->
    <div class="overlay" id="dobOverlay">
      <div class="modal">
        <div class="kicker">Birth date</div>
        <h3 id="dobTitle">Add a birth date</h3>
        <p class="hint">Optional — leave blank if unknown.</p>
        <input id="dobInput" type="date" />
        <p class="error-msg" id="dobError">Please enter a valid date.</p>
        <div class="row">
          <button class="btn ghost" id="dobCancel">Cancel</button>
          <button class="btn" id="dobConfirm">Save</button>
        </div>
        <button class="clear-link" id="dobClear">Clear birth date</button>
      </div>
    </div>

    <!-- shared-children sync modal -->
    <div class="overlay" id="syncOverlay">
      <div class="modal">
        <div class="kicker">Shared child found</div>
        <h3 id="syncTitle">Two parents share a child</h3>
        <p id="syncBody" class="body-text"></p>
        <div class="row">
          <button class="btn ghost" id="syncNo">No, keep separate</button>
          <button class="btn" id="syncYes">Yes, merge children</button>
        </div>
      </div>
    </div>

    <!-- delete confirmation modal -->
    <div class="overlay" id="deleteOverlay">
      <div class="modal">
        <div class="kicker">Remove person</div>
        <h3 id="deleteTitle">Delete this person?</h3>
        <p id="deleteBody" class="body-text" style="text-align: center"></p>
        <div class="row">
          <button class="btn ghost" id="deleteCancel">Cancel</button>
          <button class="btn danger" id="deleteConfirmBtn">Delete</button>
        </div>
      </div>
    </div>

    <!-- inheritance modal (shown when the person being deleted has children) -->
    <div class="overlay" id="inheritOverlay">
      <div class="modal">
        <div class="kicker">Has children</div>
        <h3 id="inheritTitle">What happens to their children?</h3>
        <p id="inheritBody" class="body-text"></p>
        <select id="inheritSelect">
          <option value="">— Choose someone to inherit them —</option>
        </select>
        <div class="row" style="margin-bottom: 12px">
          <button class="btn ghost" id="inheritCancel">Cancel</button>
          <button class="btn" id="inheritReassignBtn" disabled>
            Reassign &amp; delete
          </button>
        </div>
        <button
          class="clear-link"
          id="inheritDeleteAllBtn"
          style="color: var(--danger)"
        >
          Delete all their children too
        </button>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="app.js"></script>
  </body>
</html>