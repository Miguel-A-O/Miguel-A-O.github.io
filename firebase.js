// 1. Configuration
const firebaseConfig = {
  apiKey: "##",
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

// 3. The Logic (Defined BEFORE it is called)
async function handleAutomaticView() {
  try {
    const userCredential = await auth.signInAnonymously();
    const uid = userCredential.user.uid;
    const serverTime = firebase.database.ServerValue.TIMESTAMP;

    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');
    const logRef = database.ref('accessLogs');

    // --- STEP 0: LOG ATTEMPT ---
    // This will work even if the counter is blocked
    await logRef.push({
      timestamp: serverTime,
      uid: uid,
      action: "page_load",
      device: navigator.userAgent
    });

    // --- STEP 1: THE LOCK ---
    // If < 12 hours, this jumps to 'catch'
    await userVisitRef.set(serverTime); 

    // --- STEP 2: THE COUNTER ---
    const result = await totalRef.transaction((current) => (current || 0) + 1);

    if (result.committed) {
      console.log("Counter updated to:", result.snapshot.val());
    }

  } catch (error) {
    if (error.message.includes("permission_denied")) {
      console.warn("View blocked: Security rules enforced cooldown.");
    } else {
      console.error("Firebase Error:", error.message);
    }
  }
}

function listenToTotal() {
  const element = document.getElementById('view-count');
  database.ref('totalViews').on('value', (snapshot) => {
    const count = snapshot.val() || 0;
    if (element) element.textContent = count;
  });
}

// 4. Fire it up
window.addEventListener('load', () => {
  handleAutomaticView();
  listenToTotal();

  // Sidebar logic
  const toggleButton = document.querySelector('[data-sidebar-toggle]');
  const body = document.body;
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      body.dataset.sidebarOpen = body.dataset.sidebarOpen === 'true' ? 'false' : 'true';
    });
  }
});