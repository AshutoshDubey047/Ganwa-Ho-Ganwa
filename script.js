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

// SYNC DATA
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

            const fileId = song.url.match(/[-\w]{25,}/);
            const dl = fileId ? `https://docs.google.com/uc?export=download&id=${fileId[0]}` : "#";

            list.innerHTML += `
                <li style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:15px; margin:10px 0; border-radius:10px; border-left:5px solid #1db954;">
                    <div style="flex:1; cursor:pointer;" onclick="playSong(${idx})">
                        <b style="color:white; display:block;">${song.name}</b>
                        <small style="color:#666;">Playlist: ${pName}</small>
                    </div>
                    <div style="display:flex; gap:15px; align-items:center;">
                        <a href="${dl}" target="_blank" style="text-decoration:none; font-size:20px;">📥</a>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:none; border:none; color:#ff4444; font-size:20px; cursor:pointer;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

function playSong(index) {
    if (index < 0 || index >= currentQueue.length) return;
    currentSongIndex = index;
    const song = currentQueue[index];
    const playerBox = document.getElementById('player-box');
    const title = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        title.innerText = "▶ Playing: " + song.name;
        playerBox.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;" allow="autoplay"></iframe>`;
    } else {
        alert("Bhai, ye Google Drive link sahi nahi hai!");
    }
}

function playNextSong() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) playSong(next);
}

function deleteSong(pName, sId) {
    if (confirm("Check 1: Delete?") && confirm("Check 2: CONFIRM?")) {
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
    if (name && !protectedPlaylists.includes(name)) {
        db.ref('collections/' + name).update({ _init: true }).then(() => {
            input.value = "";
            document.getElementById('playlistSelect').value = name;
            onPlaylistChange();
        });
    }
}

function deleteFullPlaylist() {
    const name = document.getElementById('playlistSelect').value;
    if (protectedPlaylists.includes(name)) return alert("Protected!");
    if (confirm(`Delete ${name}?`) && confirm("Last Warning!")) {
        db.ref('collections/' + name).remove();
    }
}
