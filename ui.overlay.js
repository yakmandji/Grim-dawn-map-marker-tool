// Exemple simple : tu peux adapter avec tes vraies valeurs
window.DUNGEON_OVERLAYS = [
  { id: 'smuggler_pass',  map: 'cairn',  img: 'smuggler_pass.jpg', left: 2655, top: 8140, width: 679, height: 650 },
  { id: 'corrupted_tomb', map: 'cairn',  img: 'corrupted-tomb.jpg', left: 3346, top: 8233, width: 547, height: 543 },
  { id: 'suffering_angish', map: 'cairn',  img: 'suffering-angish.jpg', left: 3910, top: 8226, width: 1020, height: 1020 },
  { id: 'staunton_mine', map: 'cairn',  img: 'staunton-mine.jpg', left: 4950, top: 8392, width: 396, height: 375 },

];

state.dungeonOverlays = [];

function renderDungeonOverlays() {
  const inner = document.getElementById('mapInner');
  if (!inner || !window.DUNGEON_OVERLAYS) return;

  // nettoyer les anciens
  inner.querySelectorAll('.dungeon-wrapper').forEach(e => e.remove());
  state.dungeonOverlays = [];

  // clé de la map actuelle (ex: "8948x9133")
  let key = null;
  if (state.mapNatural?.w && state.mapNatural?.h) {
    key = `${state.mapNatural.w}x${state.mapNatural.h}`;
  }

  // correspondances map -> dossier + clé
  const MAP_INFO = {
    '8948x9133': { folder: 'cairn' },
    '5142x3574': { folder: 'malmouth' },
    '5427x5553': { folder: 'korvan' },
    // tu peux en rajouter ici si tu as d'autres maps
  };

  const currentFolder = MAP_INFO[key]?.folder || null;

  // filtrage : n'afficher que les overlays de la map active
  const overlays = window.DUNGEON_OVERLAYS.filter(o => {
    if (!o.map) return true; // pas de map = affiché partout
    if (!currentFolder) return false;
    return o.map === currentFolder;
  });

  overlays.forEach(d => {
    const wrap = document.createElement('div');
    wrap.className = 'dungeon-wrapper';
    wrap.style.left = d.left + 'px';
    wrap.style.top = d.top + 'px';
    wrap.style.width = d.width + 'px';
    wrap.style.height = d.height + 'px';

    const over = document.createElement('div');
    over.className = 'dungeon';

    // Construire automatiquement le chemin
    const path = `img/overlays/${currentFolder}/${d.img}`;
    over.style.backgroundImage = `url(${path})`;

    wrap.appendChild(over);
    inner.appendChild(wrap);

    state.dungeonOverlays.push({
      cfg: d,
      el: wrap,
      left: d.left,
      top: d.top,
      width: d.width,
      height: d.height,
    });
  });
}

window.renderDungeonOverlays = renderDungeonOverlays;

