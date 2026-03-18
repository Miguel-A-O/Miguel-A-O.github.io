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
    const serverTime = firebase.database.ServerValue.TIMESTAMP;

    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');
    const logRef = database.ref('accessLogs');

    // --- STEP 0: LOG EVERYTHING (New Position) ---
    // This runs BEFORE the security check, so it always works.
    logRef.push({
      timestamp: serverTime,
      uid: uid,
      action: "page_attempt",
      device: navigator.userAgent
    });

    // --- STEP 1: THE LOCK ---
    // If < 12 hours, this fails and jumps to 'catch'
    await userVisitRef.set(serverTime); 

    // --- STEP 2: THE COUNTER ---
    // Runs only if Step 1 succeeded
    const result = await totalRef.transaction((current) => (current || 0) + 1);

    if (result.committed) {
      console.log("Verified visit! New total:", result.snapshot.val());
      // Log successful increment separately if you want
      logRef.push({ timestamp: serverTime, uid: uid, action: "increment_success" });
    }

  } catch (error) {
    if (error.message.includes("permission_denied") || error.code === "PERMISSION_DENIED") {
      console.warn("COOLDOWN ACTIVE: Counter not incremented.");
    } else {
      console.error("System Error:", error.message);
    }
  }
}
function listenToTotal() {
  const element = document.getElementById('view-count');
  
  // Show a loading state so it doesn't just stay '-'
  if (element) element.textContent = "..."; 

  database.ref('totalViews').on('value', (snapshot) => {
    const count = snapshot.val();
    
    if (element) {
      // Only update if the value actually exists
      element.textContent = (count !== null) ? count : "0";
    }
  }, (error) => {
    console.error("Read failed:", error.message);
    if (element) element.textContent = "Error";
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

