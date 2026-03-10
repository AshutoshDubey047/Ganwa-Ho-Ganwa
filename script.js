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

// 1. Live Sync & Initial Load
db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value || "ALL_SONGS";
    
    // Dropdown rebuilding only when necessary
    let html = '<option value="ALL_SONGS">✨ All Songs</option>';
    html += '<option value="Default">Default</option>';
    html += '<option value="Ashutosh">Ashutosh</option>';
    html += '<option value="Palak Dii">Palak Dii</option>';
    html += '<option value="Laku">Laku</option>';
    
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

// 2. Render Songs with Filter
function renderSongs(allData, selectedP) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    if (!allData) return;

    for (let pName in allData) {
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;
        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            const song = songs[id];
            list.innerHTML += `
                <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:12px; margin:8px 0; border-radius:10px; border-left:4px solid #1db954;">
                    <span><b>${song.name}</b><br><small style="color:#666;">Playlist: ${pName}</small></span>
                    <div>
                        <button onclick="playSong('${song.url}', '${song.name}')">▶</button>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:red; margin-left:5px;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

// 3. Global Functions
function onPlaylistChange() {
    const val = document.getElementById('playlistSelect').value;
    document.getElementById('targetDisplayName').innerText = (val === "ALL_SONGS") ? "Default" : val;
    db.ref('collections/').once('value', (snap) => renderSongs(snap.val(), val));
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

function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const selectedP = document.getElementById('playlistSelect').value;
    let target = (selectedP === "ALL_SONGS") ? "Default" : selectedP;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url }).then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
        });
    }
}

function deleteFullPlaylist() {
    const name = document.getElementById('playlistSelect').value;
    if (protectedPlaylists.includes(name)) return alert("Reserved playlist cannot be deleted!");
    
    if (confirm(`Double Check: Delete "${name}"?`) && confirm(`Final Warning: Delete ALL songs in "${name}"?`)) {
        db.ref('collections/' + name).remove().then(() => {
            document.getElementById('playlistSelect').value = "ALL_SONGS";
            onPlaylistChange();
        });
    }
}

function deleteSong(pName, sId) {
    if(confirm("Delete?")) db.ref(`collections/${pName}/${sId}`).remove();
}

function playSong(url, name) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        document.getElementById('playing-now').innerText = "Playing: " + name;
        document.getElementById('drive-player-wrapper').innerHTML = `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;"></iframe>`;
    }
}
