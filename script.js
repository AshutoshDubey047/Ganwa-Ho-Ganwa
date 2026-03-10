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
const audio = document.getElementById('mainAudio');

let currentQueue = [];
let currentIndex = -1;

// 1. Load Data
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
                        <b>${songs[id].name}</b><br>
                        <small>${p}</small>
                    </div>
                    <button class="del-btn" onclick="deleteSong3X('${p}','${id}','${songs[id].name}')">DELETE</button>
                </div>`;
        }
    }
}

// 2. Play & Auto-Next
function playSong(idx) {
    if(idx < 0 || idx >= currentQueue.length) return;
    currentIndex = idx;
    const song = currentQueue[idx];
    const fileId = song.url.match(/[-\w]{25,}/);

    if (fileId) {
        document.getElementById('status').innerText = "▶ Playing: " + song.name;
        audio.src = `https://docs.google.com/uc?export=download&id=${fileId[0]}`;
        audio.play().catch(e => console.log("Play error: Click needed"));
    }
}

function playNext() {
    let next = currentIndex + 1;
    if(next < currentQueue.length) playSong(next);
}

// 3. Triple Delete Confirmation
function deleteSong3X(playlist, songId, name) {
    // Stage 1
    const c1 = confirm("⚠️ STEP 1: Are you sure you want to delete '" + name + "'?");
    if(c1) {
        // Stage 2
        const c2 = confirm("🛑 STEP 2: Really? This will remove the song from the list.");
        if(c2) {
            // Stage 3
            const c3 = confirm("❗ STEP 3: FINAL WARNING! This cannot be undone. Delete forever?");
            if(c3) {
                db.ref(`collections/${playlist}/${songId}`).remove()
                .then(() => alert("Song Deleted Successfully!"))
                .catch(e => alert("Error: " + e.message));
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
