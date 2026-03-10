const firebaseConfig = {
    apiKey: "AIzaSyDr18ZsJyhqzI0fKw6Ix3iex3FfYhPAywU",
    authDomain: "ganwaplayer.firebaseapp.com",
    databaseURL: "https://ganwaplayer-default-rtdb.firebaseio.com",
    projectId: "ganwaplayer",
    storageBucket: "ganwaplayer.firebasestorage.app",
    messagingSenderId: "28027251724",
    appId: "1:28027251724:web:792638e52fd8d842671229"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

const protectedPlaylists = ["Ashutosh", "Palak Dii", "Laku", "Default", "ALL_SONGS"];
let currentQueue = []; 
let currentSongIndex = -1;

// 1. Live Sync
db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value || "ALL_SONGS";
    
    let html = '<option value="ALL_SONGS">✨ All Songs</option><option value="Default">Default</option><option value="Ashutosh">Ashutosh</option><option value="Palak Dii">Palak Dii</option><option value="Laku">Laku</option>';
    if (allData) {
        Object.keys(allData).forEach(pName => {
            if (!protectedPlaylists.includes(pName) && pName !== "_init") {
                html += `<option value="${pName}">${pName}</option>`;
            }
        });
    }
    select.innerHTML = html;
    select.value = currentVal; 
    renderSongs(allData, currentVal);
});

// 2. Render Songs with Download Button
function renderSongs(allData, selectedP) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    currentQueue = []; 
    if (!allData) return;

    for (let pName in allData) {
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;
        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            const song = songs[id];
            currentQueue.push({ name: song.name, url: song.url });
            let index = currentQueue.length - 1;

            const fileId = song.url.match(/[-\w]{25,}/);
            const dlLink = fileId ? `https://docs.google.com/uc?export=download&id=${fileId[0]}` : "#";

            list.innerHTML += `
                <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:12px; margin:8px 0; border-radius:10px; border-left:4px solid #1db954;">
                    <div style="flex:1;">
                        <b style="color:white; font-size:14px;">${song.name}</b><br>
                        <small style="color:#666;">Playlist: ${pName}</small>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="playSong(${index})" style="background:#1db954; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">▶</button>
                        <a href="${dlLink}" target="_blank" download="${song.name}.mp3" style="background:#333; text-decoration:none; padding:8px 12px; border-radius:5px; color:white; font-size:14px;">📥</a>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:red; border:none; padding:8px 12px; border-radius:5px; color:white; cursor:pointer;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

// 3. Play & Auto-Next
function playSong(index) {
    if (index < 0 || index >= currentQueue.length) return;
    currentSongIndex = index;
    const song = currentQueue[index];
    const audio = document.getElementById('mainAudio');
    const title = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        // Stream Link (Bypass Download Page)
        const streamLink = `https://docs.google.com/uc?id=${fileId[0]}&export=open`;
        title.innerText = "Playing: " + song.name;
        audio.src = streamLink;
        audio.play().catch(() => {
            // Backup link if primary fails
            audio.src = `https://docs.google.com/uc?export=download&id=${fileId[0]}`;
            audio.play();
        });
    }
}

function playNextSong() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) playSong(next);
}

// 4. Delete & Manage Functions
function deleteSong(pName, sId) {
    if (confirm("Check 1: Delete this song?") && confirm("Check 2: FINAL WARNING!")) {
        db.ref(`collections/${pName}/${sId}`).remove();
    }
}

function deleteFullPlaylist() {
    const name = document.getElementById('playlistSelect').value;
    if (protectedPlaylists.includes(name)) return alert("Reserved!");
    if (confirm(`Delete entire "${name}"?`) && confirm("Last Warning!")) {
        db.ref('collections/' + name).remove();
    }
}

function onPlaylistChange() {
    const val = document.getElementById('playlistSelect').value;
    document.getElementById('targetDisplayName').innerText = (val === "ALL_SONGS") ? "Default" : val;
    db.ref('collections/').once('value', (snap) => renderSongs(snap.val(), val));
}

function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const target = (document.getElementById('playlistSelect').value === "ALL_SONGS") ? "Default" : document.getElementById('playlistSelect').value;
    if (name && url) {
        db.ref('collections/' + target).push({ name, url }).then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
        });
    }
}

function createNewPlaylist() {
    let input = document.getElementById('newPlaylistInput');
    let name = input.value.trim();
    if (name && !protectedPlaylists.includes(name)) {
        db.ref('collections/' + name).update({ _init: true }).then(() => {
            input.value = "";
            document.getElementById('playlistSelect').value = name;
            onPlaylistChange();
        });
    }
}
