function run() {
  /* ====== SUPABASE CONFIG — fill these in from Project Settings → API ====== */
  const SUPABASE_URL = 'https://rcmlxanyyhhbgzysxkah.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbWx4YW55eWhoYmd6eXN4a2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODcyNzMsImV4cCI6MjA5ODQ2MzI3M30.6aAG-KB2dABmEe-1B3lZ1d8acOhXz9aeZIIi68v039U';
  const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  /* =========================================================================== */

  const STORAGE_KEY = 'family-tree-data';
  let tree = null; // { nodes: {id: {id,name,dob,parents:[],children:[]}}, rootId, nextId }
  let lastHash = null;
  let pendingAction = null; // { nodeId, type: 'parent'|'child'|'edit' }
  let pendingDobNode = null;
  let pendingDeleteId = null;
  let syncQueue = [];
  let navHistory = []; // stack of previously visited node ids, for the Back button
  let pollTimer = null;
  let modalOpen = false;

  const els = {
    onboard: document.getElementById('onboard'),
    wrap: document.getElementById('wrap'),
    breadcrumb: document.getElementById('breadcrumb'),
    upRow: document.getElementById('upRow'),
    focusWrap: document.getElementById('focusWrap'),
    childrenHeader: document.getElementById('childrenHeader'),
    childrenGrid: document.getElementById('childrenGrid'),
    backBtn: document.getElementById('backBtn'),
    overlay: document.getElementById('overlay'),
    modalKicker: document.getElementById('modalKicker'),
    modalTitle: document.getElementById('modalTitle'),
    modalInput: document.getElementById('modalInput'),
    statusText: document.getElementById('statusText'),
    matchOverlay: document.getElementById('matchOverlay'),
    matchTitle: document.getElementById('matchTitle'),
    matchBody: document.getElementById('matchBody'),
    matchOptions: document.getElementById('matchOptions'),
    matchCancel: document.getElementById('matchCancel'),
    dobOverlay: document.getElementById('dobOverlay'),
    dobTitle: document.getElementById('dobTitle'),
    dobInput: document.getElementById('dobInput'),
    dobError: document.getElementById('dobError'),
    dobConfirm: document.getElementById('dobConfirm'),
    dobCancel: document.getElementById('dobCancel'),
    dobClear: document.getElementById('dobClear'),
    syncOverlay: document.getElementById('syncOverlay'),
    syncTitle: document.getElementById('syncTitle'),
    syncBody: document.getElementById('syncBody'),
    syncYes: document.getElementById('syncYes'),
    syncNo: document.getElementById('syncNo'),
    deleteOverlay: document.getElementById('deleteOverlay'),
    deleteTitle: document.getElementById('deleteTitle'),
    deleteBody: document.getElementById('deleteBody'),
    deleteCancel: document.getElementById('deleteCancel'),
    deleteConfirmBtn: document.getElementById('deleteConfirmBtn'),
    inheritOverlay: document.getElementById('inheritOverlay'),
    inheritTitle: document.getElementById('inheritTitle'),
    inheritBody: document.getElementById('inheritBody'),
    inheritSelect: document.getElementById('inheritSelect'),
    inheritCancel: document.getElementById('inheritCancel'),
    inheritReassignBtn: document.getElementById('inheritReassignBtn'),
    inheritDeleteAllBtn: document.getElementById('inheritDeleteAllBtn'),
  };

  let currentId = null; // id of the person currently focused on stage

  function hash(obj) {
    return JSON.stringify(obj);
  }

  async function loadTree() {
    try {
      const { data, error } = await supa
        .from('kv_store')
        .select('value')
        .eq('key', STORAGE_KEY)
        .maybeSingle();
      if (error || !data) return null;
      return data.value;
    } catch (e) {
      console.error('Load error', e);
      return null;
    }
  }

  async function saveTree() {
    try {
      const { error } = await supa.from('kv_store').upsert({
        key: STORAGE_KEY,
        value: tree,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      lastHash = hash(tree);
      setStatus('synced');
    } catch (e) {
      setStatus('save failed — retrying');
      console.error('Storage error', e);
    }
  }

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function newNode(name) {
    const id = 'p' + tree.nextId++;
    tree.nodes[id] = { id, name, dob: null, parents: [], children: [] };
    return id;
  }

  /* ---------------- onboarding ---------------- */
  document.getElementById('rootSubmit').addEventListener('click', startTree);
  document.getElementById('rootInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startTree();
  });

  async function startTree() {
    const name = document.getElementById('rootInput').value.trim();
    if (!name) return;
    tree = { nodes: {}, rootId: null, nextId: 1 };
    const id = newNode(name);
    tree.rootId = id;
    await saveTree();
    showTree();
  }

  /* ---------------- init ---------------- */
  async function init() {
    const existing = await loadTree();
    if (existing && existing.rootId) {
      tree = existing;
      lastHash = hash(tree);
      showTree();
    } else {
      els.onboard.style.display = 'block';
    }
    pollTimer = setInterval(pollForUpdates, 4000);
  }

  async function pollForUpdates() {
    if (modalOpen) return;
    const fresh = await loadTree();
    if (fresh && hash(fresh) !== lastHash) {
      tree = fresh;
      lastHash = hash(tree);
      render();
      setStatus('updated by another device');
      setTimeout(() => setStatus('synced'), 2500);
    }
  }

  function showTree() {
    els.onboard.style.display = 'none';
    els.wrap.style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Dambudzo Family Tree';
    if (!currentId || !tree.nodes[currentId]) currentId = tree.rootId;
    navHistory = [];
    render();
  }

  document.getElementById('refreshBtn').addEventListener('click', async () => {
    setStatus('refreshing…');
    const fresh = await loadTree();
    if (fresh) {
      tree = fresh;
      lastHash = hash(tree);
    }
    render();
    setStatus('synced');
  });

  /* ---------------- navigation ---------------- */
  function navigate(id) {
    if (!tree.nodes[id]) return;
    if (currentId && currentId !== id) navHistory.push(currentId);
    currentId = id;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    while (navHistory.length) {
      const prev = navHistory.pop();
      if (tree.nodes[prev]) {
        currentId = prev;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
  }

  els.backBtn.addEventListener('click', goBack);

  function updateBackButton() {
    els.backBtn.style.display = navHistory.length > 0 ? 'block' : 'none';
  }

  // shortest path from root to target, walking parent/child edges in either direction
  function pathFromRoot(targetId) {
    if (targetId === tree.rootId) return [tree.rootId];
    const visited = new Set([tree.rootId]);
    const queue = [[tree.rootId]];
    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      const node = tree.nodes[last];
      if (!node) continue;
      const neighbors = [...node.parents, ...node.children];
      for (const n of neighbors) {
        if (visited.has(n)) continue;
        visited.add(n);
        const newPath = [...path, n];
        if (n === targetId) return newPath;
        queue.push(newPath);
      }
    }
    return [targetId]; // fallback, shouldn't normally happen
  }

  /* ---------------- date helpers ---------------- */
  function formatDob(dob) {
    if (!dob) return '';
    const d = new Date(dob + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatDobYear(dob) {
    if (!dob) return '';
    return dob.slice(0, 4);
  }

  // all ancestors (parents, grandparents, ...) of a node, not including itself
  function getAllAncestors(id) {
    const visited = new Set();
    const queue = [...(tree.nodes[id]?.parents || [])];
    while (queue.length) {
      const pid = queue.shift();
      if (visited.has(pid) || !tree.nodes[pid]) continue;
      visited.add(pid);
      queue.push(...tree.nodes[pid].parents);
    }
    return [...visited].map((i) => tree.nodes[i]);
  }

  // all descendants (children, grandchildren, ...) of a node, not including itself
  function getAllDescendants(id) {
    const visited = new Set();
    const queue = [...(tree.nodes[id]?.children || [])];
    while (queue.length) {
      const cid = queue.shift();
      if (visited.has(cid) || !tree.nodes[cid]) continue;
      visited.add(cid);
      queue.push(...tree.nodes[cid].children);
    }
    return [...visited].map((i) => tree.nodes[i]);
  }

  /* ---------------- shared-child co-parent sync ---------------- */
  function listNames(nodes, max = 4) {
    const names = nodes.map((n) => n.name);
    if (names.length <= max) return names.join(', ');
    return names.slice(0, max).join(', ') + ` +${names.length - max} more`;
  }

  // returns { missingInB, missingInA } — node objects each parent has that the other doesn't
  function computeChildDiff(parentId, op) {
    const aChildren = new Set(tree.nodes[parentId].children);
    const bChildren = new Set(tree.nodes[op].children);
    const missingInB = [...aChildren]
      .filter((c) => !bChildren.has(c))
      .map((id) => tree.nodes[id])
      .filter(Boolean);
    const missingInA = [...bChildren]
      .filter((c) => !aChildren.has(c))
      .map((id) => tree.nodes[id])
      .filter(Boolean);
    return { missingInB, missingInA };
  }

  // links parentId as a parent of childId, unless doing so would create a cycle
  function linkParentChildSafe(parentId, childId) {
    if (!tree.nodes[parentId] || !tree.nodes[childId]) return;
    if (parentId === childId) return;
    const descendantsOfChild = new Set(
      getAllDescendants(childId).map((n) => n.id),
    );
    if (descendantsOfChild.has(parentId)) return; // would create a cycle
    if (!tree.nodes[parentId].children.includes(childId))
      tree.nodes[parentId].children.push(childId);
    if (!tree.nodes[childId].parents.includes(parentId))
      tree.nodes[childId].parents.push(parentId);
  }

  // when parentId and some other parent(s) both end up as parents of childId,
  // queue a prompt offering to merge each pair's full children lists together
  function queueCoParentSync(parentId, childId) {
    const others = (tree.nodes[childId]?.parents || []).filter(
      (id) => id !== parentId && tree.nodes[id],
    );
    others.forEach((op) => {
      const { missingInB, missingInA } = computeChildDiff(parentId, op);
      if (missingInB.length || missingInA.length) {
        syncQueue.push({
          parentId,
          op,
          missingInB,
          missingInA,
          childId,
        });
      }
    });
  }

  function startSyncQueueIfNeeded() {
    if (syncQueue.length === 0) return;
    modalOpen = true;
    showSyncModal(syncQueue[0]);
  }

  function showSyncModal(item) {
    const pA = tree.nodes[item.parentId];
    const pOp = tree.nodes[item.op];
    const child = tree.nodes[item.childId];
    if (!pA || !pOp || !child) {
      syncQueue.shift();
      startSyncQueueIfNeeded();
      return;
    }
    els.syncTitle.textContent = `${pA.name} and ${pOp.name} share a child`;

    const lines = [`Both are listed as parents of ${child.name}.`];
    if (item.missingInB.length) {
      lines.push(
        `${pA.name} also has: ${listNames(item.missingInB)}. Add ${item.missingInB.length === 1 ? 'them' : 'these'} as ${pOp.name}'s child${item.missingInB.length === 1 ? '' : 'ren'} too?`,
      );
    }
    if (item.missingInA.length) {
      lines.push(
        `${pOp.name} also has: ${listNames(item.missingInA)}. Add ${item.missingInA.length === 1 ? 'them' : 'these'} as ${pA.name}'s child${item.missingInA.length === 1 ? '' : 'ren'} too?`,
      );
    }
    els.syncBody.textContent = lines.join(' ');
    els.syncOverlay.classList.add('open');
  }

  async function resolveSyncPrompt(accept) {
    const item = syncQueue.shift();
    els.syncOverlay.classList.remove('open');
    if (accept && item) {
      item.missingInB.forEach((c) => linkParentChildSafe(item.op, c.id));
      item.missingInA.forEach((c) => linkParentChildSafe(item.parentId, c.id));
      render();
      setStatus('saving…');
      await saveTree();
    }
    if (syncQueue.length > 0) {
      showSyncModal(syncQueue[0]);
    } else {
      modalOpen = false;
      setStatus('synced');
    }
  }

  els.syncYes.addEventListener('click', () => resolveSyncPrompt(true));
  els.syncNo.addEventListener('click', () => resolveSyncPrompt(false));

  // returns { valid: true } or { valid: false, message: '...' }
  function validateDob(nodeId, dobStr) {
    if (!dobStr) return { valid: true }; // clearing / leaving blank is always fine
    const candidate = new Date(dobStr + 'T00:00:00');

    const ancestors = getAllAncestors(nodeId).filter((a) => a.dob);
    for (const a of ancestors) {
      const aDate = new Date(a.dob + 'T00:00:00');
      if (candidate <= aDate) {
        return {
          valid: false,
          message: `Please enter a valid date — it must be after ${a.name}'s birth date (${formatDob(a.dob)}), since ${a.name} is an ancestor.`,
        };
      }
    }

    const descendants = getAllDescendants(nodeId).filter((d) => d.dob);
    for (const d of descendants) {
      const dDate = new Date(d.dob + 'T00:00:00');
      if (candidate >= dDate) {
        return {
          valid: false,
          message: `Please enter a valid date — it must be before ${d.name}'s birth date (${formatDob(d.dob)}), since ${d.name} is a descendant.`,
        };
      }
    }

    return { valid: true };
  }

  /* ---------------- render ---------------- */
  function render() {
    const node = tree.nodes[currentId];
    if (!node) return;

    updateBackButton();
    renderBreadcrumb();
    renderUpRow(node);
    els.focusWrap.innerHTML = '';
    els.focusWrap.appendChild(buildFocusCard(currentId));
    renderChildren(node);
  }

  function renderBreadcrumb() {
    const path = pathFromRoot(currentId);
    els.breadcrumb.innerHTML = '';
    path.forEach((id, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '›';
        els.breadcrumb.appendChild(sep);
      }
      const crumb = document.createElement('span');
      crumb.className = 'crumb' + (id === currentId ? ' current' : '');
      crumb.textContent = tree.nodes[id].name;
      if (id !== currentId) crumb.addEventListener('click', () => navigate(id));
      els.breadcrumb.appendChild(crumb);
    });
  }

  function renderUpRow(node) {
    els.upRow.innerHTML = '';
    node.parents.forEach((pid) => {
      const p = tree.nodes[pid];
      if (!p) return;
      const pill = document.createElement('button');
      pill.className = 'pill';
      pill.textContent = '↑ ' + p.name;
      pill.addEventListener('click', () => navigate(pid));
      els.upRow.appendChild(pill);
    });
    const addPill = document.createElement('button');
    addPill.className = 'pill add';
    addPill.textContent = '+ Parent';
    addPill.addEventListener('click', () => openModal(currentId, 'parent'));
    els.upRow.appendChild(addPill);
  }

  function buildFocusCard(id) {
    const node = tree.nodes[id];
    const card = document.createElement('div');
    card.className = 'card focus' + (id === tree.rootId ? ' root' : '');
    card.dataset.id = id;

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = node.name;
    card.appendChild(name);

    if (node.dob) {
      const dob = document.createElement('div');
      dob.className = 'dob';
      dob.textContent = 'b. ' + formatDob(node.dob);
      card.appendChild(dob);
    }

    if (id === tree.rootId) {
      const tag = document.createElement('span');
      tag.className = 'root-tag';
      tag.textContent = 'Root';
      card.appendChild(tag);
    }

    const links = document.createElement('div');
    links.className = 'focus-links';

    const edit = document.createElement('button');
    edit.className = 'mini edit';
    edit.textContent = 'Edit name';
    edit.addEventListener('click', () => openModal(id, 'edit'));
    links.appendChild(edit);

    const dobBtn = document.createElement('button');
    dobBtn.className = 'mini edit';
    dobBtn.textContent = node.dob ? 'Edit birth date' : 'Add birth date';
    dobBtn.addEventListener('click', () => openDobModal(id));
    links.appendChild(dobBtn);

    card.appendChild(links);

    return card;
  }

  function renderChildren(node) {
    const count = node.children.length;
    els.childrenHeader.textContent =
      count === 0
        ? 'No children yet'
        : count === 1
          ? '1 Child'
          : count + ' Children';
    els.childrenGrid.innerHTML = '';

    node.children.forEach((cid) => {
      const child = tree.nodes[cid];
      if (!child) return;
      const card = document.createElement('div');
      card.className = 'card child-card';
      card.dataset.id = cid;

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.innerHTML = '&times;';
      del.title = 'Delete ' + child.name;
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirm(cid);
      });
      card.appendChild(del);

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = child.name;
      card.appendChild(name);

      if (child.dob) {
        const dob = document.createElement('div');
        dob.className = 'dob';
        dob.textContent = 'b. ' + formatDobYear(child.dob);
        card.appendChild(dob);
      }

      if (child.children.length > 0) {
        const more = document.createElement('span');
        more.className = 'see-more';
        more.textContent =
          child.children.length === 1
            ? 'See child'
            : `See ${child.children.length} children`;
        card.appendChild(more);
      }

      card.addEventListener('click', () => navigate(cid));
      els.childrenGrid.appendChild(card);
    });

    const addTile = document.createElement('div');
    addTile.className = 'add-tile';
    addTile.textContent = '+ Add child';
    addTile.addEventListener('click', () => openModal(currentId, 'child'));
    els.childrenGrid.appendChild(addTile);
  }

  /* ---------------- name modal ---------------- */
  function openModal(nodeId, type) {
    pendingAction = { nodeId, type };
    modalOpen = true;
    const personName = tree.nodes[nodeId].name;
    if (type === 'parent') {
      els.modalKicker.textContent = 'Add parent';
      els.modalTitle.textContent = `Add a parent of ${personName}`;
      els.modalInput.value = '';
    } else if (type === 'child') {
      els.modalKicker.textContent = 'Add child';
      els.modalTitle.textContent = `Add a child of ${personName}`;
      els.modalInput.value = '';
    } else {
      els.modalKicker.textContent = 'Edit name';
      els.modalTitle.textContent = `Rename ${personName}`;
      els.modalInput.value = personName;
    }
    document.getElementById('modalConfirm').textContent =
      type === 'edit' ? 'Save' : 'Add';
    els.overlay.classList.add('open');
    setTimeout(() => {
      els.modalInput.focus();
      els.modalInput.select();
    }, 50);
  }

  function closeModal() {
    els.overlay.classList.remove('open');
    els.matchOverlay.classList.remove('open');
    modalOpen = false;
    pendingAction = null;
  }

  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document
    .getElementById('modalConfirm')
    .addEventListener('click', confirmModal);
  els.modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmModal();
  });
  els.overlay.addEventListener('click', (e) => {
    if (e.target === els.overlay) closeModal();
  });

  async function confirmModal() {
    const name = els.modalInput.value.trim();
    if (!name || !pendingAction) return;
    const { nodeId, type } = pendingAction;

    if (type === 'edit') {
      tree.nodes[nodeId].name = name;
      if (nodeId === tree.rootId) {
        document.getElementById('pageTitle').textContent =
          name + ' Family Tree';
      }
      closeModal();
      render();
      setStatus('saving…');
      await saveTree();
      return;
    }

    // check for existing people with the same name elsewhere in the tree,
    // excluding the current node itself and anyone already directly linked to it
    const already = new Set([
      nodeId,
      ...tree.nodes[nodeId].parents,
      ...tree.nodes[nodeId].children,
    ]);
    const matches = Object.values(tree.nodes).filter(
      (n) =>
        n.name.trim().toLowerCase() === name.toLowerCase() &&
        !already.has(n.id),
    );

    if (matches.length > 0) {
      showMatchModal(nodeId, type, name, matches);
    } else {
      await finalizeNewPerson(nodeId, type, name);
    }
  }

  async function finalizeNewPerson(nodeId, type, name) {
    const newId = newNode(name);
    if (type === 'parent') {
      tree.nodes[newId].children.push(nodeId);
      tree.nodes[nodeId].parents.push(newId);
    } else {
      tree.nodes[newId].parents.push(nodeId);
      tree.nodes[nodeId].children.push(newId);
    }
    closeModal();
    render();
    setStatus('saving…');
    await saveTree();
    if (type === 'parent') {
      queueCoParentSync(newId, nodeId);
      startSyncQueueIfNeeded();
    }
  }

  async function linkExistingPerson(nodeId, type, existingId) {
    let parentId, childId;
    if (type === 'parent') {
      if (!tree.nodes[nodeId].parents.includes(existingId))
        tree.nodes[nodeId].parents.push(existingId);
      if (!tree.nodes[existingId].children.includes(nodeId))
        tree.nodes[existingId].children.push(nodeId);
      parentId = existingId;
      childId = nodeId;
    } else {
      if (!tree.nodes[nodeId].children.includes(existingId))
        tree.nodes[nodeId].children.push(existingId);
      if (!tree.nodes[existingId].parents.includes(nodeId))
        tree.nodes[existingId].parents.push(nodeId);
      parentId = nodeId;
      childId = existingId;
    }
    closeModal();
    render();
    setStatus('saving…');
    await saveTree();
    queueCoParentSync(parentId, childId);
    startSyncQueueIfNeeded();
  }

  /* ---------------- match confirmation modal ---------------- */
  function showMatchModal(nodeId, type, name, matches) {
    const personName = tree.nodes[nodeId].name;
    const relWord = type === 'parent' ? 'parent' : 'child';
    els.matchTitle.textContent = `Found an existing "${name}"`;
    els.matchBody.textContent =
      matches.length === 1
        ? `There's already a "${name}" in the tree. Is that the same person as this new ${relWord} of ${personName}?`
        : `There are ${matches.length} people named "${name}" in the tree. Is one of them the same person as this new ${relWord} of ${personName}?`;

    els.matchOptions.innerHTML = '';
    matches.forEach((m) => {
      const btn = document.createElement('button');
      btn.className = 'btn ghost';
      btn.style.width = '100%';
      btn.textContent = `Yes, same person as "${m.name}"`;
      btn.addEventListener('click', () =>
        linkExistingPerson(nodeId, type, m.id),
      );
      els.matchOptions.appendChild(btn);
    });
    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.style.width = '100%';
    newBtn.textContent = 'No, this is a different person';
    newBtn.addEventListener('click', () =>
      finalizeNewPerson(nodeId, type, name),
    );
    els.matchOptions.appendChild(newBtn);

    els.overlay.classList.remove('open');
    els.matchOverlay.classList.add('open');
  }

  els.matchCancel.addEventListener('click', () => {
    els.matchOverlay.classList.remove('open');
    closeModal();
  });
  els.matchOverlay.addEventListener('click', (e) => {
    if (e.target === els.matchOverlay) {
      els.matchOverlay.classList.remove('open');
      closeModal();
    }
  });

  /* ---------------- birth date modal ---------------- */
  function openDobModal(nodeId) {
    pendingDobNode = nodeId;
    modalOpen = true;
    const node = tree.nodes[nodeId];
    els.dobTitle.textContent = node.dob
      ? `Edit ${node.name}'s birth date`
      : `Add ${node.name}'s birth date`;
    els.dobInput.value = node.dob || '';
    els.dobError.classList.remove('show');
    els.dobOverlay.classList.add('open');
    setTimeout(() => els.dobInput.focus(), 50);
  }

  function closeDobModal() {
    els.dobOverlay.classList.remove('open');
    els.dobError.classList.remove('show');
    modalOpen = false;
    pendingDobNode = null;
  }

  els.dobCancel.addEventListener('click', closeDobModal);
  els.dobOverlay.addEventListener('click', (e) => {
    if (e.target === els.dobOverlay) closeDobModal();
  });

  els.dobConfirm.addEventListener('click', async () => {
    if (!pendingDobNode) return;
    const value = els.dobInput.value; // '' if cleared, else 'YYYY-MM-DD'
    const result = validateDob(pendingDobNode, value);
    if (!result.valid) {
      els.dobError.textContent = result.message;
      els.dobError.classList.add('show');
      return;
    }
    tree.nodes[pendingDobNode].dob = value || null;
    closeDobModal();
    render();
    setStatus('saving…');
    await saveTree();
  });

  els.dobClear.addEventListener('click', async () => {
    if (!pendingDobNode) return;
    tree.nodes[pendingDobNode].dob = null;
    closeDobModal();
    render();
    setStatus('saving…');
    await saveTree();
  });

  /* ---------------- delete a person ---------------- */

  // fully removes nodeId from the tree, unlinking it from every
  // parent and child it currently has
  function deleteNodeCascade(nodeId) {
    const node = tree.nodes[nodeId];
    if (!node) return;
    node.parents.forEach((pid) => {
      if (tree.nodes[pid]) {
        tree.nodes[pid].children = tree.nodes[pid].children.filter(
          (c) => c !== nodeId,
        );
      }
    });
    node.children.forEach((cid) => {
      if (tree.nodes[cid]) {
        tree.nodes[cid].parents = tree.nodes[cid].parents.filter(
          (p) => p !== nodeId,
        );
      }
    });
    delete tree.nodes[nodeId];
    if (currentId === nodeId) currentId = tree.rootId;
    navHistory = navHistory.filter((id) => id !== nodeId);
  }

  // deletes nodeId and cascades down: a child is only deleted along
  // with it if nodeId was that child's ONLY parent — if the child has
  // another surviving parent, it's simply detached from nodeId instead
  function deleteSubtreeRecursive(nodeId) {
    const node = tree.nodes[nodeId];
    if (!node) return;
    const children = node.children.slice();
    children.forEach((cid) => {
      const child = tree.nodes[cid];
      if (!child) return;
      const remaining = child.parents.filter((p) => p !== nodeId);
      if (remaining.length === 0) {
        deleteSubtreeRecursive(cid);
      }
      // otherwise leave it — deleteNodeCascade below detaches the edge
    });
    deleteNodeCascade(nodeId);
  }

  function openDeleteConfirm(nodeId) {
    if (nodeId === tree.rootId) {
      setStatus("can't delete the root person");
      setTimeout(() => setStatus('synced'), 2500);
      return;
    }
    pendingDeleteId = nodeId;
    modalOpen = true;
    const node = tree.nodes[nodeId];
    els.deleteTitle.textContent = `Delete ${node.name}?`;
    els.deleteBody.textContent = `This removes ${node.name} from the tree. This can't be undone.`;
    els.deleteOverlay.classList.add('open');
  }

  function closeDeleteConfirm() {
    els.deleteOverlay.classList.remove('open');
    modalOpen = false;
    pendingDeleteId = null;
  }

  els.deleteCancel.addEventListener('click', closeDeleteConfirm);
  els.deleteOverlay.addEventListener('click', (e) => {
    if (e.target === els.deleteOverlay) closeDeleteConfirm();
  });

  els.deleteConfirmBtn.addEventListener('click', () => {
    const nodeId = pendingDeleteId;
    if (!nodeId || !tree.nodes[nodeId]) return;
    const node = tree.nodes[nodeId];
    els.deleteOverlay.classList.remove('open');
    if (node.children.length === 0) {
      finalizeSimpleDelete(nodeId);
    } else {
      openInheritModal(nodeId);
    }
  });

  async function finalizeSimpleDelete(nodeId) {
    deleteNodeCascade(nodeId);
    pendingDeleteId = null;
    modalOpen = false;
    render();
    setStatus('saving…');
    await saveTree();
  }

  function openInheritModal(nodeId) {
    pendingDeleteId = nodeId;
    modalOpen = true;
    const node = tree.nodes[nodeId];
    const kids = node.children.map((cid) => tree.nodes[cid]).filter(Boolean);

    els.inheritTitle.textContent = `${node.name} has ${
      kids.length === 1 ? '1 child' : kids.length + ' children'
    }`;
    els.inheritBody.textContent = `Before removing ${node.name}, decide what happens to: ${listNames(kids, 6)}.`;

    // candidates: everyone except this node and its own descendants (avoids cycles)
    const excluded = new Set([
      nodeId,
      ...getAllDescendants(nodeId).map((n) => n.id),
    ]);
    const candidates = Object.values(tree.nodes)
      .filter((n) => !excluded.has(n.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    els.inheritSelect.innerHTML =
      '<option value="">— Choose someone to inherit them —</option>';
    candidates.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.dob
        ? `${c.name} (b. ${formatDobYear(c.dob)})`
        : c.name;
      els.inheritSelect.appendChild(opt);
    });

    els.inheritReassignBtn.disabled = true;
    els.inheritOverlay.classList.add('open');
  }

  function closeInheritModal() {
    els.inheritOverlay.classList.remove('open');
    modalOpen = false;
    pendingDeleteId = null;
  }

  els.inheritCancel.addEventListener('click', closeInheritModal);
  els.inheritOverlay.addEventListener('click', (e) => {
    if (e.target === els.inheritOverlay) closeInheritModal();
  });
  els.inheritSelect.addEventListener('change', () => {
    els.inheritReassignBtn.disabled = !els.inheritSelect.value;
  });

  els.inheritReassignBtn.addEventListener('click', async () => {
    const nodeId = pendingDeleteId;
    const targetId = els.inheritSelect.value;
    if (!nodeId || !targetId || !tree.nodes[nodeId]) return;
    const kids = tree.nodes[nodeId].children.slice();
    kids.forEach((cid) => linkParentChildSafe(targetId, cid));
    deleteNodeCascade(nodeId);
    closeInheritModal();
    render();
    setStatus('saving…');
    await saveTree();
  });

  els.inheritDeleteAllBtn.addEventListener('click', async () => {
    const nodeId = pendingDeleteId;
    if (!nodeId || !tree.nodes[nodeId]) return;
    deleteSubtreeRecursive(nodeId);
    closeInheritModal();
    render();
    setStatus('saving…');
    await saveTree();
  });

  init();
}

run();
