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
console.log("Current User UID:", userCredential.user.uid); 
console.log("Is Anonymous:", userCredential.user.isAnonymous);
    // Force a clean sign-in
    const uid = userCredential.user.uid;
    
    // Add a tiny delay (500ms) to ensure the server knows who you are
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');as
    const logRef = database.ref('accessLogs');
    const serverTime = firebase.database.ServerValue.TIMESTAMP;

    // B. Update the individual user visit first (to satisfy the Security Rule)
    // This will FAIL if the user visited less than 12 hours ago
    await userVisitRef.set(serverTime);

    // C. If the above passed, increment the total count
    const result = await totalRef.transaction((current) => (current || 0) + 1);

    if (result.committed) {
      // D. Log the success automatically
      logRef.push({
        timestamp: serverTime,
        device: navigator.userAgent,
        action: "increment_success",
        newCount: result.snapshot.val(),
        uid: uid
      });
    }

  } catch (error) {
    // E. Log the rejection (if someone tries to spam or bypass)
    database.ref('accessLogs').push({
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        device: navigator.userAgent,
        action: "REJECTED_OR_COOLDOWN",
        error: error.message
    });
    
    if (error.code === 'PERMISSION_DENIED') {
        console.warn("View blocked: Security rules enforced cooldown or unauthorized access.");
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

