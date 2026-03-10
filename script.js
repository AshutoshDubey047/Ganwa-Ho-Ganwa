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
let currentSongIndex = -1;
const protectedPlaylists = ["Ashutosh", "Palak Dii", "Laku", "Default", "ALL_SONGS"];

// 1. Sync Playlists & Songs
db.ref('collections/').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const activeVal = select.value || "ALL_SONGS";
    
    let options = '<option value="ALL_SONGS">✨ All Songs</option>';
    if (data) {
        Object.keys(data).forEach(p => {
            if (!protectedPlaylists.includes(p) && p !== "_init") {
                options += `<option value="${p}">${p}</option>`;
            }
        });
    }
    select.innerHTML = options;
    select.value = activeVal;
    renderSongs(data, activeVal);
});

function renderSongs(data, selected) {
    const container = document.getElementById('playlist-container');
    container.innerHTML = "";
    currentQueue = [];
    if (!data) return;

    for (let pName in data) {
        if (selected !== "ALL_SONGS" && pName !== selected) continue;
        const songs = data[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            currentQueue.push({ ...songs[id], pName, id });
            let idx = currentQueue.length - 1;
            
            container.innerHTML += `
                <div style="background:#181818; padding:15px; margin-bottom:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid #1db954;">
                    <div onclick="playSong(${idx})" style="cursor:pointer; flex:1;">
                        <b style="color:#fff;">${songs[id].name}</b><br>
                        <small style="color:#666;">${pName}</small>
                    </div>
                    <button onclick="deleteSong('${pName}', '${id}')" style="background:none; border:none; color:#ff4444; font-size:18px; cursor:pointer; padding:5px;">🗑️</button>
                </div>`;
        }
    }
}

// 2. Play & Autoplay Logic
const audio = document.getElementById('mainAudio');

function playSong(idx) {
    if (idx < 0 || idx >= currentQueue.length) return;
    currentSongIndex = idx;
    const song = currentQueue[idx];
    const status = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "⏳ Loading: " + song.name;
        // Method: Direct Stream Bypass
        const directUrl = `https://docs.google.com/uc?export=open&id=${fileId[0]}`;
        
        audio.src = directUrl;
        audio.play().then(() => {
            status.innerText = "▶ Playing: " + song.name;
        }).catch(() => {
            status.innerText = "❌ Click Play to Start";
        });
    }
}

// Auto-Next Logic
audio.onended = () => {
    playNextSong();
};

function playNextSong() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) playSong(next);
}

// 3. Management
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const target = document.getElementById('playlistSelect').value;
    const pName = (target === "ALL_SONGS") ? "Default" : target;

    if (name && url) {
        db.ref(`collections/${pName}`).push({ name, url }).then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
        });
    }
}

function deleteSong(p, id) {
    if (confirm("Delete this song?")) db.ref(`collections/${p}/${id}`).remove();
}

function onPlaylistChange() {
    db.ref('collections/').once('value', (s) => renderSongs(s.val(), document.getElementById('playlistSelect').value));
}
