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

// 1. Firebase se data lana (Real-time)
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const oldVal = select.value || "ALL";
    
    // Playlists dropdown bharo
    let opts = '<option value="ALL">✨ All Playlists</option>';
    if(data) {
        Object.keys(data).forEach(p => { if(p !== "_init") opts += `<option value="${p}">${p}</option>`; });
    }
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
                        <b>${songs[id].name}</b><br><small style="color:#888;">${p}</small>
                    </div>
                    <button class="del-btn" onclick="deleteSong3X('${p}','${id}','${songs[id].name}')">DEL</button>
                </div>`;
        }
    }
}

// 2. Playback Logic (Iframe Bypass)
function playSong(idx) {
    if(idx < 0 || idx >= currentQueue.length) return;
    currentIndex = idx;
    const song = currentQueue[idx];
    const fileId = song.url.match(/[-\w]{25,}/); // Link se ID nikalna

    if (fileId) {
        document.getElementById('status').innerText = "▶ Playing: " + song.name;
        // Iframe is the most stable way for Google Drive
        document.getElementById('playerContainer').innerHTML = 
            `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none;" allow="autoplay"></iframe>`;
    } else {
        alert("Invalid Google Drive Link!");
    }
}

function playNext() {
    let next = currentIndex + 1;
    if(next < currentQueue.length) playSong(next);
}

// 3. 3-Times Delete (Ziddi Confirmation)
function deleteSong3X(playlist, songId, name) {
    if(confirm("⚠️ PEHLA STEP: Kya sach mein '" + name + "' delete karna hai?")) {
        if(confirm("🛑 DUSRA STEP: Soch lo, ye list se hat jayega!")) {
            if(confirm("❗ TEESRA STEP: Pakka na? Delete kar doon?")) {
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
