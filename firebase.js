   // Inicializar Firebase
    const firebaseConfig = {
      databaseURL: "https://ppablo-f1705-default-rtdb.firebaseio.com"
    };

    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Función para actualizar el contador global
    function updateViewCount() {
      // Verificar si ya se contó una vista en esta sesión
      if (sessionStorage.getItem('viewCounted')) {
        return; // Ya se contó, no contar de nuevo
      }

      const counterRef = database.ref('totalViews');

      counterRef.transaction(function(current_value) {
        return (current_value || 0) + 1;
      }).then(function(result) {
        if (result.committed) {
          // Marcar que ya se contó esta sesión
          sessionStorage.setItem('viewCounted', 'true');
          document.getElementById('view-count').textContent = result.snapshot.val();
        }
      });
    }

    // Escuchar cambios en tiempo real
    function listenToViewCount() {
      const counterRef = database.ref('totalViews');

      counterRef.on('value', function(snapshot) {
        const count = snapshot.val() || 0;
        document.getElementById('view-count').textContent = count;
      });
    }

    // Actualizar al cargar la página
    window.addEventListener('load', function() {
      updateViewCount();
      listenToViewCount();
    });

    const toggleButton = document.querySelector("[data-sidebar-toggle]");
    const scrim = document.querySelector("[data-scrim]");
    const body = document.body;

    const setSidebarOpen = (open) => {
      body.dataset.sidebarOpen = open ? "true" : "false";
      toggleButton.setAttribute("aria-expanded", String(open));
    };

    toggleButton.addEventListener("click", () => {
      const isOpen = body.dataset.sidebarOpen === "true";
      setSidebarOpen(!isOpen);
    });

    scrim.addEventListener("click", () => setSidebarOpen(false));

    document.querySelectorAll(".side-nav a").forEach((link) => {
      link.addEventListener("click", () => setSidebarOpen(false));
    });