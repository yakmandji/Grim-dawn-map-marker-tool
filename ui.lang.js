// ui.lang.js
(function () {
  const LANG_KEY = 'gdmm_lang';

  const translations = {
    en: {
      'ui.NewMarkerTitle': 'New marker',
      'ui.GeneralMarker': '🔘 General',
      'ui.QuestMarker': '⭐ Quest',
      'ui.BossMarker': '💀 Boss',
      'ui.LootMarker': '🗝️ Loot',
      'ui.WaypointMarker': '📍 Waypoint',
      'ui.DonjonMarker': '🏰 Donjon',
      'ui.NPCMarker': '💬 NPC',
      'ui.SaveMarkerButton': '💾 Save markers',
      'ui.ToolsTitle': 'Tools',
      'ui.RoutesList': 'Routes list',
      'ui.MarkerList': 'Markers list',
      'ui.Done': 'Done',
      'ui.AddMarkerButton': '📍 Add',
      'ui.NewPathTitle': 'New Path',
      'ui.PathHelper': 'Hold Space to drag the map while drawing a path',
      'ui.AddRouteButton': '➕ Add',
      'ui.FinishPath': '✅ Finish',
      'ui.LockMarker': '🔒 Lock markers',
      'ui.ImportExportHelper': 'Import and Export are only needed if you switch browser, computer, or for share. For normal save use the header button.',
      'ui.ImportButton': 'Import save',
      'ui.ExportButton': 'Export save',
      'ui.DeleteMarkerButton': 'Delete all markers',
      'ui.DeletePathButton': 'Delete all paths',
      'ui.Help': 'How to use',
      'ui.HelpTitle': 'Help',
      'ui.HelpLine1': 'Select a map from the dropdown in the header (main or DLC)',
      'ui.HelpLine2': 'Add your markers 📍',
      'ui.HelpLine3': 'Your markers are saved automatically. Use the "Save markers" button in the header to save manually if needed',
      'ui.DeleteButton': 'Delete',
      'toast.MarkerNameUpdated' : 'Marker name updated 💾',
      'toast.RouteNameSaved' : 'Route name saved 💾',
      'toast.PathFinished' : 'Path finished ✅',
      'toast.NoPath' : 'No current path',
      'toast.LoadingMap' : 'Loading Map...',
      'toast.SaveState' : '● Saved',
      'toast.UnsaveState' : '● Unsaved',
      'toast.SaveMarkerAndRoute' : 'Markers & routes saved locally 💾',
      'toast.FullMapDataImported' : 'Full map data imported ✅',
      'toast.PathImported' : 'Paths imported ✅',
      'toast.MarkerImported' : 'Markers imported ✅',
      'toast.WarnDeleteAllPath' : 'Do you really want to delete all paths from this map?',
      'toast.AllPathDeleted' : 'All paths cleared for this map 🧹',
      'toast.MarkerMapCleared' : 'Markers cleared for this map 🧹',
      'toast.CantLoadData' : 'Could not load user data:',
      'toast.CantSaveData' : 'Could not save user data locally:',
      'toast.PathInProgress' : 'Path in progress…',
      'toast.ExportAll' : 'All data have been saved 💾',

      'toast.ShareUrlCopied': 'Share link copied to clipboard 📋',
      'toast.SharedMerged': 'Shared markers and routes added to your map ✅',
      'toast.SharedTargetMissing': 'Original map not found. Maybe it was renamed or deleted ❌',

      'ui.ShareRoutesButton': 'Share routes',
      'ui.SharedViewLabel': 'Shared map (read-only)',
      'ui.SharedTargetLabel': 'Add to map:',
      'ui.SharedMergeButton': 'Add to my map',
      'ui.MergeRoutesButton': 'Add shared to my map',

      'ui.PathNamePlaceholder': 'Path name (optional)',
      'ui.MarkerNamePlaceholder': 'Name / note',
    },
    fr: {
      'ui.NewMarkerTitle': 'Nouveau marqueur',
      'ui.GeneralMarker': '🔘 Général',
      'ui.QuestMarker': '⭐ Quête',
      'ui.BossMarker': '💀 Boss',
      'ui.LootMarker': '🗝️ Butin',
      'ui.WaypointMarker': '📍 Point de passage',
      'ui.DonjonMarker': '🏰 Donjon',
      'ui.NPCMarker': '💬 PNJ',
      'ui.SaveMarkerButton': '💾 Sauvegarder les marqueurs',
      'ui.ToolsTitle': 'Outils',
      'ui.RoutesList': 'Liste des routes',
      'ui.MarkerList': 'Liste des marqueurs',
      'ui.Done': 'Terminé',
      'ui.AddMarkerButton': '📍 Ajouter',
      'ui.NewPathTitle': 'Nouveau tracé',
      'ui.PathHelper': 'Maintenir Espace pour déplacer la carte pendant le tracé',
      'ui.AddRouteButton': '➕ Ajouter',
      'ui.FinishPath': '✅ Terminer',
      'ui.LockMarker': '🔒 Verrouiller les marqueurs',
      'ui.ImportExportHelper': 'Import/export uniquement si vous changez de navigateur, d’ordinateur ou pour partager vos données. Pour une sauvegarde normale, utilisez le bouton dans l’en-tête.',
      'ui.ImportButton': 'Importer une sauvegarde',
      'ui.ExportButton': 'Exporter la sauvegarde',
      'ui.DeleteMarkerButton': 'Supprimer tous les marqueurs',
      'ui.DeletePathButton': 'Supprimer tous les tracés',
      'ui.Help': 'Guide d’utilisation',
      'ui.HelpTitle': 'Aide',
      'ui.HelpLine1': 'Choisissez une carte depuis le menu déroulant dans l’en-tête (principale ou DLC)',
      'ui.HelpLine2': 'Ajoutez vos marqueurs 📍',
      'ui.HelpLine3': 'Vos marqueurs sont sauvegardés automatiquement. Utilisez le bouton "Sauvegarder les marqueurs" si besoin.',
      'ui.DeleteButton': 'Supprimer',
      'toast.MarkerNameUpdated' : 'Nom du marqueur mis à jour 💾',
      'toast.RouteNameSaved' : 'Nom de la route sauvegardé 💾',
      'toast.PathFinished' : 'Tracé terminé ✅',
      'toast.NoPath' : 'Aucun tracé en cours',
      'toast.LoadingMap' : 'Chargement de la carte...',
      'toast.SaveState' : '● Sauvegardé',
      'toast.UnsaveState' : '● Non sauvegardé',
      'toast.SaveMarkerAndRoute' : 'Marqueurs et routes sauvegardés localement 💾',
      'toast.FullMapDataImported' : 'Données complètes importées ✅',
      'toast.PathImported' : 'Tracés importés ✅',
      'toast.MarkerImported' : 'Marqueurs importés ✅',
      'toast.WarnDeleteAllPath' : 'Voulez-vous vraiment supprimer tous les tracés de cette carte ?',
      'toast.AllPathDeleted' : 'Tous les tracés ont été supprimés 🧹',
      'toast.MarkerMapCleared' : 'Marqueurs supprimés pour cette carte 🧹',
      'toast.CantLoadData' : 'Impossible de charger les données utilisateur :',
      'toast.CantSaveData' : 'Impossible d’enregistrer les données localement :',
      'toast.PathInProgress' : 'Tracé en cours…',
      'toast.ExportAll' : 'Toutes les données ont été sauvegardées 💾',

      'toast.ShareUrlCopied': 'Lien de partage copié dans le presse-papiers 📋',
      'toast.SharedMerged': 'Marqueurs et tracés partagés ajoutés à votre carte ✅',
      'toast.SharedTargetMissing': 'Carte d’origine introuvable. Elle a peut-être été renommée ou supprimée ❌',

      'ui.ShareRoutesButton': 'Partager les tracés',
      'ui.SharedViewLabel': 'Carte partagée (lecture seule)',
      'ui.SharedTargetLabel': 'Ajouter à la carte :',
      'ui.SharedMergeButton': 'Ajouter à ma carte',
    'ui.MergeRoutesButton': 'Ajouter le partage à ma carte',


      'ui.PathNamePlaceholder': 'Nom du trajet (optionnel)',
      'ui.MarkerNamePlaceholder': 'Nom / note',
    },
    es: {
      'ui.NewMarkerTitle': 'Nuevo marcador',
      'ui.GeneralMarker': '🔘 General',
      'ui.QuestMarker': '⭐ Misión',
      'ui.BossMarker': '💀 Jefe',
      'ui.LootMarker': '🗝️ Botín',
      'ui.WaypointMarker': '📍 Punto de ruta',
      'ui.DonjonMarker': '🏰 Mazmorra',
      'ui.NPCMarker': '💬 NPC',
      'ui.SaveMarkerButton': '💾 Guardar marcadores',
      'ui.ToolsTitle': 'Herramientas',
      'ui.RoutesList': 'Lista de rutas',
      'ui.MarkerList': 'Lista de marcadores',
      'ui.Done': 'Hecho',
      'ui.AddMarkerButton': '📍 Añadir',
      'ui.NewPathTitle': 'Nuevo recorrido',
      'ui.PathHelper': 'Mantén Espacio para mover el mapa mientras dibujas el recorrido',
      'ui.AddRouteButton': '➕ Añadir',
      'ui.FinishPath': '✅ Terminar',
      'ui.LockMarker': '🔒 Bloquear marcadores',
      'ui.ImportExportHelper': 'Importar/exportar solo si cambias de navegador, ordenador o para compartir tus datos. Para guardar normalmente, usa el botón en el encabezado.',
      'ui.ImportButton': 'Importar guardado',
      'ui.ExportButton': 'Exportar guardado',
      'ui.DeleteMarkerButton': 'Eliminar todos los marcadores',
      'ui.DeletePathButton': 'Eliminar todos los recorridos',
      'ui.Help': 'Cómo usar',
      'ui.HelpTitle': 'Ayuda',
      'ui.HelpLine1': 'Selecciona un mapa desde el menú desplegable en el encabezado (principal o DLC)',
      'ui.HelpLine2': 'Añade tus marcadores 📍',
      'ui.HelpLine3': 'Tus marcadores se guardan automáticamente. Usa el botón "Guardar marcadores" en el encabezado si lo necesitas.',
      'ui.DeleteButton': 'Eliminar',

      'toast.MarkerNameUpdated': 'Nombre del marcador actualizado 💾',
      'toast.RouteNameSaved': 'Nombre de la ruta guardado 💾',
      'toast.PathFinished': 'Recorrido terminado ✅',
      'toast.NoPath': 'No hay recorrido en curso',
      'toast.LoadingMap': 'Cargando mapa...',
      'toast.SaveState': '● Guardado',
      'toast.UnsaveState': '● No guardado',
      'toast.SaveMarkerAndRoute': 'Marcadores y rutas guardados localmente 💾',
      'toast.FullMapDataImported': 'Datos completos importados ✅',
      'toast.PathImported': 'Recorridos importados ✅',
      'toast.MarkerImported': 'Marcadores importados ✅',
      'toast.WarnDeleteAllPath': '¿Realmente deseas eliminar todos los recorridos de este mapa?',
      'toast.AllPathDeleted': 'Todos los recorridos eliminados 🧹',
      'toast.MarkerMapCleared': 'Marcadores eliminados para este mapa 🧹',
      'toast.CantLoadData': 'No se pudieron cargar los datos del usuario:',
      'toast.CantSaveData': 'No se pudieron guardar los datos localmente:',
      'toast.PathInProgress': 'Recorrido en progreso…',
      'toast.ExportAll': 'Todos los datos se han guardado 💾',

      'toast.ShareUrlCopied': 'Enlace de compartición copiado al portapapeles 📋',
      'toast.SharedMerged': 'Marcadores y rutas compartidos añadidos a tu mapa ✅',
      'toast.SharedTargetMissing': 'Mapa original no encontrado. Puede que se haya renombrado o eliminado ❌',

      'ui.ShareRoutesButton': 'Compartir rutas',
      'ui.SharedViewLabel': 'Mapa compartido (solo lectura)',
      'ui.SharedTargetLabel': 'Agregar al mapa:',
      'ui.SharedMergeButton': 'Agregar a mi mapa',
      'ui.MergeRoutesButton': 'Agregar el compartido a mi mapa',


      'ui.PathNamePlaceholder': 'Nombre del recorrido (opcional)',
      'ui.MarkerNamePlaceholder': 'Nombre / nota',
    },
  pt: {
    'ui.NewMarkerTitle': 'Novo marcador',
    'ui.GeneralMarker': '🔘 Geral',
    'ui.QuestMarker': '⭐ Missão',
    'ui.BossMarker': '💀 Chefe',
    'ui.LootMarker': '🗝️ Tesouro',
    'ui.WaypointMarker': '📍 Ponto de viagem',
    'ui.DonjonMarker': '🏰 Masmorra',
    'ui.NPCMarker': '💬 NPC',
    'ui.SaveMarkerButton': '💾 Salvar marcadores',
    'ui.ToolsTitle': 'Ferramentas',
    'ui.RoutesList': 'Lista de rotas',
    'ui.MarkerList': 'Lista de marcadores',
    'ui.Done': 'Concluído',
    'ui.AddMarkerButton': '📍 Adicionar',
    'ui.NewPathTitle': 'Novo trajeto',
    'ui.PathHelper': 'Segure a barra de espaço para mover o mapa enquanto desenha o trajeto',
    'ui.AddRouteButton': '➕ Adicionar',
    'ui.FinishPath': '✅ Finalizar',
    'ui.LockMarker': '🔒 Bloquear marcadores',
    'ui.ImportExportHelper': 'Importar/exportar só é necessário se você mudar de navegador, computador ou quiser compartilhar seus dados. Para salvar normalmente, use o botão no cabeçalho.',
    'ui.ImportButton': 'Importar salvamento',
    'ui.ExportButton': 'Exportar salvamento',
    'ui.DeleteMarkerButton': 'Excluir todos os marcadores',
    'ui.DeletePathButton': 'Excluir todos os trajetos',
    'ui.Help': 'Como usar',
    'ui.HelpTitle': 'Ajuda',
    'ui.HelpLine1': 'Selecione um mapa no menu suspenso do cabeçalho (principal ou DLC)',
    'ui.HelpLine2': 'Adicione seus marcadores 📍',
    'ui.HelpLine3': 'Seus marcadores são salvos automaticamente. Use o botão "Salvar marcadores" no cabeçalho se necessário.',
    'ui.DeleteButton': 'Excluir',

     'toast.ExportAll': 'Todos os dados foram salvos 💾',
     'toast.ShareUrlCopied': 'Link de compartilhamento copiado para a área de transferência 📋',


    'toast.MarkerNameUpdated': 'Nome do marcador atualizado 💾',
    'toast.RouteNameSaved': 'Nome da rota salvo 💾',
    'toast.PathFinished': 'Trajeto finalizado ✅',
    'toast.NoPath': 'Nenhum trajeto em andamento',
    'toast.LoadingMap': 'Carregando mapa...',
    'toast.SaveState': '● Salvo',
    'toast.UnsaveState': '● Não salvo',
    'toast.SaveMarkerAndRoute': 'Marcadores e rotas foram salvos localmente 💾',
    'toast.FullMapDataImported': 'Todos os dados importados ✅',
    'toast.PathImported': 'Trajetos importados ✅',
    'toast.MarkerImported': 'Marcadores importados ✅',
    'toast.WarnDeleteAllPath': 'Tem certeza de que deseja excluir todos os trajetos deste mapa?',
    'toast.AllPathDeleted': 'Todos os trajetos foram excluídos 🧹',
    'toast.MarkerMapCleared': 'Marcadores excluídos deste mapa 🧹',
    'toast.CantLoadData': 'Não foi possível carregar os dados do usuário:',
    'toast.CantSaveData': 'Não foi possível salvar os dados localmente:',
    'toast.PathInProgress': 'Trajeto em andamento…',
    'toast.ExportAll': 'Todos os dados foram salvos 💾',

    'toast.ShareUrlCopied': 'Link de compartilhamento copiado para a área de transferência 📋',
    'toast.SharedMerged': 'Marcadores e rotas compartilhados adicionados ao seu mapa ✅',
    'toast.SharedTargetMissing': 'Mapa original não encontrado. Pode ter sido renomeado ou excluído ❌',

    'ui.ShareRoutesButton': 'Compartilhar trajetos',
    'ui.SharedViewLabel': 'Mapa compartilhado (somente leitura)',
    'ui.SharedTargetLabel': 'Adicionar ao mapa:',
    'ui.SharedMergeButton': 'Adicionar ao meu mapa',
    'ui.MergeRoutesButton': 'Adicionar compartilhado ao meu mapa',


      'ui.PathNamePlaceholder': 'Nome do trajeto (opcional)',
      'ui.MarkerNamePlaceholder': 'Nome / anotação',
  },

  ru: {
    'ui.NewMarkerTitle': 'Новый маркер',
    'ui.GeneralMarker': '🔘 Общий',
    'ui.QuestMarker': '⭐ Задание',
    'ui.BossMarker': '💀 Босс',
    'ui.LootMarker': '🗝️ Добыча',
    'ui.WaypointMarker': '📍 Путевая точка',
    'ui.DonjonMarker': '🏰 Подземелье',
    'ui.NPCMarker': '💬 NPC',
    'ui.SaveMarkerButton': '💾 Сохранить маркеры',
    'ui.ToolsTitle': 'Инструменты',
    'ui.RoutesList': 'Список маршрутов',
    'ui.MarkerList': 'Список меток',
    'ui.Done': 'Готово',
    'ui.AddMarkerButton': '📍 Добавить',
    'ui.NewPathTitle': 'Новый путь',
    'ui.PathHelper': 'Удерживайте пробел, чтобы двигать карту во время рисования пути',
    'ui.AddRouteButton': '➕ Добавить',
    'ui.FinishPath': '✅ Завершить',
    'ui.LockMarker': '🔒 Заблокировать маркеры',
    'ui.ImportExportHelper': 'Импорт и экспорт нужны только если вы меняете браузер, компьютер или хотите поделиться данными. Для обычного сохранения используйте кнопку вверху.',
    'ui.ImportButton': 'Импортировать сохранение',
    'ui.ExportButton': 'Экспортировать сохранение',
    'ui.DeleteMarkerButton': 'Удалить все маркеры',
    'ui.DeletePathButton': 'Удалить все пути',
    'ui.Help': 'Как использовать',
    'ui.HelpTitle': 'Помощь',
    'ui.HelpLine1': 'Выберите карту из выпадающего списка вверху (основная или DLC)',
    'ui.HelpLine2': 'Добавляйте свои маркеры 📍',
    'ui.HelpLine3': 'Ваши маркеры сохраняются автоматически. При необходимости используйте кнопку "Сохранить маркеры" вверху.',
    'ui.DeleteButton': 'Удалить',

    'toast.MarkerNameUpdated': 'Имя маркера обновлено 💾',
    'toast.RouteNameSaved': 'Имя маршрута сохранено 💾',
    'toast.PathFinished': 'Путь завершён ✅',
    'toast.NoPath': 'Нет активного пути',
    'toast.LoadingMap': 'Загрузка карты...',
    'toast.SaveState': '● Сохранено',
    'toast.UnsaveState': '● Не сохранено',
    'toast.SaveMarkerAndRoute': 'Маркеры и маршруты сохранены локально 💾',
    'toast.FullMapDataImported': 'Все данные импортированы ✅',
    'toast.PathImported': 'Пути импортированы ✅',
    'toast.MarkerImported': 'Маркеры импортированы ✅',
    'toast.WarnDeleteAllPath': 'Вы действительно хотите удалить все пути с этой карты?',
    'toast.AllPathDeleted': 'Все пути удалены 🧹',
    'toast.MarkerMapCleared': 'Маркеры удалены для этой карты 🧹',
    'toast.CantLoadData': 'Не удалось загрузить данные пользователя:',
    'toast.CantSaveData': 'Не удалось сохранить данные локально:',
    'toast.PathInProgress': 'Путь в процессе…',
    'toast.ExportAll': 'Все данные сохранены 💾',

    'toast.ShareUrlCopied': 'Ссылка для обмена скопирована в буфер обмена 📋',
    'toast.SharedMerged': 'Общие маркеры и маршруты добавлены на вашу карту ✅',
    'toast.SharedTargetMissing': 'Исходная карта не найдена. Возможно, она была переименована или удалена ❌',

    'ui.ShareRoutesButton': 'Поделиться маршрутами',
    'ui.SharedViewLabel': 'Общая карта (только просмотр)',
    'ui.SharedTargetLabel': 'Добавить на карту:',
    'ui.SharedMergeButton': 'Добавить на мою карту',
    'ui.MergeRoutesButton': 'Добавить общие данные на мою карту',

    'ui.PathNamePlaceholder': 'Название пути (необязательно)',
    'ui.MarkerNamePlaceholder': 'Имя / заметка',
  },

    it: {
      'ui.NewMarkerTitle': 'Nuovo marcatore',
      'ui.GeneralMarker': '🔘 Generale',
      'ui.QuestMarker': '⭐ Missione',
      'ui.BossMarker': '💀 Boss',
      'ui.LootMarker': '🗝️ Bottino',
      'ui.WaypointMarker': '📍 Punto di viaggio',
      'ui.DonjonMarker': '🏰 Sotterraneo',
      'ui.NPCMarker': '💬 NPC',
      'ui.SaveMarkerButton': '💾 Salva marcatori',
      'ui.ToolsTitle': 'Strumenti',
      'ui.RoutesList': 'Elenco dei percorsi',
      'ui.MarkerList': 'Elenco dei marcatori',
      'ui.Done': 'Fatto',
      'ui.AddMarkerButton': '📍 Aggiungi',
      'ui.NewPathTitle': 'Nuovo percorso',
      'ui.PathHelper': 'Tieni premuta la barra spaziatrice per spostare la mappa mentre disegni il percorso',
      'ui.AddRouteButton': '➕ Aggiungi',
      'ui.FinishPath': '✅ Termina',
      'ui.LockMarker': '🔒 Blocca marcatori',
      'ui.ImportExportHelper': 'Importa/esporta solo se cambi browser, computer o per condividere i dati. Per il salvataggio normale usa il pulsante nell’intestazione.',
      'ui.ImportButton': 'Importa salvataggio',
      'ui.ExportButton': 'Esporta salvataggio',
      'ui.DeleteMarkerButton': 'Rimuovi tutti i marcatori',
      'ui.DeletePathButton': 'Elimina tutti i percorsi',
      'ui.Help': 'Come usare',
      'ui.HelpTitle': 'Guida',
      'ui.HelpLine1': 'Seleziona una mappa dal menu a discesa in alto (principale o DLC)',
      'ui.HelpLine2': 'Aggiungi i tuoi marcatori 📍',
      'ui.HelpLine3': 'I tuoi marcatori vengono salvati automaticamente. Usa il pulsante "Salva marcatori" nell’intestazione se necessario.',
      'ui.DeleteButton': 'Elimina',

      'ui.PathNamePlaceholder': 'Nome del percorso (facoltativo)',
      'ui.MarkerNamePlaceholder': 'Nome / nota',

      'toast.MarkerNameUpdated': 'Nome del marcatore aggiornato 💾',
      'toast.RouteNameSaved': 'Nome del percorso salvato 💾',
      'toast.PathFinished': 'Percorso completato ✅',
      'toast.NoPath': 'Nessun percorso attivo',
      'toast.LoadingMap': 'Caricamento mappa...',
      'toast.SaveState': '● Salvato',
      'toast.UnsaveState': '● Non salvato',
      'toast.SaveMarkerAndRoute': 'Marcatori e percorsi salvati localmente 💾',
      'toast.FullMapDataImported': 'Dati completi importati ✅',
      'toast.PathImported': 'Percorsi importati ✅',
      'toast.MarkerImported': 'Marcatori importati ✅',
      'toast.WarnDeleteAllPath': 'Vuoi davvero eliminare tutti i percorsi da questa mappa?',
      'toast.AllPathDeleted': 'Tutti i percorsi eliminati 🧹',
      'toast.MarkerMapCleared': 'Marcatori eliminati per questa mappa 🧹',
      'toast.CantLoadData': 'Impossibile caricare i dati utente:',
      'toast.CantSaveData': 'Impossibile salvare i dati localmente:',
      'toast.PathInProgress': 'Percorso in corso…',
      'toast.ExportAll': 'Tutti i dati sono stati salvati 💾',

      'toast.ShareUrlCopied': 'Link di condivisione copiato negli appunti 📋',
      'toast.SharedMerged': 'Marcatori e percorsi condivisi aggiunti alla tua mappa ✅',
      'toast.SharedTargetMissing': 'Mappa originale non trovata. Potrebbe essere stata rinominata o eliminata ❌',
      'ui.MergeRoutesButton': 'Aggiungi la condivisione alla mia mappa',

      'ui.ShareRoutesButton': 'Condividi percorsi',
      'ui.SharedViewLabel': 'Mappa condivisa (solo lettura)',
      'ui.SharedTargetLabel': 'Aggiungi alla mappa:',
      'ui.SharedMergeButton': 'Aggiungi alla mia mappa',

       'ui.PathNamePlaceholder': 'Nome del percorso (facoltativo)',
       'ui.MarkerNamePlaceholder': 'Nome / nota',
    },



  };

  function setLang(lang) {
    if (!translations[lang]) lang = 'en';
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function applyLang(lang) {
    const dict = translations[lang] || translations.en;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    // placeholders trad
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });

  }


  window.GDMMLang = { setLang, getLang, applyLang };
  document.addEventListener('DOMContentLoaded', () => applyLang(getLang()));

  document.getElementById('langSelect')?.addEventListener('change', e => {
    const lang = e.target.value;
    GDMMLang.setLang(lang);
  });

  document.getElementById('langSelect').value = GDMMLang.getLang();

    document.addEventListener('DOMContentLoaded', () => {
    const current = GDMMLang.getLang();
    GDMMLang.applyLang(current);

    const sel = document.getElementById('langSelect');
    if (sel) {
      sel.value = current;
      sel.addEventListener('change', (e) => {
        GDMMLang.setLang(e.target.value);
      });
    }
  });


  function t(key) {
    const lang = getLang();
    const dict = translations[lang] || translations.en;
    return dict[key] || key;
  }

  window.GDMMLang = { setLang, getLang, applyLang, t };


})();
