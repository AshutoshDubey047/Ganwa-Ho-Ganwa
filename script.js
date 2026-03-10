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

// --- DATA SYNC ---
db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value || "ALL_SONGS";
    
    let options = '<option value="ALL_SONGS">✨ All Songs</option><option value="Default">Default</option><option value="Ashutosh">Ashutosh</option><option value="Palak Dii">Palak Dii</option><option value="Laku">Laku</option>';
    if (allData) {
        Object.keys(allData).forEach(p => {
            if (!protectedPlaylists.includes(p) && p !== "_init") {
                options += `<option value="${p}">${p}</option>`;
            }
        });
    }
    select.innerHTML = options;
    select.value = currentVal;
    renderSongs(allData, currentVal);
});

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
            currentQueue.push(song);
            let idx = currentQueue.length - 1;

            list.innerHTML += `
                <div class="song-card" style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:15px; margin:10px 0; border-radius:12px; border-left:5px solid #1db954;">
                    <div style="flex:1; cursor:pointer;" onclick="playSong(${idx})">
                        <b style="color:white;">${song.name}</b><br>
                        <small style="color:#666;">Playlist: ${pName}</small>
                    </div>
                    <div style="display:flex; gap:15px; align-items:center;">
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:none; border:none; color:red; font-size:18px;">🗑️</button>
                    </div>
                </div>`;
        }
    }
}

// --- PLAYER LOGIC ---
function playSong(index) {
    if (index < 0 || index >= currentQueue.length) return;
    currentSongIndex = index;
    const song = currentQueue[index];
    const playerContainer = document.getElementById('player-frame-container');
    const titleText = document.getElementById('playing-now');

    // Extract ID
    const fileId = song.url.match(/[-\w]{25,}/);
    
    if (fileId) {
        titleText.innerText = "▶ Playing: " + song.name;
        // GOOGLE DRIVE OFFICIAL EMBED URL
        const embedUrl = `https://drive.google.com/file/d/${fileId[0]}/preview`;
        
        playerContainer.innerHTML = `
            <iframe src="${embedUrl}" width="100%" height="150" 
            style="border:2px solid #1db954; border-radius:10px; background:#000;" 
            allow="autoplay; encrypted-media" allowfullscreen></iframe>
        `;
    } else {
        alert("Invalid Link! Make sure it's a Google Drive link.");
    }
}

function playNextSong() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) playSong(next);
}

function deleteSong(pName, sId) {
    if (confirm("Delete this song?")) {
        db.ref(`collections/${pName}/${sId}`).remove();
    }
}

// MANAGEMENT
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
    const input = document.getElementById('newPlaylistInput');
    const name = input.value.trim();
    if (name) {
        db.ref('collections/' + name).update({ _init: true }).then(() => {
            input.value = "";
        });
    }
}
