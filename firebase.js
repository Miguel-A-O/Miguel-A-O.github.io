// 1. Configuration 
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

// 3. The Logic 
async function handleAutomaticView() {
  try {
    const userCredential = await firebase.auth().signInAnonymously();
    const uid = userCredential.user.uid;
    console.log("Authenticated as:", uid);

    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');
    const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;

    await userVisitRef.set(serverTimestamp);
    await totalRef.transaction((current) => (current || 0) + 1);
    
    console.log("View recorded!");
  } catch (error) {
    if (error.code === 'PERMISSION_DENIED') {
        console.warn("View not counted: You've already visited in the last 12 hours.");
    } else {
        console.error("Auth/Database Error:", error.code, error.message);
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