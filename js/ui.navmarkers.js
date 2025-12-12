// ui.navmarkers.js
(function () {

window.NAV_MARKERS_CAIRN = [

    /*Mountain deep*/
        {
        xp: 32.22, 
        yp: 76.04,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagMapConflagration02',
        targetXp: 31.96,
        targetYp: 74.79,
        targetScale: 1,
        id: 'MountainDeepGo',
        targetId: 'DeadMansGulch' 

      },  
      {
        xp: 31.96,
        yp: 74.79,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagMapDeadmansGulch',
        targetXp: 32.22,
        targetYp: 76.04,
        targetScale: 1,
        id: 'DeadMansGulch',
        targetId: 'MountainDeepGo' 
      },  
      /*------------Mountain deep*/

    /*Port Valbury Middle teleport -----------------------------------------------*/

      {
        xp: 40.17, 
        yp: 25.72,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagMapDeadmansGulch',
        targetXp: 41.16,
        targetYp: 24.68,
        targetScale: 1,
        id: 'ValburyOldTwon',
        targetId: 'ValburyHightTwon' 
      }, 
      {
        xp: 41.16, 
        yp: 24.68,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagMapDeadmansGulch',
        targetXp: 40.17,
        targetYp: 25.72,
        targetScale: 1,
        id: 'ValburyHightTwon',
        targetId: 'ValburyOldTwon' 
      },       
/*---------------------------------------------------------Port Valbury Middle teleport*/

      {
        xp: 84.15,
        yp: 47.40,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        targetProfile: 'Korvan Basin',
        targetXp: 20.11,
        targetYp: 95.22,
        targetScale: 1,
        id: 'CovensRefugeGo',
        targetId: 'ConclaveOfThree'
      },  
      {
        xp: 37.5,
        yp: 63.94,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        targetProfile: 'Korvan Basin',
        targetXp: 20.11,
        targetYp: 95.22,
        targetScale: 1,
        id: 'HomeSteadGo',
        targetId: 'ConclaveOfThree'
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
        targetScale: 1,
        id: 'DevilCrossingGo',
        targetId: 'ConclaveOfThree'

      },
      // Téléport Conflagration
      {
        xp: 39.26,
        yp: 60.25,
        tag: 'tagGoTo + tagMapPortValbury',
        icon: 'img/icon-link.png',
        targetXp: 44.42,
        targetYp: 34,
        targetScale: 1,
        id: 'ConflagationGo',
        targetId: 'ValburySouth'
      },
      // Téléport Port Valbury
      {
        xp: 44.30,
        yp: 34.29,
        tag: 'tagGoTo + tagMapConflagration01',
        icon: 'img/icon-link.png',
        targetXp: 39.28,
        targetYp: 59.99,
        targetScale: 1,
        id: 'ValburySouth',
        targetId: 'ConflagationGo'
      }, 
      {
        xp: 41.11, 
        yp: 20.96,
        tag: 'tagGoTo + tagMapConflagration01',
        icon: 'img/icon-link.png',
        targetXp: 39.28,
        targetYp: 59.99,
        targetScale: 1,
        id: 'ValburyNorth',
        targetId: 'ConflagationGo'
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
        targetScale: 1,
        id: 'Fort Ikon',
        targetId: 'ConclaveOfThree'
      },
      // Téléport Void's Eige
      {
        xp: 74.04, 
        yp: 12.40,
        tag: 'tagGoTo + tagGDX1MapMalmouthEntry',
        icon: 'img/icon-link.png',
        targetProfile: 'Malmouth',
        targetXp: 63.17,
        targetYp: 94.86,
        targetScale: 1,
        id: 'EidgeCairn',
        targetId: 'LoneWatch'
      },

       // Téléport Void's Eige Inside ------------------------------------------
      {
        xp: 72.13, 
        yp: 20.03,
        tag: 'tagGoTo + tagGDX1MapUgdenbogAltar',
        icon: 'img/icon-link.png',
        targetXp: 85.14,
        targetYp: 23.82,
        targetScale: 1,
        id: 'EidgeCairnInside',
        targetId: 'AltarRattosh'
      },
      {
        xp: 85.14, 
        yp: 23.82,
        tag: 'tagGoTo + tagGDX1UGUgdenbogVoidRift03',
        icon: 'img/icon-link.png',
        targetXp: 72.13,
        targetYp: 20.03,
        targetScale: 1,
        id: 'AltarRattosh',
        targetId: 'EidgeCairnInside'
      },
       // --------------------------------------------------Téléport Void's Eige Inside -

      // Lower Crossing To Hargate Isle
      {
        xp: 63.47,
        yp: 87.40,
        tag: 'tagGoTo + tagUGSlithLab01',
        icon: 'img/icon-link.png',
        targetXp: 61.47,
        targetYp: 81.95,
        targetScale: 1,
        id: 'LowerCrossing',
        targetId: 'HargatesIsle'
      },             
      {
        xp: 61.41,
        yp: 82.44,
        tag: 'tagGoTo + tagMapLowerCrossing',
        icon: 'img/icon-link.png',
        targetXp: 64.97,
        targetYp: 87.03,
        targetScale: 1,
        id: 'HargatesIsle',
        targetId: 'LowerCrossing'
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
        targetScale: 1,
        id: 'LoneWatch',
        targetId: 'EidgeCairn'
      },
      {
        xp: 33.48, 
        yp: 68.49,
        icon: 'img/icon-link.png',
        tag: 'tagGoTo + tagGDX2MapWitchGodBase',
        targetProfile: 'Korvan Basin',
        targetXp: 20.11,
        targetYp: 95.22,
        targetScale: 1,
        id: 'SewerMalmouth',
        targetId: 'ConclaveOfThree'
      },
    /*Malmouth Outskirts-------------------------------------*/
      {
        xp: 70.03, 
        yp: 47.69,
        tag: 'tagGoTo + tagGDX1MapMalmouthOutskirtsRuins',
        icon: 'img/icon-link.png',
        targetXp: 61.67,
        targetYp: 55.83,
        targetScale: 1,
        id: 'MalmouthOutskirtsNorth',
        targetId: 'MalmouthOutskirtsSouth'
      },
      {
        xp: 61.67, 
        yp: 55.83,
        tag: 'tagGoTo + tagGDX1MapMalmouthOutskirtsRuins',
        icon: 'img/icon-link.png',
        targetXp: 70.03,
        targetYp: 47.69,
        targetScale: 1,
        id: 'MalmouthOutskirtsSouth',
        targetId: 'MalmouthOutskirtsNorth'
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
        targetScale: 1,
        id: 'ConclaveOfThree',
        targetId: 'DevilCrossingGo'
      },
  ];


  // --- Mapping map sise ---
  window.NAV_MARKERS_BY_SIZE = {
    '8948x9133': window.NAV_MARKERS_CAIRN,
    '5142x3574': window.NAV_MARKERS_MALMOUTH,
    '5427x5553': window.NAV_MARKERS_KORVAN,
  };


})();

