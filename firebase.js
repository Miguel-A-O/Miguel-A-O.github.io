// 1. Configuration (Keep yours as is)
const firebaseConfig = {
  apiKey: "AIzaSyAvqzXyxD5e2ZUYtw6EyWtILTEDNYM99I0",
  authDomain: "ppablo-f1705.firebaseapp.com",
  databaseURL: "https://ppablo-f1705-default-rtdb.firebaseio.com",
  projectId: "ppablo-f1705",
  storageBucket: "ppablo-f1705.firebasestorage.app",
  messagingSenderId: "672547838947",
  appId: "1:672547838947:web:65b1ece03ac52b2abbded6"
};

// 2. Initialize
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const auth = firebase.auth();

// 3. The Unified Logic
async function handleAutomaticView() {
  try {
    const userCredential = await auth.signInAnonymously();
    const uid = userCredential.user.uid;

    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');
    const logRef = database.ref('accessLogs');
    const serverTime = firebase.database.ServerValue.TIMESTAMP;

    // STEP 1: Try to update the 12-hour timestamp
    // If this fails (due to the security rule), it throws an error and stops.
    await userVisitRef.set(serverTime);

    // STEP 2: If we got here, it means the 12 hours have passed!
    const result = await totalRef.transaction((current) => (current || 0) + 1);

    if (result.committed) {
      logRef.push({
        timestamp: serverTime,
        action: "increment_success",
        uid: uid
      });
      console.log("Visit verified and counted!");
    }

  } catch (error) {
    // This catches the 'Permission Denied' from the 12-hour rule
    if (error.code === 'PERMISSION_DENIED') {
      console.log("Cooldown active: You've visited in the last 12 hours.");
    } else {
      console.error("Error:", error.message);
    }
  }
}

function listenToTotal() {
  database.ref('totalViews').on('value', (snapshot) => {
    const count = snapshot.val() || 0;
    const element = document.getElementById('view-count');
    if (element) element.textContent = count;
  });
}

// Fire it up
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

