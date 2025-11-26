// ui.navmarkers.js
(function () {

window.NAV_MARKERS_CAIRN = [
      {
        xp: 84.15,
        yp: 47.40,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        targetProfile: 'Korvan Basin',
        targetXp: 20.11,
        targetYp: 95.22,
        targetScale: 1
      },  
      {
        xp: 37.5,
        yp: 63.94,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        targetProfile: 'Korvan Basin',
        targetXp: 20.11,
        targetYp: 95.22,
        targetScale: 1
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
        targetScale: 1
      },
      // Téléport Conflagration
      {
        xp: 39.26,
        yp: 60.25,
        tag: 'tagGoTo + tagMapPortValbury',
        icon: 'img/icon-link.png',
        targetXp: 44.42,
        targetYp: 34,
        targetScale: 1
      },
      // Téléport Port Valbury
      {
        xp: 44.30,
        yp: 34.29,
        tag: 'tagGoTo + tagMapConflagration01',
        icon: 'img/icon-link.png',
        targetXp: 39.28,
        targetYp: 59.99,
        targetScale: 1
      }, 
      {
        xp: 41.11, 
        yp: 20.96,
        tag: 'tagGoTo + tagMapConflagration01',
        icon: 'img/icon-link.png',
        targetXp: 39.28,
        targetYp: 59.99,
        targetScale: 1
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
        targetScale: 1
      },
      // Téléport Void's Eige
      {
        xp: 75.30, 
        yp: 12.98,
        tag: 'tagGoTo + tagGDX1MapMalmouthEntry',
        icon: 'img/icon-link.png',
        targetProfile: 'Malmouth',
        targetXp: 63.17,
        targetYp: 94.86,
        targetScale: 1
      },
      // Lower Crossing To Hargate Isle
      {
        xp: 63.47,
        yp: 87.40,
        tag: 'tagGoTo + tagUGSlithLab01',
        icon: 'img/icon-link.png',
        targetXp: 61.47,
        targetYp: 81.95,
        targetScale: 1
      },             
      {
        xp: 61.41,
        yp: 82.44,
        tag: 'tagGoTo + tagUGSlithLab01',
        icon: 'img/icon-link.png',
        targetXp: 64.97,
        targetYp: 87.03,
        targetScale: 1
      },
];

  window.NAV_MARKERS_MALMOUTH = [
      {
        xp: 63.63,
        yp: 95.08,
        tag: 'tagGoTo + tagGDX1UGUgdenbogVoidRift03',
        icon: 'img/icon-link.png',
        targetProfile: 'Cairn',
        targetXp: 74,
        targetYp: 15,
        targetScale: 1
      },
  ];


  window.NAV_MARKERS_KORVAN = [
      {
        xp: 19.94,
        yp: 98.47,
        tag: 'tagGoTo + tagMapDevilsCrossing01',
        icon: 'img/icon-link.png',
        targetProfile: 'Cairn',
        targetXp: 62.90,
        targetYp: 89.81,
        targetScale: 1
      },
  ];


  // --- Mapping map sise ---
  window.NAV_MARKERS_BY_SIZE = {
    '8948x9133': window.NAV_MARKERS_CAIRN,
    '5142x3574': window.NAV_MARKERS_MALMOUTH,
    '5427x5553': window.NAV_MARKERS_KORVAN,
  };


})();

