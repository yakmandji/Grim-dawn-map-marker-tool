// ui.navmarkers.js
(function () {
  window.NAV_MARKERS_BY_SIZE = {
    // map Cairn (8948x9133)
    '8948x9133': [
      // Home stade rift
      {
        xp: 37.5,
        yp: 63.94,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        targetProfile: 'Korvan Basin',
        targetXp: 20.11,
        targetYp: 95.22,
        targetScale: 1.2
      },
      // Téléport Devil Crossing
      {
        xp: 62.89,
        yp: 89.74,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        targetProfile: 'Korvan Basin',
        targetXp: 19.94,
        targetYp: 98.47,
        targetScale: 1.2
      },
      // Téléport Conflagration
      {
        xp: 39.26,
        yp: 60.25,
        tag: 'tagGoTo + tagMapPortValbury',
        icon: 'img/icon-link.png',
        targetXp: 41.32,
        targetYp: 28.12,
        targetScale: 1.2
      },
      // Téléport Fort Ikon
      {
        xp: 15.13,
        yp: 22.44,
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        icon: 'img/icon-link.png',
        targetProfile: 'Korvan Basin',
        targetXp: 19.94,
        targetYp: 98.47,
        targetScale: 1.2
      },            
    ],


    // map Korvan Basin (5427x5553)
    '5427x5553': [
      // 1) Téléport
      {
        xp: 19.94,
        yp: 98.47,
        tag: 'tagGoTo + tagMapDevilsCrossing01',
        icon: 'img/icon-link.png',
        targetProfile: 'Cairn',
        targetXp: 62.90,
        targetYp: 89.81,
        targetScale: 1.2
      },
    ],

  };
})();
