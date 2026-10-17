/* =====================================================================
   MotoDrive · Lógica del cliente (SPA sin dependencias)
   ===================================================================== */
(() => {
  'use strict';

  // ---------------------------------------------------------------- utils
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const COLORES = {
    Negro: '#1b1d22', Blanco: '#f4f4f2', Rojo: '#e53935', Azul: '#1e63d6', Gris: '#7b8794',
    Plata: '#c3c9cf', Verde: '#2e9e5b', Amarillo: '#f2c230', Naranja: '#ff7a1a', Morado: '#7d4cdb',
  };

  const nfMoney = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const nfMoneyFull = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 });
  const nfCompact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
  const nfNum = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
  const nfInt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

  const money = (v) => nfMoney.format(v || 0);
  const moneyCompact = (v) => `$${nfCompact.format(v || 0)}`;
  const fmtDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtDateTime = (s) => (s ? new Date(s).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls = '') => `<svg class="icon ${cls}"><use href="#i-${name}"/></svg>`;
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const photoUrl = (m) => `/api/motocicletas/${m.id}/foto?v=${encodeURIComponent(m.actualizado_en || '')}`;
  const thumb = (m, cls = 'thumb') => {
    const color = COLORES[m.color_principal] || 'var(--text-3)';
    return m.tiene_foto
      ? `<span class="${cls} has-img"><img src="${photoUrl(m)}" alt="${esc(m.modelo)}" loading="lazy"></span>`
      : `<span class="${cls}" style="--thumb-color:${color}">${icon('logo')}</span>`;
  };

  // ---------------------------------------------------------------- API
  async function api(path, options = {}) {
    const opts = { headers: { Accept: 'application/json' }, ...options };
    if (opts.body && typeof opts.body !== 'string') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    let res;
    try {
      res = await fetch(path, opts);
    } catch {
      throw Object.assign(new Error('No hay conexión con el servidor'), { status: 0 });
    }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      throw Object.assign(new Error((data && data.message) || `Error ${res.status}`), { status: res.status, data });
    }
    return data;
  }

  // ---------------------------------------------------------------- toasts
  const TOAST_ICON = { success: 'check', error: 'alert', info: 'info' };
  function toast(type, title, message = '', duration = 4500) {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `
      <span class="toast-icon">${icon(TOAST_ICON[type])}</span>
      <div class="toast-body"><strong>${esc(title)}</strong>${message ? `<p>${esc(message)}</p>` : ''}</div>
      <button class="toast-close" aria-label="Cerrar notificación">${icon('x')}</button>
      <span class="toast-progress" style="animation-duration:${duration}ms"></span>`;
    const remove = () => {
      if (el.classList.contains('leaving')) return;
      el.classList.add('leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };
    el.querySelector('.toast-close').addEventListener('click', remove);
    const timer = setTimeout(remove, duration);
    el.addEventListener('mouseenter', () => { clearTimeout(timer); el.querySelector('.toast-progress').style.animationPlayState = 'paused'; });
    el.addEventListener('mouseleave', () => setTimeout(remove, 1500));
    $('#toasts').appendChild(el);
    const all = $$('#toasts .toast:not(.leaving)');
    if (all.length > 4) all[0].remove();
  }

  // ---------------------------------------------------------------- estado
  const state = {
    view: 'dashboard',
    marcas: [],
    filters: { q: '', marca_id: '', color: '', asegurada: '', sort: 'creado', order: 'desc', page: 1, limit: 10 },
    editing: null,       // motocicleta en edición (o null si es nueva)
    photo: undefined,    // undefined = sin cambios · null = eliminar · string = nueva (data URL)
    flashId: null,
  };

  // ---------------------------------------------------------------- tema
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('motodrive-theme', t); } catch { /* sin almacenamiento */ }
  }
  $('#themeBtn').addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ---------------------------------------------------------------- router
  const VIEWS = {
    dashboard: { title: 'Dashboard', eyebrow: 'Resumen general', load: loadDashboard },
    inventario: { title: 'Inventario', eyebrow: 'Gestión de motocicletas', load: loadMotos },
    marcas: { title: 'Marcas', eyebrow: 'Fabricantes registrados', load: renderMarcas },
  };

  function route() {
    const name = location.hash.replace('#', '') || 'dashboard';
    const view = VIEWS[name] ? name : 'dashboard';
    state.view = view;
    Object.keys(VIEWS).forEach((v) => { $(`#view-${v}`).hidden = v !== view; });
    $$('.nav-link').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
    $('#viewTitle').textContent = VIEWS[view].title;
    $('#viewEyebrow').textContent = VIEWS[view].eyebrow;
    document.title = `${VIEWS[view].title} · MotoDrive`;
    closeSidebar();
    VIEWS[view].load();
  }
  window.addEventListener('hashchange', route);

  function refreshCurrent() {
    loadMarcas().then(() => VIEWS[state.view].load());
  }

  // Sidebar móvil
  const closeSidebar = () => $('#sidebar').classList.remove('open');
  $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.add('open'));
  $('#sidebarBackdrop').addEventListener('click', closeSidebar);

  // ---------------------------------------------------------------- salud BD
  async function checkHealth() {
    const box = $('#dbStatus');
    try {
      const h = await api('/api/health');
      const ver = (h.version.match(/PostgreSQL ([\d.]+)/) || [])[1] || '';
      box.className = 'db-status up';
      $('#dbStatusText').textContent = `Conectado${ver ? ` · v${ver}` : ''}`;
    } catch {
      box.className = 'db-status down';
      $('#dbStatusText').textContent = 'Sin conexión';
    }
  }

  // ================================================================ DASHBOARD
  async function loadDashboard() {
    $('#kpiGrid').innerHTML = Array.from({ length: 4 }, () =>
      `<div class="card kpi"><span class="skeleton" style="width:50%"></span><span class="skeleton" style="height:26px;width:70%"></span><span class="skeleton" style="width:40%"></span></div>`).join('');
    try {
      const s = await api('/api/estadisticas');
      renderKpis(s);
      renderBrandChart(s.por_marca);
      renderColorChart(s.por_color, s.total);
      renderRecent(s.recientes);
    } catch (err) {
      $('#kpiGrid').innerHTML = '';
      toast('error', 'No se pudieron cargar las estadísticas', err.message);
    }
  }

  function renderKpis(s) {
    const pctSeguro = s.porcentaje_aseguradas;
    const kpis = [
      { label: 'Motocicletas en inventario', value: nfInt.format(s.total), sub: `<b>${s.ingresos_recientes}</b> ingresos en los últimos 30 días`, ic: 'logo', color: 'var(--accent)', tint: 'var(--accent-soft)' },
      { label: 'Valor total del inventario', value: moneyCompact(s.valor_total), sub: `Promedio <b>${money(s.precio_promedio)}</b>`, ic: 'money', color: 'var(--success)', tint: 'var(--success-soft)' },
      { label: 'Unidades aseguradas', value: `${pctSeguro}%`, sub: `<b>${s.aseguradas}</b> de ${s.total} motocicletas`, ic: 'shield', color: 'var(--info)', tint: 'var(--info-soft)', bar: pctSeguro },
      { label: 'Kilometraje promedio', value: `${nfInt.format(s.km_promedio)} km`, sub: `Cilindrada media <b>${nfInt.format(s.cc_promedio)} cc</b> · ${s.total_marcas} marcas`, ic: 'gauge', color: 'var(--warning)', tint: 'rgba(245,158,11,.14)' },
    ];
    $('#kpiGrid').innerHTML = kpis.map((k) => `
      <article class="card kpi" style="--kpi-color:${k.color};--kpi-tint:${k.tint}">
        <div class="kpi-top"><span class="kpi-label">${k.label}</span><span class="kpi-icon">${icon(k.ic)}</span></div>
        <div class="kpi-value">${k.value}</div>
        ${k.bar !== undefined ? `<div class="kpi-bar"><span style="width:0" data-w="${k.bar}%"></span></div>` : ''}
        <div class="kpi-sub">${k.sub}</div>
      </article>`).join('');
    requestAnimationFrame(() => $$('#kpiGrid [data-w]').forEach((el) => { el.style.width = el.dataset.w; }));
  }

  function renderBrandChart(rows) {
    const box = $('#brandChart');
    if (!rows.length) { box.innerHTML = emptyHtml('Sin datos', 'Registra motocicletas para ver la distribución.'); return; }
    const max = Math.max(...rows.map((r) => r.cantidad));
    box.innerHTML = rows.slice(0, 8).map((r) => `
      <div class="bar-row" title="${esc(r.nombre)}: ${r.cantidad} unidades · ${money(r.valor)}">
        <span class="bar-name">${esc(r.nombre)}</span>
        <span class="bar-track"><span class="bar-fill" data-w="${(r.cantidad / max) * 100}%"></span></span>
        <span class="bar-value"><b>${r.cantidad}</b> · ${moneyCompact(r.valor)}</span>
      </div>`).join('');
    requestAnimationFrame(() => $$('.bar-fill', box).forEach((el) => { el.style.width = el.dataset.w; }));
  }

  function renderColorChart(rows, total) {
    const box = $('#colorChart');
    if (!rows.length) { box.innerHTML = emptyHtml('Sin datos', 'Aún no hay colores registrados.'); return; }
    box.innerHTML = `
      <div class="stack">${rows.map((r) => `<span style="flex-grow:${r.cantidad};background:${COLORES[r.color]}" title="${r.color}: ${r.cantidad}"></span>`).join('')}</div>
      <ul class="legend">${rows.map((r) => `
        <li><span class="swatch-dot" style="background:${COLORES[r.color]}"></span>${r.color}
          <b>${r.cantidad} <small class="muted">(${Math.round((r.cantidad / total) * 100)}%)</small></b></li>`).join('')}
      </ul>`;
  }

  function renderRecent(rows) {
    const box = $('#recentList');
    if (!rows.length) { box.innerHTML = `<li style="grid-column:1/-1">${emptyHtml('Inventario vacío', 'Crea tu primera motocicleta con el botón “Nueva motocicleta”.')}</li>`; return; }
    box.innerHTML = rows.map((m) => `
      <li class="recent-item" data-id="${m.id}" tabindex="0">
        ${thumb(m)}
        <div><strong>${esc(m.modelo)}</strong><small>${esc(m.marca_nombre)} · ${m.anio_fabricacion} · ${money(m.precio_venta)}</small></div>
      </li>`).join('');
  }
  $('#recentList').addEventListener('click', (e) => {
    const li = e.target.closest('[data-id]');
    if (li) openDetail(Number(li.dataset.id));
  });
  $('#recentList').addEventListener('keydown', (e) => {
    const li = e.target.closest('[data-id]');
    if (li && e.key === 'Enter') openDetail(Number(li.dataset.id));
  });

  const emptyHtml = (title, text) => `<div class="empty">${icon('database')}<strong>${esc(title)}</strong>${esc(text)}</div>`;

  // ================================================================ MARCAS
  async function loadMarcas() {
    try {
      state.marcas = await api('/api/marcas');
    } catch (err) {
      toast('error', 'No se pudieron cargar las marcas', err.message);
      return;
    }
    const opts = state.marcas.map((m) => `<option value="${m.id}">${esc(m.nombre)}</option>`).join('');
    const fMarca = $('#fMarca');
    const prev = fMarca.value;
    fMarca.innerHTML = `<option value="">Todas las marcas</option>${opts}`;
    fMarca.value = prev;
    const mMarca = $('#mMarca');
    const prevM = mMarca.value;
    mMarca.innerHTML = `<option value="">Selecciona una marca…</option>${opts}`;
    mMarca.value = prevM;
  }

  function renderMarcas() {
    const grid = $('#brandGrid');
    if (!state.marcas.length) { grid.innerHTML = `<div class="card">${emptyHtml('Sin marcas', 'Registra la primera marca con el formulario.')}</div>`; return; }
    grid.innerHTML = state.marcas.map((b) => `
      <article class="card brand-card">
        <div class="brand-card-top">
          <span class="brand-avatar">${esc(b.nombre.slice(0, 2).toUpperCase())}</span>
          <div><h3>${esc(b.nombre)}</h3><small>${icon('globe')}${esc(b.pais_origen)}</small></div>
          <div class="actions">
            <button class="icon-btn sm" data-brand-edit="${b.id}" title="Editar marca" aria-label="Editar ${esc(b.nombre)}">${icon('edit')}</button>
            <button class="icon-btn sm danger" data-brand-del="${b.id}" title="Eliminar marca" aria-label="Eliminar ${esc(b.nombre)}">${icon('trash')}</button>
          </div>
        </div>
        <div class="brand-stats">
          <div><small>Motocicletas</small><b>${b.total_motos}</b></div>
          <div><small>Valor inventario</small><b>${moneyCompact(b.valor_inventario)}</b></div>
        </div>
      </article>`).join('');
  }

  function resetBrandForm() {
    $('#brandForm').reset();
    $('#brandId').value = '';
    $('#brandSubmit span').textContent = 'Agregar marca';
    $('#brandCancel').hidden = true;
    clearErrors($('#brandForm'));
  }

  $('#brandGrid').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-brand-edit]');
    const delBtn = e.target.closest('[data-brand-del]');
    if (editBtn) {
      const b = state.marcas.find((x) => x.id === Number(editBtn.dataset.brandEdit));
      $('#brandId').value = b.id;
      $('#brandNombre').value = b.nombre;
      $('#brandPais').value = b.pais_origen;
      $('#brandSubmit span').textContent = 'Guardar cambios';
      $('#brandCancel').hidden = false;
      $('#brandNombre').focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (delBtn) {
      const b = state.marcas.find((x) => x.id === Number(delBtn.dataset.brandDel));
      const ok = await confirmDialog('¿Eliminar marca?',
        b.total_motos ? `«${b.nombre}» tiene ${b.total_motos} motocicleta(s) asociadas. La base de datos impedirá eliminarla (ON DELETE RESTRICT).` : `Se eliminará «${b.nombre}» de forma permanente.`);
      if (!ok) return;
      try {
        await api(`/api/marcas/${b.id}`, { method: 'DELETE' });
        toast('success', 'Marca eliminada', `«${b.nombre}» se eliminó de la base de datos.`);
        refreshCurrent();
      } catch (err) {
        toast('error', 'No se pudo eliminar la marca', err.message);
      }
    }
  });

  $('#brandCancel').addEventListener('click', resetBrandForm);

  $('#brandForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    clearErrors(form);
    const body = { nombre: $('#brandNombre').value.trim(), pais_origen: $('#brandPais').value.trim() };
    const errors = {};
    if (body.nombre.length < 2) errors.nombre = 'Ingresa al menos 2 caracteres';
    if (body.pais_origen.length < 2) errors.pais_origen = 'Ingresa al menos 2 caracteres';
    if (Object.keys(errors).length) return showErrors(form, errors);

    const id = $('#brandId').value;
    const btn = $('#brandSubmit');
    btn.disabled = true;
    try {
      await api(id ? `/api/marcas/${id}` : '/api/marcas', { method: id ? 'PUT' : 'POST', body });
      toast('success', id ? 'Marca actualizada' : 'Marca registrada', `«${body.nombre}» se guardó de forma persistente en PostgreSQL.`);
      resetBrandForm();
      refreshCurrent();
    } catch (err) {
      if (err.data && err.data.errors) showErrors(form, err.data.errors);
      toast('error', 'No se pudo guardar la marca', err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // ================================================================ INVENTARIO
  async function loadMotos() {
    const f = state.filters;
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v !== '' && v != null) params.set(k, v); });
    const tbody = $('#motoTbody');
    if (!tbody.children.length || tbody.querySelector('.empty')) {
      tbody.innerHTML = Array.from({ length: Math.min(f.limit, 6) }, () =>
        `<tr>${'<td><span class="skeleton"></span></td>'.repeat(10)}</tr>`).join('');
    }
    updateSortHeaders();
    try {
      const res = await api(`/api/motocicletas?${params}`);
      if (res.page > res.pages && res.total > 0) { f.page = res.pages; return loadMotos(); }
      renderTable(res.data);
      renderPager(res);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="10">${emptyHtml('Error al cargar', err.message)}</td></tr>`;
      toast('error', 'No se pudo cargar el inventario', err.message);
    }
  }

  function renderTable(rows) {
    const tbody = $('#motoTbody');
    if (!rows.length) {
      const filtered = state.filters.q || state.filters.marca_id || state.filters.color || state.filters.asegurada;
      tbody.innerHTML = `<tr><td colspan="10">${filtered
        ? emptyHtml('Sin resultados', 'Ninguna motocicleta coincide con los filtros aplicados.')
        : emptyHtml('Inventario vacío', 'Agrega tu primera motocicleta con el botón “Nueva motocicleta”.')}</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((m) => `
      <tr data-id="${m.id}" class="${m.id === state.flashId ? 'row-flash' : ''}">
        <td>${thumb(m)}</td>
        <td class="cell-title"><strong>${esc(m.modelo)}</strong><small>${esc(m.marca_nombre)} · #${m.id}</small></td>
        <td>${m.anio_fabricacion}</td>
        <td class="num">${nfInt.format(m.cilindrada_cc)} cc</td>
        <td class="num">${nfNum.format(m.kilometraje)} km</td>
        <td class="num"><strong>${money(m.precio_venta)}</strong></td>
        <td><span class="color-pill"><span class="swatch-dot" style="background:${COLORES[m.color_principal]}"></span>${m.color_principal}</span></td>
        <td>${m.esta_asegurada
          ? `<span class="badge badge-success">${icon('shield')}Asegurada</span>`
          : '<span class="badge badge-muted">Sin seguro</span>'}</td>
        <td>${fmtDate(m.fecha_ingreso)}</td>
        <td><div class="actions">
          <button class="icon-btn sm" data-action="view" title="Ver detalle" aria-label="Ver ${esc(m.modelo)}">${icon('eye')}</button>
          <button class="icon-btn sm" data-action="edit" title="Editar" aria-label="Editar ${esc(m.modelo)}">${icon('edit')}</button>
          <button class="icon-btn sm danger" data-action="delete" title="Eliminar" aria-label="Eliminar ${esc(m.modelo)}">${icon('trash')}</button>
        </div></td>
      </tr>`).join('');
    state.flashId = null;
  }

  function renderPager({ total, page, pages, limit }) {
    const from = total ? (page - 1) * limit + 1 : 0;
    const to = Math.min(page * limit, total);
    $('#pagerText').textContent = `Mostrando ${from}–${to} de ${total} motocicletas`;

    const nums = [];
    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p);
      else if (nums[nums.length - 1] !== '…') nums.push('…');
    }
    $('#pagerNav').innerHTML = `
      <button class="page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Página anterior">${icon('left')}</button>
      ${nums.map((n) => (n === '…'
        ? '<span class="page-gap">…</span>'
        : `<button class="page-btn ${n === page ? 'active' : ''}" data-page="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`)).join('')}
      <button class="page-btn" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Página siguiente">${icon('right')}</button>`;
  }

  function updateSortHeaders() {
    $$('.th-sort').forEach((b) => {
      const active = b.dataset.sort === state.filters.sort;
      b.classList.toggle('active', active);
      b.closest('th').setAttribute('aria-sort', active ? (state.filters.order === 'asc' ? 'ascending' : 'descending') : 'none');
    });
  }

  // Filtros
  const applyFilter = (key, value) => { state.filters[key] = value; state.filters.page = 1; loadMotos(); };
  $('#fSearch').addEventListener('input', debounce((e) => applyFilter('q', e.target.value.trim()), 300));
  $('#fMarca').addEventListener('change', (e) => applyFilter('marca_id', e.target.value));
  $('#fColor').addEventListener('change', (e) => applyFilter('color', e.target.value));
  $('#fSeguro').addEventListener('change', (e) => applyFilter('asegurada', e.target.value));
  $('#pageSize').addEventListener('change', (e) => applyFilter('limit', Number(e.target.value)));
  $('#fReset').addEventListener('click', () => {
    ['#fSearch', '#fMarca', '#fColor', '#fSeguro'].forEach((s) => { $(s).value = ''; });
    Object.assign(state.filters, { q: '', marca_id: '', color: '', asegurada: '', sort: 'creado', order: 'desc', page: 1 });
    loadMotos();
  });
  $('#fColor').innerHTML += Object.keys(COLORES).map((c) => `<option>${c}</option>`).join('');

  $$('.th-sort').forEach((b) => b.addEventListener('click', () => {
    const f = state.filters;
    if (f.sort === b.dataset.sort) f.order = f.order === 'asc' ? 'desc' : 'asc';
    else { f.sort = b.dataset.sort; f.order = 'asc'; }
    f.page = 1;
    loadMotos();
  }));

  $('#pagerNav').addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    state.filters.page = Number(b.dataset.page);
    loadMotos();
  });

  $('#motoTbody').addEventListener('click', async (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const id = Number(tr.dataset.id);
    const action = (e.target.closest('[data-action]') || {}).dataset?.action || 'view';
    if (action === 'view') openDetail(id);
    if (action === 'edit') openForm(id);
    if (action === 'delete') {
      const modelo = tr.querySelector('.cell-title strong').textContent;
      const ok = await confirmDialog('¿Eliminar motocicleta?', `Se eliminará «${modelo}» (ID #${id}) de la base de datos de forma permanente.`);
      if (!ok) return;
      try {
        await api(`/api/motocicletas/${id}`, { method: 'DELETE' });
        toast('success', 'Motocicleta eliminada', `«${modelo}» se eliminó de PostgreSQL.`);
        refreshCurrent();
      } catch (err) {
        toast('error', 'No se pudo eliminar', err.message);
      }
    }
  });

  // ================================================================ MODALES
  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
  });

  function confirmDialog(title, text) {
    const dlg = $('#confirmModal');
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    dlg.returnValue = '';
    dlg.showModal();
    return new Promise((resolve) => {
      const ok = () => { dlg.returnValue = 'ok'; dlg.close(); };
      $('#confirmOk').addEventListener('click', ok, { once: true });
      dlg.addEventListener('close', () => {
        $('#confirmOk').removeEventListener('click', ok);
        resolve(dlg.returnValue === 'ok');
      }, { once: true });
    });
  }

  // ---------------------------------------------------------------- detalle
  async function openDetail(id) {
    let m;
    try { m = await api(`/api/motocicletas/${id}`); } catch (err) { return toast('error', 'No se pudo abrir el registro', err.message); }
    const color = COLORES[m.color_principal];
    $('#detailEyebrow').textContent = `${m.marca_nombre} · ${m.marca_pais}`;
    $('#detailTitle').textContent = m.modelo;
    $('#detailUpdated').textContent = `Última actualización: ${fmtDateTime(m.actualizado_en)}`;
    const spec = (n, k, type, v) => `<div class="spec"><div class="spec-k"><span class="fn">${n}</span>${k}<span class="type">${type}</span></div><div class="spec-v">${v}</div></div>`;
    $('#detailBody').innerHTML = `
      <div class="detail-hero">
        <div class="detail-photo" style="--thumb-color:${color}">
          ${m.tiene_foto ? `<img src="${photoUrl(m)}" alt="${esc(m.modelo)}">` : icon('logo')}
        </div>
        <div>
          <p class="eyebrow">Precio de venta</p>
          <div class="detail-price">${nfMoneyFull.format(m.precio_venta)}</div>
          <div class="detail-tags">
            ${m.esta_asegurada ? `<span class="badge badge-success">${icon('shield')}Asegurada</span>` : '<span class="badge badge-muted">Sin seguro</span>'}
            <span class="badge badge-muted"><span class="swatch-dot" style="background:${color}"></span>${m.color_principal}</span>
            <span class="badge badge-muted">${icon('bolt')}${nfInt.format(m.cilindrada_cc)} cc</span>
          </div>
          <p class="detail-desc">${m.descripcion ? esc(m.descripcion) : '<span class="muted">Sin descripción registrada.</span>'}</p>
        </div>
      </div>
      <div class="spec-grid">
        ${spec(1, 'ID', 'SERIAL', `#${m.id}`)}
        ${spec(2, 'Modelo', 'VARCHAR', esc(m.modelo))}
        ${spec(3, 'UUID', 'UUID', `<span class="mono">${m.uuid_registro}</span>`)}
        ${spec(4, 'Año de fabricación', 'SMALLINT', m.anio_fabricacion)}
        ${spec(5, 'Precio de venta', 'NUMERIC', nfMoneyFull.format(m.precio_venta))}
        ${spec(6, 'Cilindrada', 'INTEGER', `${nfInt.format(m.cilindrada_cc)} cc`)}
        ${spec(7, 'Fecha de ingreso', 'DATE', fmtDate(m.fecha_ingreso))}
        ${spec(8, 'Última inspección', 'TIME', m.hora_ultima_inspeccion || '—')}
        ${spec(9, '¿Asegurada?', 'BOOLEAN', m.esta_asegurada ? 'Sí (true)' : 'No (false)')}
        ${spec(10, 'Descripción', 'TEXT', m.descripcion ? `${m.descripcion.length} caracteres` : '—')}
        ${spec(11, 'Kilometraje', 'DOUBLE', `${nfNum.format(m.kilometraje)} km`)}
        ${spec(12, 'Fotografía', 'BYTEA', m.tiene_foto ? 'Imagen almacenada' : 'Sin imagen')}
        ${spec(13, 'Color principal', 'ENUM', m.color_principal)}
        ${spec(14, 'Creado en', 'TIMESTAMPTZ', fmtDateTime(m.creado_en))}
        ${spec(15, 'Marca', 'FK → marcas', `${esc(m.marca_nombre)} (ID ${m.marca_id})`)}
      </div>`;
    $('#detailEdit').onclick = () => { $('#detailModal').close(); openForm(m.id); };
    $('#detailModal').showModal();
  }

  // ---------------------------------------------------------------- formulario
  const form = $('#motoForm');
  const swatchBox = $('#mColor');
  swatchBox.innerHTML = Object.entries(COLORES).map(([name, hex]) =>
    `<button type="button" class="swatch" role="radio" aria-checked="false" data-color="${name}" title="${name}" aria-label="${name}" style="background:${hex}"></button>`).join('');
  const setColor = (name) => $$('.swatch', swatchBox).forEach((s) => s.setAttribute('aria-checked', String(s.dataset.color === name)));
  const getColor = () => ($('.swatch[aria-checked="true"]', swatchBox) || {}).dataset?.color || '';
  swatchBox.addEventListener('click', (e) => {
    const s = e.target.closest('.swatch');
    if (s) { setColor(s.dataset.color); clearFieldError('color_principal'); }
  });

  $('#mSeguro').addEventListener('change', (e) => { $('#mSeguroLabel').textContent = e.target.checked ? 'Sí, asegurada' : 'No asegurada'; });
  $('#mDesc').addEventListener('input', (e) => { $('#descCounter').textContent = `${e.target.value.length} / 2000`; });
  $('#mAnio').max = new Date().getFullYear() + 1;

  function setPhotoPreview(src) {
    const img = $('#photoPreview');
    img.hidden = !src;
    if (src) img.src = src; else img.removeAttribute('src');
    $('#dzEmpty').hidden = Boolean(src);
    $('#photoRemove').hidden = !src;
  }

  async function openForm(id = null) {
    form.reset();
    clearErrors(form);
    state.photo = undefined;
    state.editing = null;
    if (!state.marcas.length) await loadMarcas();

    if (id) {
      try { state.editing = await api(`/api/motocicletas/${id}`); } catch (err) { return toast('error', 'No se pudo cargar el registro', err.message); }
    }
    const m = state.editing;
    $('#motoModalTitle').textContent = m ? `Editar · ${m.modelo}` : 'Nueva motocicleta';
    $('#motoSubmit span').textContent = m ? 'Guardar cambios' : 'Registrar motocicleta';
    $('#mId').value = m ? `#${m.id}` : '';
    $('#mUuid').value = m ? m.uuid_registro : '';
    $('#mCreado').value = m ? fmtDateTime(m.creado_en) : '';
    $('#mModelo').value = m ? m.modelo : '';
    $('#mMarca').value = m ? m.marca_id : '';
    $('#mAnio').value = m ? m.anio_fabricacion : new Date().getFullYear();
    $('#mCc').value = m ? m.cilindrada_cc : '';
    $('#mKm').value = m ? m.kilometraje : 0;
    $('#mPrecio').value = m ? m.precio_venta : '';
    $('#mFecha').value = m ? m.fecha_ingreso : todayISO();
    $('#mHora').value = m ? (m.hora_ultima_inspeccion || '') : '';
    $('#mSeguro').checked = m ? m.esta_asegurada : false;
    $('#mSeguro').dispatchEvent(new Event('change'));
    $('#mDesc').value = m ? (m.descripcion || '') : '';
    $('#mDesc').dispatchEvent(new Event('input'));
    setColor(m ? m.color_principal : 'Negro');
    setPhotoPreview(m && m.tiene_foto ? photoUrl(m) : null);

    $('#motoModal').showModal();
    $('#mModelo').focus();
  }

  $('#newMotoBtn').addEventListener('click', () => openForm());

  // Fotografía: selección, arrastre, compresión
  const dz = $('#dropzone');
  dz.addEventListener('click', (e) => { if (!e.target.closest('#photoRemove')) $('#photoInput').click(); });
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#photoInput').click(); } });
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) handlePhoto(f); });
  $('#photoInput').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) handlePhoto(f); e.target.value = ''; });
  $('#photoRemove').addEventListener('click', (e) => {
    e.stopPropagation();
    state.photo = state.editing && state.editing.tiene_foto ? null : undefined;
    setPhotoPreview(null);
  });

  async function handlePhoto(file) {
    clearFieldError('fotografia');
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      return showErrors(form, { fotografia: 'Formato no permitido (usa JPG, PNG, WEBP o GIF)' });
    }
    try {
      const dataUrl = await compressImage(file);
      if (dataUrl.length * 0.75 > 2 * 1024 * 1024) return showErrors(form, { fotografia: 'La imagen no puede superar 2 MB' });
      state.photo = dataUrl;
      setPhotoPreview(dataUrl);
    } catch {
      showErrors(form, { fotografia: 'No se pudo leer la imagen' });
    }
  }

  // Redimensiona a máx. 1280 px y comprime a JPEG para optimizar el BYTEA
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (file.type === 'image/gif') return resolve(reader.result);
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Validación
  function clearErrors(root) {
    $$('.field.invalid', root).forEach((f) => f.classList.remove('invalid'));
    $$('[data-error]', root).forEach((e) => { e.textContent = ''; });
  }
  function clearFieldError(key) {
    const el = $(`#motoForm [data-error="${key}"]`);
    if (el) { el.textContent = ''; el.closest('.field').classList.remove('invalid'); }
  }
  function showErrors(root, errors) {
    let first = null;
    Object.entries(errors).forEach(([key, msg]) => {
      const el = $(`[data-error="${key}"]`, root);
      if (!el) return;
      el.textContent = msg;
      const field = el.closest('.field');
      field.classList.add('invalid');
      if (!first) first = field;
    });
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = $('input:not([readonly]), select, textarea, button', first);
      if (input) input.focus({ preventScroll: true });
    }
  }
  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field && field.classList.contains('invalid')) {
      field.classList.remove('invalid');
      const err = $('[data-error]', field);
      if (err) err.textContent = '';
    }
  });

  function collectForm() {
    return {
      modelo: $('#mModelo').value.trim(),
      marca_id: $('#mMarca').value ? Number($('#mMarca').value) : '',
      anio_fabricacion: $('#mAnio').value === '' ? '' : Number($('#mAnio').value),
      precio_venta: $('#mPrecio').value === '' ? '' : Number($('#mPrecio').value),
      cilindrada_cc: $('#mCc').value === '' ? '' : Number($('#mCc').value),
      fecha_ingreso: $('#mFecha').value,
      hora_ultima_inspeccion: $('#mHora').value || null,
      esta_asegurada: $('#mSeguro').checked,
      descripcion: $('#mDesc').value.trim(),
      kilometraje: $('#mKm').value === '' ? '' : Number($('#mKm').value),
      color_principal: getColor(),
    };
  }

  function validate(d) {
    const e = {};
    const maxYear = new Date().getFullYear() + 1;
    if (d.modelo.length < 2) e.modelo = 'El modelo debe tener al menos 2 caracteres';
    if (!d.marca_id) e.marca_id = 'Selecciona una marca';
    if (!Number.isInteger(d.anio_fabricacion) || d.anio_fabricacion < 1900 || d.anio_fabricacion > maxYear) e.anio_fabricacion = `Ingresa un año entre 1900 y ${maxYear}`;
    if (!d.color_principal) e.color_principal = 'Selecciona un color';
    if (!Number.isInteger(d.cilindrada_cc) || d.cilindrada_cc < 49 || d.cilindrada_cc > 3000) e.cilindrada_cc = 'Entero entre 49 y 3000 cc';
    if (d.kilometraje === '' || !(d.kilometraje >= 0) || d.kilometraje > 2000000) e.kilometraje = 'Número entre 0 y 2.000.000';
    if (d.precio_venta === '' || !(d.precio_venta >= 0)) e.precio_venta = 'Ingresa un precio válido';
    if (!d.fecha_ingreso) e.fecha_ingreso = 'Selecciona la fecha de ingreso';
    if (d.descripcion.length > 2000) e.descripcion = 'Máximo 2000 caracteres';
    return e;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    const data = collectForm();
    const errors = validate(data);
    if (Object.keys(errors).length) {
      showErrors(form, errors);
      toast('error', 'Revisa el formulario', `Hay ${Object.keys(errors).length} campo(s) con errores.`);
      return;
    }
    if (state.photo !== undefined) data.fotografia = state.photo;

    const editing = state.editing;
    const btn = $('#motoSubmit');
    btn.disabled = true;
    btn.classList.add('loading');
    try {
      const saved = await api(editing ? `/api/motocicletas/${editing.id}` : '/api/motocicletas', {
        method: editing ? 'PUT' : 'POST',
        body: data,
      });
      $('#motoModal').close();
      state.flashId = saved.id;
      toast('success',
        editing ? 'Cambios guardados en PostgreSQL' : 'Motocicleta almacenada en PostgreSQL',
        `«${saved.modelo}» · ID #${saved.id} · UUID ${saved.uuid_registro.slice(0, 8)}…`);
      if (!editing && state.view === 'inventario') {
        Object.assign(state.filters, { sort: 'creado', order: 'desc', page: 1 });
      }
      refreshCurrent();
    } catch (err) {
      if (err.data && err.data.errors) showErrors(form, err.data.errors);
      toast('error', 'No se pudo guardar', err.message);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });

  // ---------------------------------------------------------------- arranque
  checkHealth();
  setInterval(checkHealth, 30000);
  loadMarcas().then(route);
})();
