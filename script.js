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

// 1. DATA SYNC
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const oldVal = select.value || "ALL";
    
    let opts = '<option value="ALL">✨ All Playlists</option>';
    if(data) Object.keys(data).forEach(p => { if(p !== "_init") opts += `<option value="${p}">${p}</option>`; });
    select.innerHTML = opts;
    select.value = oldVal;

    loadSongs();
});

function loadSongs() {
    const pSel = document.getElementById('playlistSelect').value;
    const list = document.getElementById('songsList');
    list.innerHTML = "";
    currentQueue = [];

    db.ref('collections').once('value', (snap) => {
        const data = snap.val();
        for (let p in data) {
            if (pSel !== "ALL" && p !== pSel) continue;
            for (let id in data[p]) {
                if (id === "_init") continue;
                currentQueue.push({ ...data[p][id], pName: p, id: id });
                let idx = currentQueue.length - 1;
                list.innerHTML += `
                    <div class="song-item">
                        <div class="song-info" onclick="playSong(${idx})">
                            <b>${data[p][id].name}</b><br><small style="color:#888;">${p}</small>
                        </div>
                        <button class="del-btn" onclick="deleteSong3X('${p}','${id}','${data[p][id].name}')">DEL</button>
                    </div>`;
            }
        }
    });
}

// 2. PLAY WITH IFRAME (Garantied Audio)
function playSong(idx) {
    if(idx < 0 || idx >= currentQueue.length) return;
    currentIndex = idx;
    const song = currentQueue[idx];
    const fileId = song.url.match(/[-\w]{25,}/);

    if (fileId) {
        document.getElementById('status').innerText = "▶ Playing: " + song.name;
        // IFRAME METHOD: This is what makes the sound work!
        document.getElementById('playerContainer').innerHTML = 
            `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none;" allow="autoplay"></iframe>`;
    }
}

function playNext() {
    let next = currentIndex + 1;
    if(next < currentQueue.length) playSong(next);
}

// 3. 3-TIMES DELETE CONFIRMATION
function deleteSong3X(playlist, songId, songName) {
    if(confirm("⚠️ STEP 1: Delete '" + songName + "'?")) {
        if(confirm("🛑 STEP 2: REALLY Sure? This removes it from Firebase.")) {
            if(confirm("❗ STEP 3: LAST WARNING! Delete forever?")) {
                db.ref(`collections/${playlist}/${songId}`).remove();
            }
        }
    }
}

// 4. ADD SONG
function addSong() {
    const n = document.getElementById('songName').value;
    const u = document.getElementById('songUrl').value;
    const p = document.getElementById('playlistSelect').value === "ALL" ? "Default" : document.getElementById('playlistSelect').value;
    if(n && u) db.ref(`collections/${p}`).push({ name: n, url: u });
}
