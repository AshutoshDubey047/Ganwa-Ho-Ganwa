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

// 1. Load Everything
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const activeP = select.value || "ALL_SONGS";
    
    // Update Dropdown
    let options = '<option value="ALL_SONGS">✨ All Songs</option>';
    if (data) {
        Object.keys(data).forEach(p => {
            if (p !== "_init") options += `<option value="${p}">${p}</option>`;
        });
    }
    select.innerHTML = options;
    select.value = activeP;

    renderSongs(data, activeP);
});

function renderSongs(data, selected) {
    const container = document.getElementById('song-list-container');
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
                <div style="display:flex; justify-content:space-between; align-items:center; background:#121212; padding:15px; margin-bottom:10px; border-radius:10px; border:1px solid #282828; transition:0.3s;" onmouseover="this.style.background='#181818'" onmouseout="this.style.background='#121212'">
                    <div onclick="playSong(${idx})" style="flex:1; cursor:pointer;">
                        <b style="color:#fff; font-size:15px;">${songs[id].name}</b><br>
                        <small style="color:#1db954;">${pName}</small>
                    </div>
                    <button onclick="deleteSong('${pName}', '${id}')" style="background:none; border:none; color:#ff4444; font-size:18px; cursor:pointer; padding:5px;">🗑️</button>
                </div>`;
        }
    }
}

// 2. Player Logic
function playSong(idx) {
    if (idx < 0 || idx >= currentQueue.length) return;
    currentSongIndex = idx;
    const song = currentQueue[idx];
    const wrapper = document.getElementById('player-frame-wrapper');
    const status = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "▶ " + song.name;
        // Iframe method is the ONLY one that bypasses Google block
        wrapper.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none; background:#000;" allow="autoplay"></iframe>`;
    }
}

function playNextSong() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) playSong(next);
    else alert("Playlist Ended!");
}

// 3. Admin Tools
function addSong() {
    const n = document.getElementById('songName').value;
    const u = document.getElementById('songUrl').value;
    const p = document.getElementById('playlistSelect').value;
    const target = (p === "ALL_SONGS") ? "Default" : p;

    if (n && u) {
        db.ref(`collections/${target}`).push({ name: n, url: u }).then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
        });
    }
}

function deleteSong(p, id) {
    if (confirm("Delete this song?")) db.ref(`collections/${p}/${id}`).remove();
}

function onPlaylistChange() {
    db.ref('collections').once('value', (s) => renderSongs(s.val(), document.getElementById('playlistSelect').value));
}
