// ui.shrine.js
(function () {

  // 1) LISTES PAR MAP -------------------------------------------------
  // Tu rempliras celles-ci à la main, comme pour les rifts.

  window.SHRINE_MARKERS_CAIRN = [
    // EXEMPLE :
    { id: 'shrine_devils_crossing', regionTag: 'tagUGBurialCave', xp: 70.09, yp: 83.85, difficulty: 'normal' },
    // { id: 'shrine_something_elite', tag: 'tagShrineSomethingElite', xp: 41.23, yp: 52.11, difficulty: 'elite' },
    // { id: 'shrine_ultimate_only', tag: 'tagShrineUltOnly', xp: 12.34, yp: 67.89, difficulty: 'ultimate' },
  ];

  window.SHRINE_MARKERS_MALMOUTH = [
    // À remplir
  ];

  window.SHRINE_MARKERS_KORVAN = [
    // À remplir
  ];

  // 2) MAPPING PAR TAILLE D’IMAGE (comme pour les rifts / nav markers) ----
  // Adapte les tailles si besoin, mais là je reprends exactement le pattern des rifts/nav :

  window.SHRINE_MARKERS_BY_SIZE = {
    '8948x9133': window.SHRINE_MARKERS_CAIRN,
    '5142x3574': window.SHRINE_MARKERS_MALMOUTH,
    '5427x5553': window.SHRINE_MARKERS_KORVAN,
  };

})();
