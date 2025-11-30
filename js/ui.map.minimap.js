// ui.map.minimap.js
// Minimap : montre la vue courante et permet de déplacer la map
(function () {
  const core  = window.GDMMCore || {};
  const state = core.state || {};

  const ui       = window.UiCore || {};
  const viewport = ui.viewport;
  const mapImg   = ui.mapImg;

  const host     = document.getElementById('miniMap');
  const inner    = host ? host.querySelector('.miniMap-inner') : null;
  const viewRect = host ? host.querySelector('.miniMap-viewport') : null;

  if (!host || !inner || !viewRect || !viewport || !mapImg) {
    return;
  }

  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function computeLayout() {
    if (!state.mapNatural || !state.mapNatural.w || !state.mapNatural.h) return null;

    const iw = state.mapNatural.w;
    const ih = state.mapNatural.h;
    const bw = inner.clientWidth  || 1;
    const bh = inner.clientHeight || 1;

    // facteur d’échelle (on rentre toute la map dans le bloc)
    const f = Math.min(bw / iw, bh / ih);

    const scaledW = iw * f;
    const scaledH = ih * f;

    // bandes vides (letterbox / pillarbox) parce que l’image est centrée
    const offsetX = (bw - scaledW) / 2;
    const offsetY = (bh - scaledH) / 2;

    return { f, iw, ih, bw, bh, scaledW, scaledH, offsetX, offsetY };
  }


  function updateBackground() {
    if (!state.mapNatural || !state.mapNatural.w || !state.mapNatural.h) return;
    if (!mapImg || !mapImg.src) return;

    const layout = computeLayout();
    if (!layout) return;

    const { scaledW, scaledH } = layout;

    inner.style.backgroundImage    = `url(${mapImg.src})`;
    inner.style.backgroundSize     = `${scaledW}px ${scaledH}px`;
    inner.style.backgroundPosition = 'center center';
  }

let _mmFrame = 0;

function updateMiniMap(force = false) {
  if (!state.mapReady || !state.mapNatural || !state.mapNatural.w || !state.mapNatural.h) {
    _mmFrame = 0;
    return;
  }

  // 2) Throttle 15 FPS (1 frame sur 4), SAUF si force = true
  if (!force && (_mmFrame++ % 4) !== 0) return;

  updateBackground();

  const layout = computeLayout();
  if (!layout) return;

  const { f, iw, ih, bw, bh, scaledW, scaledH, offsetX, offsetY } = layout;

  const vb = viewport.getBoundingClientRect();
  const { x, y, scale } = state.view || { x: 0, y: 0, scale: 1 };

  const visibleW = vb.width  / scale;
  const visibleH = vb.height / scale;
  const visibleX = -x / scale;
  const visibleY = -y / scale;

  let rx = offsetX + visibleX * f;
  let ry = offsetY + visibleY * f;
  let rw = visibleW * f;
  let rh = visibleH * f;

  rw = Math.max(10, rw);
  rh = Math.max(10, rh);

  const minX = offsetX;
  const maxX = offsetX + scaledW - rw;
  const minY = offsetY;
  const maxY = offsetY + scaledH - rh;

  rx = clamp(rx, minX, maxX);
  ry = clamp(ry, minY, maxY);

  viewRect.style.left   = rx + 'px';
  viewRect.style.top    = ry + 'px';
  viewRect.style.width  = rw + 'px';
  viewRect.style.height = rh + 'px';
}



function centerFromLocal(localX, localY) {
  if (!state.mapNatural || !state.mapNatural.w || !state.mapNatural.h) return;
  if (typeof window.centerOn !== 'function') return;

  const layout = computeLayout();
  if (!layout) return;

  const { f, iw, ih, offsetX, offsetY, scaledW, scaledH } = layout;

  // on clamp dans la zone où l’image existe réellement
  const lx = clamp(localX, offsetX, offsetX + scaledW);
  const ly = clamp(localY, offsetY, offsetY + scaledH);

  const mapX = (lx - offsetX) / f;
  const mapY = (ly - offsetY) / f;

  const xp = (mapX / iw) * 100;
  const yp = (mapY / ih) * 100;

  const currentScale = (state.view && state.view.scale) || 1;
  window.centerOn(xp, yp, currentScale);

  updateMiniMap(true);
}


  // --- Drag / clic sur la minimap ---------------------------------

  let isDragging = false;
  let dragPointerId = null;

  function onPointerDown(e) {
    if (!state.mapReady) return;

    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    dragPointerId = e.pointerId;

    if (inner.setPointerCapture) {
      inner.setPointerCapture(e.pointerId);
    }

    const rect = inner.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    centerFromLocal(localX, localY);
  }

  function onPointerMove(e) {
    if (!isDragging || e.pointerId !== dragPointerId) return;
    if (!state.mapReady) return;

    e.preventDefault();

    const rect = inner.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    centerFromLocal(localX, localY);
  }

  function endDrag(e) {
    if (!isDragging) return;
    if (dragPointerId !== null && e.pointerId !== dragPointerId) return;

    isDragging = false;
    dragPointerId = null;

    if (inner.releasePointerCapture) {
      try { inner.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  }

  inner.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => updateMiniMap(true));

  // Namespace global simple
  window.UiMiniMap = {
    // appel normal : throttle actif
    update: () => updateMiniMap(false),
    refresh: () => updateMiniMap(false),
    force: () => updateMiniMap(true),
  };

  setTimeout(() => updateMiniMap(true), 0);


})();
