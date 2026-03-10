const firebaseConfig = {
    apiKey: "AIzaSyDr18ZsJyhqzI0fKw6Ix3iex3FfYhPAywU",
    authDomain: "ganwaplayer.firebaseapp.com",
    databaseURL: "https://ganwaplayer-default-rtdb.firebaseio.com",
    projectId: "ganwaplayer",
    storageBucket: "ganwaplayer.firebasestorage.app",
    messagingSenderId: "28027251724",
    appId: "1:28027251724:web:792638e52fd8d842671229"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentQueue = [];
let currentIndex = -1;
let autoNextTimer;

// 1. Sync Data
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const oldVal = select.value || "ALL";
    
    let opts = '<option value="ALL">✨ All Songs</option>';
    if(data) Object.keys(data).forEach(p => { if(p !== "_init") opts += `<option value="${p}">${p}</option>`; });
    select.innerHTML = opts;
    select.value = oldVal;

    renderSongs(data, oldVal);
});

function renderSongs(data, selectedP) {
    const list = document.getElementById('songsList');
    list.innerHTML = "";
    currentQueue = [];
    if(!data) return;

    for (let p in data) {
        if (selectedP !== "ALL" && p !== selectedP) continue;
        const songs = data[p];
        for (let id in songs) {
            if (id === "_init") continue;
            currentQueue.push({ ...songs[id], pName: p, id: id });
            let idx = currentQueue.length - 1;
            list.innerHTML += `
                <div class="song-item">
                    <div class="song-info" onclick="playSong(${idx})">
                        <b>${songs[id].name}</b><br><small style="color:#1db954;">${p}</small>
                    </div>
                    <button class="del-btn" onclick="deleteSong3X('${p}','${id}','${songs[id].name}')">DELETE</button>
                </div>`;
        }
    }
}

// 2. Play with Iframe (Sunaai dega 100%)
function playSong(idx) {
    if(idx < 0 || idx >= currentQueue.length) return;
    currentIndex = idx;
    const song = currentQueue[idx];
    const playerContainer = document.getElementById('playerContainer');
    const status = document.getElementById('status');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "▶ Playing: " + song.name;
        // Wahi purana Iframe method jo kaam kar raha tha
        playerContainer.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none;" allow="autoplay"></iframe>`;

        // Clear any old timer
        if(autoNextTimer) clearTimeout(autoNextTimer);

        // AUTO-NEXT JUGAD: Reload page after 4 minutes to play next
        autoNextTimer = setTimeout(() => {
            playNext();
        }, 240000); // 4 Minutes
    }
}

function playNext() {
    let next = currentIndex + 1;
    if(next < currentQueue.length) playSong(next);
    else alert("Playlist Ended");
}

// 3. 3-Times Delete Confirmation
function deleteSong3X(playlist, songId, name) {
    if(confirm("⚠️ STEP 1: Delete '" + name + "'?")) {
        if(confirm("🛑 STEP 2: Are you sure? This will remove it from the list.")) {
            if(confirm("❗ STEP 3: FINAL CONFIRMATION! Delete forever?")) {
                db.ref(`collections/${playlist}/${songId}`).remove();
            }
        }
    }
}

// 4. Add Song
function addSong() {
    const n = document.getElementById('songName').value;
    const u = document.getElementById('songUrl').value;
    const p = document.getElementById('playlistSelect').value === "ALL" ? "Default" : document.getElementById('playlistSelect').value;
    if(n && u) {
        db.ref(`collections/${p}`).push({ name: n, url: u });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
    }
}
