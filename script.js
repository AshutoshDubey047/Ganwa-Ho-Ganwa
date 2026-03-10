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

let allSongsQueue = [];
let currentIndex = -1;

// 1. Fetch Data
db.ref('collections/').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const currentPlaylist = select.value || "ALL_SONGS";
    
    // Update Dropdown
    let options = '<option value="ALL_SONGS">✨ All Songs</option>';
    if (data) {
        Object.keys(data).forEach(p => {
            if (p !== "_init") options += `<option value="${p}">${p}</option>`;
        });
    }
    select.innerHTML = options;
    select.value = currentPlaylist;

    renderSongs(data, currentPlaylist);
});

// 2. Render Songs (Fixed Delete Button)
function renderSongs(data, selectedP) {
    const listDiv = document.getElementById('playlist-list');
    listDiv.innerHTML = "";
    allSongsQueue = [];

    if (!data) return;

    for (let pName in data) {
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;
        const songs = data[pName];
        
        for (let id in songs) {
            if (id === "_init") continue;
            const song = songs[id];
            allSongsQueue.push({ ...song, pName, id });
            let idx = allSongsQueue.length - 1;

            // HTML for each song row
            listDiv.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:12px; margin-bottom:8px; border-radius:8px; border-left:4px solid #1db954;">
                    <div onclick="playThis(${idx})" style="flex:1; cursor:pointer;">
                        <b style="color:#fff; font-size:14px;">${song.name}</b><br>
                        <small style="color:#666;">${pName}</small>
                    </div>
                    <button onclick="deleteThisSong('${pName}', '${id}')" style="background:#ff4444; color:white; border:none; padding:8px 12px; border-radius:5px; font-weight:bold; cursor:pointer; margin-left:10px;">DEL</button>
                </div>`;
        }
    }
}

// 3. Play Logic (Using Iframe to prevent "No Sound" error)
function playThis(idx) {
    currentIndex = idx;
    const song = allSongsQueue[idx];
    const holder = document.getElementById('iframe-holder');
    const status = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "▶ Playing: " + song.name;
        // This is the ONLY link that works 100% for Drive
        holder.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="60" style="border:none; border-radius:5px; background:#000;" allow="autoplay"></iframe>`;
    } else {
        alert("Invalid Drive Link!");
    }
}

function playNextSong() {
    let next = currentIndex + 1;
    if (next < allSongsQueue.length) playThis(next);
}

// 4. Delete Logic
function deleteThisSong(playlist, songId) {
    if (confirm("Pakka delete karu?")) {
        db.ref(`collections/${playlist}/${songId}`).remove();
    }
}

// 5. Add Song Logic
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const playlist = document.getElementById('playlistSelect').value === "ALL_SONGS" ? "Default" : document.getElementById('playlistSelect').value;

    if (name && url) {
        db.ref(`collections/${playlist}`).push({ name, url }).then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
        });
    }
}

function onPlaylistChange() {
    db.ref('collections/').once('value', (s) => renderSongs(s.val(), document.getElementById('playlistSelect').value));
}
