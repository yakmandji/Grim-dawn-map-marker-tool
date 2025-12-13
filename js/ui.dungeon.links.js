// ui.dungeon.links.js
// Mapping entre overlays (donjons) et entrées (marqueurs région)

// ui.dungeon.entries.js
// Nouveau type de markers : entrées de donjons (les yeux jaunes)

window.DUNGEON_ENTRY_MARKERS_CAIRN = [
{ id: "entry_convict_tunnel", xp: 63.30, yp: 89.56, tag: "Convict Tunnel" },
{ id: "entry_burial_cave", xp: 66.25, yp: 83.00, tag: "Burial Cave" },
{ id: "entry_burial_cave_b", xp: 65.19, yp: 82.23, tag: "Burial Cave b", eyeColor:"gray" },
{ id: "entry_cave", xp: 70.60, yp: 78.42, tag: "Cave" },
{ id: "entry_cave2", xp: 70.47, yp: 79.60, tag: "Cave 2" },
{ id: "entry_cultists_lair", xp: 70.48, yp: 76.12, tag: "Cultists Lair" },
{ id: "entry_caverne_2", xp: 71.36, yp: 73.50, tag: "Caverne 2" },
{ id: "entry_caverne_2b", xp: 69.33, yp: 72.90, tag: "Caverne 2", eyeColor:"gray" },
{ id: "entry_caverne_3", xp: 69.09, yp: 74.72, tag: "Caverne 3", eyeColor:"gray" },
{ id: "entry_caverne_3b", xp: 68.20, yp: 75.91, tag: "Caverne 3b" },
{ id: "entry_burial_cave_2a", xp: 69.07, yp: 68.91, tag: "burial cave 2a", eyeColor:"gray" },
{ id: "entry_burial_cave_2b", xp: 68.18, yp: 69.30, tag: "burial cave 2b" },
{ id: "entry_river_passage", xp: 71.13, yp: 63.24, tag: "river passage" },
{ id: "entry_river_passage2", xp: 70.40, yp: 62.10, tag: "river passage2", eyeColor:"gray" },
{ id: "entry_festering_lair", xp: 65.86, yp: 62.66, tag: "festering lair" },
{ id: "entry_depraved_sanctuary", xp: 73.26, yp: 71.31, tag: "Depraved Sanctuary" },
{ id: "entry_flooded_passage", xp: 67.66, yp: 71.93, tag: "Flooded Passage" },
{ id: "entry_flooded_passage2", xp: 70.50, yp: 71.40, tag: "Flooded Passage 2", eyeColor:"gray" },
{ id: "entry_flooded_cellar", xp: 66.95, yp: 65.67, tag: "Flooded Cellar" },
{ id: "entry_flooded_cellar2", xp: 67.38, yp: 64.96, tag: "Flooded Cellar 2", eyeColor:"gray" },
{ id: "entry_flooded_cellar3", xp: 68.19, yp: 65.00, tag: "Flooded Cellar 3", eyeColor:"green" },
{ id: "entry_temple_of_three", xp: 78.50, yp: 62.32, tag: "Temple Of Three" },
{ id: "entry_dank_cellar", xp: 69.80, yp: 60.24, tag: "Dank Cellar", eyeColor:"gray" },
{ id: "entry_dank_cellar2", xp: 68.86, yp: 60.01, tag: "Dank Cellar 2", eyeColor:"green" },
{ id: "entry_dank_cellar3", xp: 68.30, yp: 60.10, tag: "Dank Cellar 3" },
{ id: "entry_musty_cellar", xp: 67.87, yp: 59.16, tag: "Musty Cellar", eyeColor:"gray" },
{ id: "entry_musty_cellar2", xp: 68.74, yp: 58.74, tag: "Musty Cellar 2" },
{ id: "entry_underground_transit", xp: 70.10, yp: 59.10, tag: "Underground Transit" },
{ id: "entry_decrepit_cellar", xp: 75.80, yp: 54.27, tag: "Decrepit Cellar", eyeColor:"gray" },
{ id: "entry_decrepit_cellar2", xp: 77.31, yp: 52.29, tag: "Decrepit Cellar 2" },
{ id: "entry_overgrown_cellar", xp: 73.65, yp: 48.84, tag: "Overgrown Cellar" },
{ id: "entry_den_carraxus", xp: 79.37, yp: 45.85, tag: "Den Carraxus" },
{ id: "entry_ancient_groove", xp: 93.51, yp: 46.90, tag: "Ancient Groove" },
{ id: "entry_janaxias_den", xp: 90.27, yp: 46.09, tag: "Janaxias Den" },
{ id: "entry_undergrowth", xp: 88.82, yp: 36.41, tag: "Undergrowth" },
{ id: "entry_undergrowth2", xp: 89.43, yp: 32.93, tag: "Undergrowth 2" },
{ id: "entry_undergrowth3", xp: 84.41, yp: 32.29, tag: "Undergrowth 3" },
{ id: "entry_tomb_ugdall", xp: 87.35, yp: 31.07, tag: "Tomb Ugdall" },
{ id: "entry_den_of_wendigo", xp: 87.70, yp: 28.73, tag: "Den Of Wendigo" },
{ id: "entry_barrow_holm", xp: 91.46, yp: 27.20, tag: "Barrow Holm" },
{ id: "entry_desolate_waste", xp: 85.28, yp: 23.76, tag: "Desolate Waste" },
{ id: "entry_larrias_den", xp: 87.50, yp: 36.10, tag: "Larrias Den" },
{ id: "entry_spined_cove", xp: 57.89, yp: 85.92, tag: "Spined Cove" },
{ id: "entry_spined_cove2", xp: 56.61, yp: 86.84, tag: "Spined Cove 2", eyeColor:"gray" },
{ id: "entry_stirring_hive", xp: 52.28, yp: 81.30, tag: "Stirring Hive" },
{ id: "entry_hargate_laboratory", xp: 62.18, yp: 81.36, tag: "Hargate Laboratory", eyeColor:"gray-muted" },
{ id: "entry_hargate_laboratory2", xp: 61.47, yp: 80.85, tag: "Hargate Laboratory 2" },
{ id: "entry_staunton_mine", xp: 52.07, yp: 86.38, tag: "Staunton Mine", eyeColor:"gray"},
{ id: "entry_staunton_mine2", xp: 52.26, yp: 85.53, tag: "Staunton Mine 2" },
{ id: "entry_suffering_angish", xp: 49.69, yp: 85.44, tag: "Suffering Angish" },
{ id: "entry_corrupted_tomb", xp: 48.85, yp: 80.37, tag: "Corrupted Tomb" },
{ id: "entry_swarming_hive", xp: 47.59, yp: 79.02, tag: "Swarming Hive" },
{ id: "entry_hannefy_mine", xp: 52.15, yp: 76.94, tag: "Hannefy Mine", eyeColor:"gray" },
{ id: "entry_hannefy_mine2", xp: 53.30, yp: 75.07, tag: "Hannefy Mine 2" },
{ id: "entry_hannefy_mine3", xp: 54.04, yp: 76.75, tag: "Hannefy Mine", eyeColor:"purple" },

{ id: "entry_cronleys_hideout", xp: 52.64, yp: 76.17, tag: "Cronleys Hideout" },
{ id: "entry_cronleys_hideout2", xp: 49.87, yp: 77.11, tag: "Cronleys Hideout", eyeColor:"gray-muted"},

{ id: "entry_arkovian_undercity", xp: 49.16, yp: 79.23, tag: "Arkovian Undercity" },
{ id: "entry_arkovian_undercity2", xp: 50.29, yp: 81.46, tag: "Arkovian Undercity 2", eyeColor:"gray" },
{ id: "entry_smuggler_pass", xp: 39.41, yp: 77.83, tag: "Smuggler Pass" },
{ id: "entry_smuggler_pass2", xp: 29.37, yp: 77.95, tag: "Smuggler Pass2", eyeColor:"gray" },
{ id: "entry_Burried_crypt", xp: 29.69, yp: 69.94, tag: "Burried Crypt" },

{ id: "entry_the_hidden_path", xp: 13.10, yp: 34.28, tag: "The Hidden Path" },

{ id: "entry_forgotten_depths", xp: 41.45, yp: 75.93, tag: "Forgotten Depths", eyeColor:"gray" },
{ id: "entry_forgotten_depths2", xp: 41.88, yp: 73.90, tag: "Forgotten Depths 3" },
{ id: "entry_bloodbriars_lair", xp: 41.88, yp: 74.83, tag: "Bloodbriars Lair" },
{ id: "entry_mountain_deep", xp: 31.21, yp: 76.26, tag: "Mountain Deep" },
{ id: "entry_mountain_deep3", xp: 36.53, yp: 69.71, tag: "Mountain Deep 3", eyeColor:"gray" },

{ id: "entry_tyrant_hold", xp: 44.60, yp: 71.64, tag: "Tyrant Hold" },
{ id: "entry_tyrant_hold2", xp: 43.58, yp: 71.33, tag: "Tyrant Hold", eyeColor:"gray-muted" },

{ id: "entry_royal_hive", xp: 25.62, yp: 66.38, tag: "Royal Hive" },
{ id: "entry_royal_hive2", xp: 26.25, yp: 65.78, tag: "Royal Hive 2" },
{ id: "entry_royal_hive3", xp: 27.01, yp: 66.25, tag: "Royal Hive 3" },
{ id: "entry_royal_hive4", xp: 25.66, yp: 65.32, tag: "Royal Hive 4" },
{ id: "entry_bastion_order", xp: 31.89, yp: 58.89, tag: "Bastion Order" },
{ id: "entry_kymons_sanctuary", xp: 34.36, yp: 57.63, tag: "Kymons Sanctuary" },
{ id: "entry_ashen_waste", xp: 32.86, yp: 52.96, tag: "Ashen Waste" },
{ id: "entry_ashen_waste2", xp: 32.48, yp: 53.94, tag: "Ashen Waste 2" },
{ id: "entry_ashen_waste3", xp: 31.50, yp: 54.10, tag: "Ashen Waste 3" },
{ id: "entry_ashen_waste4", xp: 30.03, yp: 54.26, tag: "Ashen Waste 4" },
{ id: "entry_ashen_waste5", xp: 30.43, yp: 54.89, tag: "Ashen Waste 5" },
{ id: "entry_the_bonepit", xp: 34.93, yp: 51.89, tag: "The Bonepit" },
{ id: "entry_fort_haron", xp: 28.99, yp: 46.98, tag: "Fort Haron" },
{ id: "entry_darkvale_gate", xp: 22.59, yp: 45.02, tag: "Darkvale Gate" },
{ id: "entry_darkvale_gate2", xp: 21.09, yp: 40.68, tag: "Darkvale Gate 2", eyeColor:"gray" },

{ id: "entry_tomb_of_korvaak", xp: 10.05, yp: 31.72, tag: "Tomb Of Korvaak" },
{ id: "entry_tomb_of_korvaak2", xp: 9.68, yp: 31.88, tag: "Tomb Of Korvaak2", eyeColor:"gray-muted" },

{ id: "entry_tomb_of_the_damned", xp: 9.79, yp: 25.52, tag: "Tomb Of The Damned" },
{ id: "entry_fort_ikon_prison", xp: 13.84, yp: 20.17, tag: "Fort Ikon Prison", eyeColor:"gray-muted" },
{ id: "entry_fort_ikon_prison2", xp: 14.47, yp: 22.36, tag: "Fort Ikon Prison 2" },
{ id: "entry_fort_ikon_armory", xp: 14.44, yp: 20.03, tag: "Fort Ikon Armory" },
{ id: "entry_fort_ikon_armory2", xp: 16.29, yp: 21.43, tag: "Fort Ikon Armory 2", eyeColor:"gray-muted" },
{ id: "entry_obsidian_throne", xp: 21.08, yp: 20.73, tag: "Obsidian Throne" },
{ id: "entry_obsidian_throne2", xp: 21.54, yp: 19.14, tag: "Obsidian Throne 2" },
{ id: "entry_obsidian_throne3", xp: 20.06, yp: 18.90, tag: "Obsidian Throne 3" },
{ id: "entry_edge_of_reality", xp: 25.58, yp: 13.28, tag: "Edge Of Reality" },
{ id: "entry_black_sepulcher", xp: 26.11, yp: 9.43, tag: "Black Sepulcher" },
{ id: "entry_discord_anarchy", xp: 21.47, yp: 0.88, tag: "Discord Anarchy" },
{ id: "entry_tom_of_the_watcher", xp: 23.40, yp: 4.59, tag: "Tom Of The Watcher" },
{ id: "entry_tom_of_the_watcher2", xp: 23.11, yp: 4.57, tag: "Tom Of The Watcher", eyeColor:"gray" },

{ id: "entry_port_valbury_fondation", xp: 41.93, yp: 30.63, tag: "Port Valbury Fondation" },
{ id: "entry_port_valbury_fondation2", xp: 41.39, yp: 29.93, tag: "Port Valbury Fondation 2", eyeColor:"gray" },
{ id: "entry_altritch_karters", xp: 40.81, yp: 21.21, tag: "Altritch Karters" }

];

window.DUNGEON_ENTRY_MARKERS_MALMOUTH = [
{ id: "entry_burning_cellar_01", xp: 66.14, yp: 46.42, tag: "Burning Cellar 01" },
{ id: "entry_burning_cellar_02", xp: 67.37, yp: 42.27, tag: "Burning Cellar 02", eyeColor:"gray" },
{ id: "entry_fringes_of_sanity", xp: 68.76, yp: 59.44, tag: "Fringes Of Sanity" },
{ id: "entry_cinder_waste", xp: 64.99, yp: 61.18, tag: "Cinder Waste" },
{ id: "entry_cinder_waste_02", xp: 67.11, yp: 69.07, tag: "Cinder Waste 02" },
{ id: "entry_cinder_waste_03", xp: 73.70, yp: 68.19, tag: "Cinder Waste 03" },
{ id: "entry_edge_reality", xp: 60.22, yp: 54.58, tag: "Edge Of Reality" },
{ id: "entry_sewer_hideout", xp: 51.37, yp: 45.61, tag: "Sewer Hideout" },
{ id: "entry_sewer_hideout_02", xp: 49.48, yp: 36.42, tag: "Sewer Hideout 02", eyeColor:"gray" },
{ id: "entry_sewer_hideout_03", xp: 59.10, yp: 38.00, tag: "Sewer Hideout 03", eyeColor:"green" },
{ id: "entry_herald_mathis", xp: 41.55, yp: 49.89, tag: "Herald Mathis" },
{ id: "entry_ransaked_lighthouse", xp: 38.11, yp: 41.07, tag: "Ransacked Lighthouse" },
{ id: "entry_swelling_depths", xp: 43.76, yp: 31.72, tag: "Swelling Depths" },
{ id: "entry_infestation", xp: 50.67, yp: 3.68, tag: "Infestation" },
{ id: "entry_chamber_council", xp: 49.78, yp: 19.58, tag: "Chamber Council" }

];


window.DUNGEON_ENTRY_MARKERS_KORVAN = [
  { id: "entry_forgotten_cellar", xp: 19.27, yp: 95.47, tag: "Forgotten Cellar" },
  { id: "entry_veiled_den", xp: 18.72, yp: 96.56, tag: "Veiled Den" },
  { id: "entry_crawling_nest", xp: 21.56, yp: 86.78, tag: "Crawling Nest" },
  { id: "entry_temple_osyr", xp: 34.83, yp: 75.86, tag: "Temple Osyr" },
  { id: "entry_maw_of_enaht", xp: 31.57, yp: 56.48, tag: "Maw Of Enaht" },
  { id: "entry_forlorn_bastion", xp: 18.99, yp: 62.02, tag: "Forlorn Bastion" },
  { id: "entry_sandblown_ruin", xp: 32.97, yp: 52.27, tag: "Sandblown Ruin" },
  { id: "entry_durgs_den", xp: 37.88, yp: 53.45, tag: "Durgs Den" },
  { id: "entry_howling_chasm", xp: 55.09, yp: 48.37, tag: "Howling Chasm" },
  { id: "entry_howling_chasm2", xp: 58.55, yp: 47.54, tag: "Howling Chasm 2", eyeColor:"gray" },
  { id: "entry_sanctuary_horan", xp: 48.98, yp: 51.75, tag: "Sanctuary Horan" },
  { id: "entry_edge_reality_korv", xp: 67.02, yp: 48.35, tag: "Edge Reality Korv" },
  { id: "entry_bloodied_waste", xp: 70.47, yp: 44.66, tag: "Bloodied Waste" },
  { id: "entry_temple_athep", xp: 73.22, yp: 42.55, tag: "Temple Athep" },
  { id: "entry_temple_athep2", xp: 68.82, yp: 41.88, tag: "Temple Athep2", eyeColor:"gray-muted" },

  { id: "entry_tomb_sethan", xp: 57.46, yp: 39.53, tag: "Tomb Sethan" },
  { id: "entry_tomb_sethan2", xp: 59.37, yp: 33.20, tag: "Tomb Sethan 2" },
  { id: "entry_tomb_ariath", xp: 51.61, yp: 32.09, tag: "Tomb Ariath" },
  { id: "entry_tomb_nephos", xp: 56.43, yp: 29.84, tag: "Tomb Nephos" },
  { id: "entry_tomb_nephos2", xp: 57.14, yp: 28.36, tag: "Tomb Nephos 2", eyeColor:"gray-muted" },
  { id: "entry_tomb_nephos3", xp: 58.05, yp: 29.57, tag: "Tomb Nephos 3", eyeColor:"gray-muted" },
  { id: "entry_heretic_maggi", xp: 60.78, yp: 26.09, tag: "Heretic Maggi" },
  { id: "entry_pit_atonement", xp: 52.66, yp: 22.22, tag: "Pit Atonement" },
  { id: "entry_map_room_rahn", xp: 53.03, yp: 17.11, tag: "Map Room Rahn" },
  { id: "entry_sunward_spire", xp: 47.65, yp: 13.58, tag: "Sunward Spire" },
  { id: "entry_tomb_eldtrich_sun", xp: 57.86, yp: 15.17, tag: "Tomb Eldritch Sun" },
  { id: "entry_sanctum_choosen", xp: 26.77, yp: 31.19, tag: "Sanctum Chosen" },

  { id: "entry_splendors_shattered_realm", xp: 20.09, yp: 97.32, tag: "Sanctum Chosen" },


];

window.DUNGEON_LINKS = {

  /*CAIRN*/
  
  "river_passage":["entry_river_passage", "entry_river_passage2"],
  "festering_lair":["entry_festering_lair"],
  "buried_crypt":["entry_Burried_crypt"],
  "the_hidden_path":["entry_the_hidden_path"],


  "burial_cave2":["entry_burial_cave_2a", "entry_burial_cave_2b"],
  "caverne_3": ["entry_caverne_3", "entry_caverne_3b"],
  "convict_tunnel": ["entry_convict_tunnel"],
  "burial_cave": ["entry_burial_cave", "entry_burial_cave_b"],
  "cave": ["entry_cave", "entry_cave2"],
  "cultists_lair": ["entry_cultists_lair"],
  "caverne_2": ["entry_caverne_2", "entry_caverne_2b"],
  "depraved_sanctuary": ["entry_depraved_sanctuary"],
  "flooded_passage": ["entry_flooded_passage", "entry_flooded_passage2"],
  "flooded_cellar": ["entry_flooded_cellar", "entry_flooded_cellar2", "entry_flooded_cellar3"],
  "temple_of_three": ["entry_temple_of_three"],
  "dank_cellar": ["entry_dank_cellar","entry_dank_cellar2","entry_dank_cellar3"],
  "musty_cellar": ["entry_musty_cellar","entry_musty_cellar2"],
  "underground_transit": ["entry_underground_transit"],
  "decrepit_cellar": ["entry_decrepit_cellar", "entry_decrepit_cellar2"],
  "overgrown_cellar": ["entry_overgrown_cellar"],
  "den_carraxus": ["entry_den_carraxus"],
  "ancient_groove": ["entry_ancient_groove"],
  "janaxias_den": ["entry_janaxias_den"],
  "larrias_den": ["entry_larrias_den"],
  "undergrowth": ["entry_undergrowth","entry_undergrowth2","entry_undergrowth3"],
  "tomb_ugdall": ["entry_tomb_ugdall"],
  "den_of_wendigo": ["entry_den_of_wendigo"],
  "barrow_holm": ["entry_barrow_holm"],
  "desolate_waste": ["entry_desolate_waste"],
  "spined_cove": ["entry_spined_cove","entry_spined_cove2"],
  "stirring_hive": ["entry_stirring_hive"],
  "hargate_laboratory": ["entry_hargate_laboratory","entry_hargate_laboratory2"],
  "staunton_mine": ["entry_staunton_mine","entry_staunton_mine2"],
  "suffering_angish": ["entry_suffering_angish"],
  "corrupted_tomb": ["entry_corrupted_tomb"],
  "swarming_hive": ["entry_swarming_hive"],
  "hannefy_mine": ["entry_hannefy_mine","entry_hannefy_mine2", "entry_hannefy_mine3"],
  "cronleys_hideout": ["entry_cronleys_hideout", "entry_cronleys_hideout2"],
  "arkovian_undercity": ["entry_arkovian_undercity","entry_arkovian_undercity2"],
  "smuggler_pass": ["entry_smuggler_pass", "entry_smuggler_pass2"],
  "forgotten_depths": ["entry_forgotten_depths","entry_forgotten_depths2"],

  "bloodbriars_lair": ["entry_bloodbriars_lair"],


  "mountain_deep": ["entry_mountain_deep","entry_mountain_deep2","entry_mountain_deep3"],
  "tyrant_hold": ["entry_tyrant_hold", "entry_tyrant_hold2"],
  "royal_hive": ["entry_royal_hive","entry_royal_hive2","entry_royal_hive3","entry_royal_hive4"],
  "bastion_order": ["entry_bastion_order"],
  "kymons_sanctuary": ["entry_kymons_sanctuary"],
  "ashen_waste": ["entry_ashen_waste","entry_ashen_waste2","entry_ashen_waste3","entry_ashen_waste4","entry_ashen_waste5"],
  "the_bonepit": ["entry_the_bonepit"],
  "fort_haron": ["entry_fort_haron"],
  "darkvale_gate": ["entry_darkvale_gate","entry_darkvale_gate2"],
  "tomb_of_korvaak": ["entry_tomb_of_korvaak", "entry_tomb_of_korvaak2"],
  "tomb_of_the_damned": ["entry_tomb_of_the_damned"],
  "fort_ikon_prison": ["entry_fort_ikon_prison","entry_fort_ikon_prison2"],
  "fort_ikon_prison": ["entry_fort_ikon_prison","entry_fort_ikon_prison2"],
  "fort_ikon_armory": ["entry_fort_ikon_armory","entry_fort_ikon_armory2"],
  "obsidian_throne": ["entry_obsidian_throne","entry_obsidian_throne2","entry_obsidian_throne3"],
  "edge_of_reality": ["entry_edge_of_reality"],
  "black_sepulcher": ["entry_black_sepulcher"],
  "discord_anarchy": ["entry_discord_anarchy"],
  "tom_of_the_watcher": ["entry_tom_of_the_watcher", "entry_tom_of_the_watcher2"],
  "entropy": ["entry_entropy"],
  "port_valbury_fondation": ["entry_port_valbury_fondation","entry_port_valbury_fondation2"],
  "altritch_karters": ["entry_altritch_karters"],

  /*MALMOUTH*/
  "burning_cellar": ["entry_burning_cellar_01", "entry_burning_cellar_02"],
  "fringes_of_sanity": ["entry_fringes_of_sanity" ],
  "cinder_waste": ["entry_cinder_waste", "entry_cinder_waste_02", "entry_cinder_waste_03" ],
  "edge_reality": ["entry_edge_reality" ],
  "sewer_hideout": ["entry_sewer_hideout", "entry_sewer_hideout_02" , "entry_sewer_hideout_03" ],
  "herald_mathis": ["entry_herald_mathis" ],
  "ransaked_lighthouse": ["entry_ransaked_lighthouse" ],
  "swelling_depths": ["entry_swelling_depths" ],
  "infestation": ["entry_infestation" ],
  "chamber_council": ["entry_chamber_council" ],

  /*KORVAN*/
  "forgotten_cellar": ["entry_forgotten_cellar" ],
  "veiled_den": ["entry_veiled_den" ],
  "crawling_nest": ["entry_crawling_nest" ],
  "temple_osyr": ["entry_temple_osyr" ],
  "maw_of_enaht": ["entry_maw_of_enaht" ],
  "forlorn_bastion": ["entry_forlorn_bastion" ],
  "sandblown_ruin": ["entry_sandblown_ruin" ],
  "durgs_den": ["entry_durgs_den" ],
  "howling_chasm": ["entry_howling_chasm","entry_howling_chasm2" ],
  "sanctuary_horan": ["entry_sanctuary_horan"],
  "edge_reality_korv": ["entry_edge_reality_korv"],
  "bloodied_waste": ["entry_bloodied_waste"],
  "temple_athep": ["entry_temple_athep", "entry_temple_athep2"],
  "tomb_sethan": ["entry_tomb_sethan", "entry_tomb_sethan2"],
  "tomb_ariath": ["entry_tomb_ariath"],
  "tomb_nephos": ["entry_tomb_nephos","entry_tomb_nephos2","entry_tomb_nephos3"],
  "heretic_maggi": ["entry_heretic_maggi"],
  "pit_atonement": ["entry_pit_atonement"],
  "map_room_rahn": ["entry_map_room_rahn"],
  "sunward_spire": ["entry_sunward_spire"],
  "tomb_eldtrich_sun": ["entry_tomb_eldtrich_sun"],
  "sanctum_choosen": ["entry_sanctum_choosen"],
  "splendors_shattered_realm" : ["entry_splendors_shattered_realm"],
  


};


window.DUNGEON_ENTRY_MARKERS_BY_SIZE = {
  "8948x9133": window.DUNGEON_ENTRY_MARKERS_CAIRN,
  "5142x3574": window.DUNGEON_ENTRY_MARKERS_MALMOUTH,
  "5427x5553": window.DUNGEON_ENTRY_MARKERS_KORVAN,
};


// =====================================================
// TRAITS DONJON <-> ENTREES
// =====================================================


const EYE_LINK_STYLE = {
  yellow: {
    stroke: 'rgba(255,220,80,0.9)',
    glow:   'drop-shadow(0 0 3px #ffd84a) drop-shadow(0 0 6px #ffd84aaa)',
  },
  green: {
    stroke: 'rgba(33,216,207,0.8)',
    glow:   'drop-shadow(0 0 3px #00ffb4) drop-shadow(0 0 6px #00ffb4aa)',
  },
  purple: {
    stroke: 'rgba(190,120,255,0.85)',
    glow:   'drop-shadow(0 0 3px #c28bff) drop-shadow(0 0 6px #c28bffaa)',
  },
  blue: {
    stroke: 'rgba(100,190,255,0.85)',
    glow:   'drop-shadow(0 0 3px #7fd3ff) drop-shadow(0 0 6px #7fd3ffaa)',
  },
  gray: {
    stroke: 'rgba(200,200,200,0.75)',
    glow:   'drop-shadow(0 0 2px #bbb) drop-shadow(0 0 4px #ffffff55)',
  },
  'gray-muted': {
    stroke: 'rgba(170,170,170,0.55)',
    glow:   'drop-shadow(0 0 1px #aaa)',
  },
};




function ensureDungeonLinkLayer() {
  const inner = document.getElementById('mapInner');
  if (!inner) return null;

  let svg = document.getElementById('dungeonLinkLayer');
  const state = window.GDMMCore?.state || {};
  const iw = state.mapNatural?.w || 1;
  const ih = state.mapNatural?.h || 1;

  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'dungeonLinkLayer';
    svg.classList.add('dungeon-link-layer');
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.pointerEvents = 'none';
    inner.appendChild(svg);
  }

  svg.setAttribute('width', iw);
  svg.setAttribute('height', ih);
  svg.setAttribute('viewBox', `0 0 ${iw} ${ih}`);
  return svg;
}


function clearDungeonLinks() {
  const svg = document.getElementById('dungeonLinkLayer');
  if (svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  const core = window.GDMMCore || {};
  const state = core.state || {};

  state.dungeonForcedHover = null;

  if (state.dungeonOverlays) {
    state.dungeonOverlays.forEach(o => {
      if (o.el) o.el.classList.remove('is-hovered');
    });
  }
  const labels = document.querySelectorAll('.marker-region-dungeon .region-label.opacity');
  labels.forEach(l => l.classList.remove('opacity'));

}

window.clearDungeonLinks = clearDungeonLinks;

// --- highlight des labels de région dans un donjon donné ---
function highlightDungeonRegionLabelsForOverlay(overlayObj) {
  if (!overlayObj || !overlayObj.el) return;

  // tous les labels "d donjon"
  const labels = document.querySelectorAll('.marker-region-dungeon .region-label');
  if (!labels.length) return;
  labels.forEach(l => l.classList.remove('opacity'));

  const rect = overlayObj.el.getBoundingClientRect();

  labels.forEach(l => {
    const r = l.getBoundingClientRect();
    const intersect =
      !(r.right  < rect.left ||
        r.left   > rect.right ||
        r.bottom < rect.top ||
        r.top    > rect.bottom);

    if (intersect) {
      l.classList.add('opacity');
    }
  });
}


// --- helpers centres en coords "map" (0..mapNatural.w/h) ---
function getOverlayCenterMap(ov, iw, ih) {
  const cxp = ov.left + ov.width / 2;
  const cyp = ov.top  + ov.height / 2;
  return {
    x: (cxp / 100) * iw,
    y: (cyp / 100) * ih,
  };
}

function getEntryCenterMap(entryCfg, iw, ih) {
  return {
    x: (entryCfg.xp / 100) * iw,
    y: (entryCfg.yp / 100) * ih,
  };
}


// Retourne le point où la ligne oeil->centre touche le bord du rect du donjon
function getOverlayEdgePoint(ex, ey, overlayObj, iw, ih) {
  const left   = (overlayObj.left  / 100) * iw;
  const top    = (overlayObj.top   / 100) * ih;
  const width  = (overlayObj.width / 100) * iw;
  const height = (overlayObj.height/ 100) * ih;

  const xMin = left;
  const xMax = left + width;
  const yMin = top;
  const yMax = top + height;

  const center = getOverlayCenterMap(overlayObj, iw, ih);
  const ox = center.x;
  const oy = center.y;

  const dx = ox - ex;
  const dy = oy - ey;

  let tMin = Infinity;
  let ix = ox;
  let iy = oy;

  function testSide(tx, ty, t) {
    if (t < 0 || t > 1) return;
    if (tx < xMin - 0.001 || tx > xMax + 0.001) return;
    if (ty < yMin - 0.001 || ty > yMax + 0.001) return;
    if (t < tMin) {
      tMin = t;
      ix = tx;
      iy = ty;
    }
  }

  if (Math.abs(dx) > 1e-6) {
    const tLeft  = (xMin - ex) / dx;
    const yL     = ey + tLeft * dy;
    testSide(xMin, yL, tLeft);

    const tRight = (xMax - ex) / dx;
    const yR     = ey + tRight * dy;
    testSide(xMax, yR, tRight);
  }

  if (Math.abs(dy) > 1e-6) {
    const tTop    = (yMin - ey) / dy;
    const xT      = ex + tTop * dx;
    testSide(xT, yMin, tTop);

    const tBottom = (yMax - ey) / dy;
    const xB      = ex + tBottom * dx;
    testSide(xB, yMax, tBottom);
  }

  return { x: ix, y: iy };
}



// --- dessine les traits pour un overlay donné ---
function drawDungeonLinesForOverlay(overlayObj) {
  const core  = window.GDMMCore || {};
  const state = core.state || {};
  if (!state.mapNatural) return;

  const links = window.DUNGEON_LINKS || {};
  const entryIds = links[overlayObj.cfg.id] || [];
  if (!entryIds.length) return;
  if (!state.dungeonEntries) return;

  const iw = state.mapNatural.w;
  const ih = state.mapNatural.h;

  const svg = ensureDungeonLinkLayer();
  if (!svg) return;

  // on efface les anciens traits mais on garde le layer
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const oCenter = getOverlayCenterMap(overlayObj, iw, ih);

  entryIds.forEach(entryId => {
    const entryObj = state.dungeonEntries[entryId];
    if (!entryObj || !entryObj.cfg) return;

    const eCenter = getEntryCenterMap(entryObj.cfg, iw, ih);

    // point sur le bord du donjon côté oeil
    const edge = getOverlayEdgePoint(eCenter.x, eCenter.y, overlayObj, iw, ih);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    // on part de l'œil vers le bord du donjon
    line.setAttribute('x1', eCenter.x);
    line.setAttribute('y1', eCenter.y);
    line.setAttribute('x2', edge.x);
    line.setAttribute('y2', edge.y);

    // Style lié à la couleur de l'œil
    const eyeColor = (entryObj.cfg.eyeColor || 'yellow').toLowerCase();
    const style = EYE_LINK_STYLE[eyeColor] || EYE_LINK_STYLE.green;

    line.setAttribute('stroke', style.stroke);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-linecap', 'round');
    /* line.setAttribute('stroke-dasharray', '2 6'); */
    line.style.filter = style.glow;

    svg.appendChild(line);
  });

}

// --- survol d'une ENTREE (oeil) ---
function showDungeonLinksForEntry(entryId) {
  const core  = window.GDMMCore || {};
  const state = core.state || {};
  if (!state.dungeonOverlays || !state.dungeonEntries) return;

  const mapping = window.DUNGEON_LINKS || {};

  // trouver l'overlay lié à cette entrée
  const overlayId = Object.keys(mapping).find(ovId => {
    const arr = mapping[ovId] || [];
    return arr.includes(entryId);
  });

  if (!overlayId) {
    clearDungeonLinks();
    return;
  }

  // TOGGLE : si ce donjon est déjà forcé -> on éteint
  if (Array.isArray(state.dungeonForcedHover)
      && state.dungeonForcedHover.length === 1
      && state.dungeonForcedHover[0] === overlayId) {

    clearDungeonLinks();
    return;
  }

  const overlayObj = state.dungeonOverlays.find(o => o.cfg.id === overlayId);
  if (!overlayObj) {
    clearDungeonLinks();
    return;
  }

  // hover forcé de ce donjon
  state.dungeonForcedHover = [overlayId];
  state.dungeonOverlays.forEach(o => {
    if (!o.el) return;
    o.el.classList.toggle('is-hovered', o === overlayObj);
  });

  drawDungeonLinesForOverlay(overlayObj);
  highlightDungeonRegionLabelsForOverlay(overlayObj);
}
window.showDungeonLinksForEntry = showDungeonLinksForEntry;



window.showDungeonLinksForEntry = showDungeonLinksForEntry;

// --- survol d'un OVERLAY (layer donjon) ---
function showDungeonLinksForOverlay(overlayId) {
  const core  = window.GDMMCore || {};
  const state = core.state || {};
  if (!state.dungeonOverlays || !state.dungeonEntries) return;

  const overlayObj = state.dungeonOverlays.find(o => o.cfg.id === overlayId);
  if (!overlayObj) {
    clearDungeonLinks();
    return;
  }

  state.dungeonForcedHover = [overlayId];
  state.dungeonOverlays.forEach(o => {
    if (!o.el) return;
    o.el.classList.toggle('is-hovered', o === overlayObj);
  });

  drawDungeonLinesForOverlay(overlayObj);
  highlightDungeonRegionLabelsForOverlay(overlayObj);
}

window.showDungeonLinksForOverlay = showDungeonLinksForOverlay;
