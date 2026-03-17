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
    // 1. Ensure Auth is active
    const userCredential = await auth.signInAnonymously();
    const uid = userCredential.user.uid;

    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');
    const logRef = database.ref('accessLogs');
    const serverTime = firebase.database.ServerValue.TIMESTAMP;

    // 2. Log the visit attempt first (Information gathering)
    logRef.push({
      timestamp: serverTime,
      device: navigator.userAgent,
      action: "page_load_attempt",
      uid: uid
    });

    // 3. Update User Visit (Silent - if it fails, we don't stop)
    userVisitRef.set(serverTime).catch(e => console.log("Visit record skipped"));

    // 4. THE COUNTER: This is the main event
    const result = await totalRef.transaction((current) => {
      return (current || 0) + 1;
    });

    if (result.committed) {
      console.log("Counter updated to:", result.snapshot.val());
    }

  } catch (error) {
    console.error("Critical Error:", error.message);
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

