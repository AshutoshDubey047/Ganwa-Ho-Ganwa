const firebaseConfig = {
  apiKey: "AIzaSyDr18ZsJyhqzI0fKw6Ix3iex3FfYhPAywU",
  authDomain: "ganwaplayer.firebaseapp.com",
  databaseURL: "https://ganwaplayer-default-rtdb.firebaseio.com",
  projectId: "ganwaplayer",
  storageBucket: "ganwaplayer.firebasestorage.app",
  messagingSenderId: "28027251724",
  appId: "1:28027251724:web:792638e52fd8d842671229"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- 1. LOGIN / LOGOUT LOGIC ---
function googleLogin() {
    auth.signInWithPopup(provider).catch(alert);
}

function googleLogout() {
    auth.signOut();
}

// User State Check (Auto-run)
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('upload-card').style.display = 'block';
        document.getElementById('userName').innerText = user.displayName;
    } else {
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('upload-card').style.display = 'none';
    }
});

// --- 2. DATABASE LOGIC ---
function addSong() {
    const user = auth.currentUser;
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;

    if (user && name && url) {
        db.ref('smart_playlist/').push({
            name: name,
            url: url,
            userId: user.uid,
            userName: user.displayName
        });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
    }
}

function deleteSong(id, ownerId) {
    const user = auth.currentUser;
    if (user && user.uid === ownerId) {
        if (confirm("Delete this song?")) db.ref('smart_playlist/' + id).remove();
    } else {
        alert("Bhai, sirf wahi delete kar sakta hai jisne upload kiya ho!");
    }
}

// --- 3. UI & PLAY LOGIC ---
db.ref('smart_playlist/').on('value', (snap) => {
    const data = snap.val();
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    for (let id in data) {
        const song = data[id];
        list.innerHTML += `
            <li class="song-item" style="display:flex; justify-content:space-between; background:#181818; padding:10px; margin:5px; border-radius:8px;">
                <span><b>${song.name}</b><br><small>By: ${song.userName}</small></span>
                <div>
                    <button onclick="playNow('${song.url}', '${song.name}')">▶</button>
                    ${auth.currentUser && auth.currentUser.uid === song.userId ? `<button onclick="deleteSong('${id}', '${song.userId}')" style="background:red;">🗑️</button>` : ''}
                </div>
            </li>`;
    }
});

function playNow(rawUrl, name) {
    const player = document.getElementById('main-player');
    const title = document.getElementById('playing-now');
    const match = rawUrl.match(/[-\w]{25,}/);
    
    if (match) {
        const fileId = match[0];
        // Direct stream URL
        player.src = `https://docs.google.com/uc?export=download&id=${fileId}`;
        player.play().then(() => {
            title.innerText = "Playing: " + name;
        }).catch(() => {
            // Backup link
            player.src = `https://drive.google.com/uc?id=${fileId}`;
            player.play().catch(() => alert("Google block! Make sure file is public."));
        });
    }
}
