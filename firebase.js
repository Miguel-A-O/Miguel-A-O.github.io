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
    const serverTime = firebase.database.ServerValue.TIMESTAMP;

    // 1. TRY to set the 12-hour record. 
    // If it's been less than 12 hours, Firebase Rules will throw an error here.
    await userVisitRef.set(serverTime);

    // 2. If we reach this line, it means Step 1 succeeded! 
    // Now (and ONLY now) we update the counter.
    const result = await totalRef.transaction((current) => (current || 0) + 1);

    if (result.committed) {
      console.log("Counted! New total:", result.snapshot.val());
    }

  } catch (error) {
    // This catches the 'permission_denied' from the 12-hour rule
    if (error.code === 'PERMISSION_DENIED' || error.message.includes("permission_denied")) {
      console.warn("View blocked: Cooldown active (12-hour rule).");
    } else {
      console.error("Critical Error:", error.message);
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

