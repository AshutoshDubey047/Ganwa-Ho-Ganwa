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

// 1. Live Update List
db.ref('collections/').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const activeVal = select.value || "ALL_SONGS";
    
    let options = '<option value="ALL_SONGS">✨ All Songs</option>';
    if (data) {
        Object.keys(data).forEach(p => {
            if (!protectedPlaylists.includes(p) && p !== "_init") options += `<option value="${p}">${p}</option>`;
        });
    }
    select.innerHTML = options;
    select.value = activeVal;
    renderSongs(data, activeVal);
});

function renderSongs(data, selected) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    currentQueue = [];
    if (!data) return;

    for (let pName in data) {
        if (selected !== "ALL_SONGS" && pName !== selected) continue;
        const songs = data[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            currentQueue.push({ ...songs[id], pName, id });
            let idx = currentQueue.length - 1;
            list.innerHTML += `
                <div style="background:#181818; padding:15px; margin-bottom:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid #1db954;">
                    <div onclick="playSong(${idx})" style="cursor:pointer; flex:1;">
                        <b>${songs[id].name}</b><br><small style="color:#888;">${pName}</small>
                    </div>
                    <button onclick="deleteSong('${pName}', '${id}')" style="background:none; border:none; color:red; font-size:20px; cursor:pointer;">🗑️</button>
                </div>`;
        }
    }
}

// 2. Play & Auto-Next Logic
function playSong(idx) {
    if (idx < 0 || idx >= currentQueue.length) return;
    currentSongIndex = idx;
    const song = currentQueue[idx];
    const audio = document.getElementById('mainAudio');
    const status = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "▶ Playing: " + song.name;
        // The most reliable bypass link for 2026
        const streamUrl = `https://docs.google.com/uc?export=download&id=${fileId[0]}`;
        audio.src = streamUrl;
        audio.load();
        audio.play().catch(e => {
            status.innerText = "❌ Playback Blocked. Please click play button.";
        });
    }
}

function playNextSong() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) playSong(next);
    else document.getElementById('playing-now').innerText = "Playlist Ended";
}

function handleAudioError() {
    document.getElementById('playing-now').innerText = "❌ Error: Google Drive Blocked this song.";
}

// 3. Management
function deleteSong(p, id) {
    if (confirm("Delete this song?")) db.ref(`collections/${p}/${id}`).remove();
}

function addSong() {
    const n = document.getElementById('songName').value;
    const u = document.getElementById('songUrl').value;
    const p = document.getElementById('playlistSelect').value === "ALL_SONGS" ? "Default" : document.getElementById('playlistSelect').value;
    if (n && u) {
        db.ref(`collections/${p}`).push({ name: n, url: u });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
    }
}

function deleteFullPlaylist() {
    const p = document.getElementById('playlistSelect').value;
    if (protectedPlaylists.includes(p)) return alert("Reserved!");
    if (confirm(`Delete ${p}?`)) db.ref(`collections/${p}`).remove();
}

function onPlaylistChange() {
    db.ref('collections/').once('value', (s) => renderSongs(s.val(), document.getElementById('playlistSelect').value));
}
