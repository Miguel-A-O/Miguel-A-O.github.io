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
    // Sign in anonymously (Automatic & Hidden)
    const userCredential = await firebase.auth().signInAnonymously();
    const uid = userCredential.user.uid;
    
    const userVisitRef = database.ref('user_visits/' + uid);
    const totalRef = database.ref('totalViews');
    const serverTime = firebase.database.ServerValue.TIMESTAMP;

    // STEP 1: Try to update the user's personal timestamp
    // This will FAIL if the 12-hour rule in your console isn't met
    await userVisitRef.set(serverTime);

    // STEP 2: If Step 1 succeeded, increment the global total
    await totalRef.transaction((current) => {
      return (current || 0) + 1;
    });

    console.log("View counted successfully!");
  } catch (error) {
    // This triggers if the user already visited in the last 12 hours
    console.log("Visit not counted: 12-hour limit or permission denied.");
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