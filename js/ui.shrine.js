// ui.shrine.js
(function () {

  // 1) LISTES PAR MAP -------------------------------------------------
  // Tu rempliras celles-ci à la main, comme pour les rifts.

  window.SHRINE_MARKERS_CAIRN = [
    // EXEMPLE :
    { id: 'shrine_Burial_Hill', regionTag: 'tagMapBurialHill', xp: 70.09, yp: 83.85, difficulty: 'normal' },
    { id: 'shrine_MapFoggy_Bank', regionTag: 'tagMapFoggyBank', xp: 64.77, yp: 74.89, difficulty: 'normal' },
    { id: 'shrine_Devils_Crossing_Aquifer', regionTag: 'tagUGDevilsCrossingAquifer', xp: 71.19, yp: 90.63, difficulty: 'normal' },
    { id: 'shrineMapFloodedPassage01', regionTag: 'tagMapFloodedPassage01', xp: 63.82, yp: 69.77, difficulty: 'normal' },
    { id: 'shrineUGBurialCave', regionTag: 'tagUGBurialCave', xp: 63.37, yp: 67.00, difficulty: 'normal' },
    { id: 'shirneMapBurrwitchEstates', regionTag: 'tagMapBurrwitchEstates', xp: 68.52, yp: 60.07, difficulty: 'normal' },
    { id: 'shrineMapOminousLair', regionTag: 'tagMapOminousLair', xp: 61.94, yp: 50.55, difficulty: 'normal' },
    { id: 'shrinetagMapEastMarsh03', regionTag: 'tagMapEastMarsh03', xp: 80.67, yp: 65.27, difficulty: 'normal' },
    { id: 'shrinetagWorldMapWitchGodTemple', regionTag: 'tagWorldMapWitchGodTemple', xp: 86.88, yp: 64.84, difficulty: 'normal' },
    { id: 'shrinetagUGArkovianFoothills02', regionTag: 'tagUGArkovianFoothills02', xp: 60.83, yp: 84.68, difficulty: 'normal' },
    { id: 'shrinetagMapRockyCoast', regionTag: 'tagMapRockyCoast', xp: 53.81, yp: 80.69, difficulty: 'normal' },
    { id: 'shrinetagMapCronleysHideout', regionTag: 'tagMapCronleysHideout', xp: 55.46, yp: 69.97, difficulty: 'normal' },
    { id: 'shrinetagMapOldArkovia', regionTag: 'tagMapOldArkovia', xp: 49.95, yp: 79.05, difficulty: 'normal' },
    { id: 'shrinetagUGOldArkovia02', regionTag: 'tagUGOldArkovia02', xp: 49.09, yp: 67.30, difficulty: 'normal' },
    { id: 'shrinetagMapBarrenHighlands', regionTag: 'tagMapBarrenHighlands', xp: 43.05, yp: 81.97, difficulty: 'normal' },
    { id: 'shrinetagUGBrokenHills02B', regionTag: 'tagUGBrokenHills02B', xp: 50.91, yp: 94.66, difficulty: 'normal' },
    { id: 'shrinetagMapMountainDeeps', regionTag: 'tagMapMountainDeeps', xp: 21.98, yp: 75.46, difficulty: 'normal' },
    { id: 'shrinetagUGJaggedWasteCave02', regionTag: 'tagUGJaggedWasteCave02', xp: 35.71, yp: 82.72, difficulty: 'normal' },
    { id: 'shrinetagMapJaggedWasteFort', regionTag: 'tagMapJaggedWasteFort', xp: 44.12, yp: 72.87, difficulty: 'normal' },
    { id: 'shrinetagMapInfestedFarms', regionTag: 'tagMapInfestedFarms', xp: 32.53, yp: 65.68, difficulty: 'normal' },
    { id: 'shrinetagUGHomesteadCave01', regionTag: 'tagUGHomesteadCave01', xp: 14.63, yp: 64.63, difficulty: 'normal' },
    { id: 'shrinetagMapConflagration01', regionTag: 'tagMapConflagration01', xp: 40.08, yp: 58.55, difficulty: 'normal' },
    { id: 'shrinetagMapPortValbury', regionTag: 'tagMapPortValbury', xp: 43.73, yp: 30.88, difficulty: 'normal' },
    { id: 'shrinetagMapBloodGrove', regionTag: 'tagMapBloodGrove', xp: 31.37, yp: 53.93, difficulty: 'normal' },
    { id: 'shrinetagMapDarkvale', regionTag: 'tagMapDarkvale', xp: 23.62, yp: 45.43, difficulty: 'normal' },
    { id: 'shrinetagMapAlpineValley', regionTag: 'tagMapAlpineValley', xp: 6.72, yp: 30.12, difficulty: 'normal' },
    { id: 'shrinetagMapAlpineValleyWest', regionTag: 'tagMapAlpineValley', xp: 12.00, yp: 30.93, difficulty: 'normal' },
    { id: 'shrinetagGDX1MapDarkWood', regionTag: 'tagGDX1MapDarkWood', xp: 77.96, yp: 51.51, difficulty: 'normal' },
    { id: 'shrineUgdenbogCave04', regionTag: 'tagGDX1UGUgdenbogCave04', xp: 91.99, yp: 33.29, difficulty: 'normal' },
    { id: 'shrineGDX1UGAncientGrove01', regionTag: 'tagGDX1UGAncientGrove01', xp: 94.42, yp: 52.13, difficulty: 'normal' },
    { id: 'shrineUGCryptFactionBattle02', regionTag: 'tagUGCryptFactionBattle02', xp: 4.20, yp: 21.35, difficulty: 'normal' },
    { id: 'shrineMapBloodGroveAetherMine', regionTag: 'tagMapBloodGroveAetherMine', xp: 34.18, yp: 46.64, difficulty: 'elite' },
    { id: 'shrinetagUGCryptNecropolis01', regionTag: 'tagUGCryptNecropolis01', xp: 33.48, yp: 9.95, difficulty: 'normal' },
    { id: 'shrinetagUGCryptFinal01', regionTag: 'tagUGCryptFinal01', xp: 14.86, yp: 7.61, difficulty: 'normal' },
    { id: 'shrinetagUGVoidlands01', regionTag: 'tagUGVoidlands01', xp: 31.86, yp: 0.56, difficulty: 'normal' },
    { id: 'shrinetagMapHallowedHill', regionTag: 'tagMapHallowedHill', xp: 71.10, yp: 64.58, difficulty: 'elite' },
    { id: 'shrinetagMapNecropolis', regionTag: 'tagMapNecropolis', xp: 24.31, yp: 7.53, difficulty: 'normal' },
    { id: 'shrinetagGDX1UGUgdenbogVoidRift01', regionTag: 'tagGDX1UGUgdenbogVoidRift01', xp: 78.79, yp: 21.41, difficulty: 'elite' },
    { id: 'shrinetagMapHiddenPath01', regionTag: 'tagMapHiddenPath01', xp: 67.36, yp: 84.30, difficulty: 'ultimate' },
    { id: 'shrinetagUGSecret02', regionTag: 'tagUGSecret02', xp: 28.57, yp: 21.00, difficulty: 'ultimate' },
    { id: 'shrinetagGDX1MapUgdenbogAncient', regionTag: 'tagGDX1MapUgdenbogAncient', xp: 90.31, yp: 40.50, difficulty: 'ultimate' },
    { id: 'shrinetagGDX1UGUgdenbogMine01', regionTag: 'tagGDX1UGUgdenbogMine01', xp: 98.86, yp: 27.29, difficulty: 'ultimate' },

  ];

  window.SHRINE_MARKERS_MALMOUTH = [
    { id: 'shrineGDX1MapMalmouthOutskirtsRuins', regionTag: 'tagGDX1MapMalmouthOutskirtsRuins', xp: 69.60, yp: 47.57, difficulty: 'normal' },
    { id: 'shrinetagGDX1UGMalmouthLighthouse01', regionTag: 'tagGDX1UGMalmouthLighthouse01', xp: 12.79, yp: 57.81, difficulty: 'normal' },
    { id: 'shrinetagGDX1MapMalmouthInner', regionTag: 'tagGDX1MapMalmouthInner', xp: 47.75, yp: 14.22, difficulty: 'normal' },
     { id: 'shrinetagGDX1UGMalmouthAetherialFactory01', regionTag: 'tagGDX1UGMalmouthAetherialFactory01', xp: 24.48, yp: 14.76, difficulty: 'ultimate' },
     { id: 'shrinetagGDX2RuinedDC', regionTag: 'tagGDX2RuinedDC', xp: 83.50, yp: 53.86, difficulty: 'ultimate' },
  ];

  window.SHRINE_MARKERS_KORVAN = [
    { id: 'shrinetagGDX2CairanRuins01', regionTag: 'tagGDX2CairanRuins01', xp: 13.05, yp: 51.85, difficulty: 'normal' },
    { id: 'shrinetagSplendorOfShatteredRealm', regionTag: 'tagSplendorOfShatteredRealm', xp: 27.44, yp: 93.95, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRuinedTemple01', regionTag: 'tagGDX2MapRuinedTemple01', xp: 55.74, yp: 89.23, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapHiddenOasis', regionTag: 'tagGDX2MapHiddenOasis', xp: 33.76, yp: 71.72, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRuinedCity01', regionTag: 'tagGDX2MapRuinedCity01', xp: 30.53, yp: 45.04, difficulty: 'normal' },
    { id: 'shrinetagGDX2SanctuaryOfHorran', regionTag: 'tagGDX2SanctuaryOfHorran', xp: 45.27, yp: 42.29, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRuinedCity02', regionTag: 'tagGDX2MapRuinedCity02', xp: 74.37, yp: 43.74, difficulty: 'normal' },
    { id: 'shrinetagGDX2VOTC02', regionTag: 'tagGDX2VOTC02', xp: 71.11, yp: 35.37, difficulty: 'normal' },
    { id: 'shrinetagGDX2MapRaisedTemple', regionTag: 'tagGDX2MapRaisedTemple', xp: 51.95, yp: 15.22, difficulty: 'normal' },
    { id: 'shrinetagGDX2KorvaakTomb01', regionTag: 'tagGDX2KorvaakTomb01', xp: 60.73, yp: -4.00, difficulty: 'normal' },
    { id: 'shrinetagGDX2Roguelike_01', regionTag: 'tagGDX2Roguelike_01', xp: 85.39, yp: 28.41, difficulty: 'normal' },

     { id: 'shrinetagGDX1UGSecret01Korvan', regionTag: 'tagGDX1UGSecret01', xp: 17.87, yp: 23.93, difficulty: 'ultimate' },

  ];

  // 2) MAPPING PAR TAILLE D’IMAGE (comme pour les rifts / nav markers) ----
  // Adapte les tailles si besoin, mais là je reprends exactement le pattern des rifts/nav :

  window.SHRINE_MARKERS_BY_SIZE = {
    '8948x9133': window.SHRINE_MARKERS_CAIRN,
    '5142x3574': window.SHRINE_MARKERS_MALMOUTH,
    '5427x5553': window.SHRINE_MARKERS_KORVAN,
  };

})();
