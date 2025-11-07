
(function() {
  const { currentProfile } = window.GDMMCore || {};

  function applyCategoryFilters() {
    const buttons = document.querySelectorAll('.filterToggle');
    if (!buttons.length) return;

    buttons.forEach(btn => {
      const cat = btn.getAttribute('data-cat');
      if (!cat) return;

      const className = cat.toLowerCase();
      const isOn = btn.classList.contains('is-on');
      const shouldShow = isOn;

      // Map markers
      document.querySelectorAll('.marker.' + className).forEach(el => {
        el.style.display = shouldShow ? '' : 'none';
      });

      // List items
      document.querySelectorAll('#list .listItem.' + className).forEach(el => {
        el.style.display = shouldShow ? '' : 'none';
      });
    });
  }

  // Compteur par catégorie
  function updateFilterCounts() {
    if (!currentProfile) return;
    const p = currentProfile();
    if (!p || !Array.isArray(p.markers)) return;

    // Compter les markers par catégorie (d’après m.cat)
    const counts = {};
    for (const m of p.markers) {
      const cat = m.cat || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }

    // Mettre à jour les badges sur chaque bouton
    document.querySelectorAll('.filterToggle').forEach(btn => {
      const cat = btn.getAttribute('data-cat');
      if (!cat) return;

      const count = counts[cat] || 0;

      let badge = btn.querySelector('.filterCount');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'filterCount';
        btn.appendChild(badge);
      }

      badge.textContent = count;
      // Si tu veux les cacher quand il y en a 0 :
      badge.style.display = count > 0 ? 'flex' : 'none';
		if (count > 0) {
		  badge.style.display = 'flex';
		  btn.style.display = 'inline-flex';
		} else {
		  badge.style.display = 'none';
		  btn.style.display = 'none';
		}      
    });
  }

  // Toggle visuel + re-apply filtres
  document.querySelectorAll('.filterToggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-on');
      applyCategoryFilters();
    });
  });

  // Exposer aux autres modules
  window.UiFilters = {
    applyCategoryFilters,
    updateFilterCounts,
  };

  // Premier passage au cas où des markers sont déjà là
  applyCategoryFilters();
  updateFilterCounts();

})();
