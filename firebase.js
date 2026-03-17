// 1. Initialize Firebase (Use your existing config)
const firebaseConfig = {
  databaseURL: "https://ppablo-f1705-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

// 2. The Main Function
async function handleAutomaticView() {
  try {
    // 1. Ensure Auth is actually ready
    if (!firebase.auth) {
        console.error("Auth library missing from HTML!");
        return;
    }

    const userCredential = await firebase.auth().signInAnonymously();
    const uid = userCredential.user.uid;
    
    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');
    
    // Use the official Firebase server timestamp constant
    const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;

    // 2. Try to update the personal check-in
    await userVisitRef.set(serverTimestamp);
    console.log("Check-in successful for UID:", uid);

    // 3. Increment the global counter
    await totalRef.transaction((current) => {
        return (current || 0) + 1;
    });

    console.log("View counted successfully!");

  } catch (error) {
    // If it's a permission error, it's likely the 12-hour rule working correctly
    if (error.code === 'PERMISSION_DENIED') {
        console.warn("Visit blocked: 12-hour limit active for this user.");
    } else {
        // If it's something else (network, auth config), we need to know!
        console.error("Firebase Error:", error.code, error.message);
    }
  }
}
// 3. Listen for the total to show it on screen
function listenToTotal() {
  database.ref('totalViews').on('value', (snapshot) => {
    const count = snapshot.val() || 0;
    const element = document.getElementById('view-count');
    if (element) element.textContent = count;
  });
}

// Start everything on load
window.addEventListener('load', () => {
  handleAutomaticView();
  listenToTotal();

  const toggleButton = document.querySelector('[data-sidebar-toggle]');
  const scrim = document.querySelector('[data-scrim]');
  const body = document.body;

  const setSidebarOpen = (open) => {
    body.dataset.sidebarOpen = open ? 'true' : 'false';
    if (toggleButton) toggleButton.setAttribute('aria-expanded', String(open));
  };

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const isOpen = body.dataset.sidebarOpen === 'true';
      setSidebarOpen(!isOpen);
    });
  }

  if (scrim) {
    scrim.addEventListener('click', () => setSidebarOpen(false));
  }

  document.querySelectorAll('.side-nav a').forEach((link) => {
    link.addEventListener('click', () => setSidebarOpen(false));
  });
});