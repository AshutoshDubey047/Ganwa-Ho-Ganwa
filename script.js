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

// Inhe koi delete nahi kar sakta
const protectedPlaylists = ["Ashutosh", "Palak Dii", "Laku", "Default", "ALL_SONGS"];

// 1. Live Sync - Dropdown & Data
db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value || "ALL_SONGS";
    
    // Sirf 4 main aur banayi hui playlists dikhayega
    let optionsHTML = `
        <option value="ALL_SONGS">✨ All Songs (Everything)</option>
        <option value="Default">Default</option>
        <option value="Ashutosh">Ashutosh</option>
        <option value="Palak Dii">Palak Dii</option>
        <option value="Laku">Laku</option>
    `;
    
    if (allData) {
        Object.keys(allData).forEach(pName => {
            if (!protectedPlaylists.includes(pName)) {
                optionsHTML += `<option value="${pName}">${pName}</option>`;
            }
        });
    }
    
    select.innerHTML = optionsHTML;
    select.value = currentVal; 
    renderSongs(allData, currentVal);
});

// 2. Render Songs Filtered
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
                    <span><b style="color:white;">${song.name}</b><br><small style="color:#666;">Folder: ${pName}</small></span>
                    <div>
                        <button onclick="playSong('${song.url}', '${song.name}')" style="background:#1db954; border:none; border-radius:5px; padding:5px 10px; cursor:pointer;">▶</button>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:red; border:none; border-radius:5px; padding:5px 10px; color:white; margin-left:5px; cursor:pointer;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

// 3. UI Actions
function onPlaylistChange() {
    const val = document.getElementById('playlistSelect').value;
    document.getElementById('targetDisplayName').innerText = (val === "ALL_SONGS") ? "Default" : val;
    db.ref('collections/').once('value', (snap) => renderSongs(snap.val(), val));
}

function createNewPlaylist() {
    let input = document.getElementById('newPlaylistInput');
    let name = input.value.trim();
    if (name && !protectedPlaylists.includes(name)) {
        db.ref('collections/' + name).set({ _init: true }).then(() => {
            alert(`Playlist "${name}" created!`);
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

// DELETE PLAYLIST (The Fix)
function deleteFullPlaylist() {
    const select = document.getElementById('playlistSelect');
    const name = select.value;

    if (protectedPlaylists.includes(name)) {
        alert("Bhai, ye playlist delete nahi ho sakti. Ye protected hai!");
        return;
    }

    if (confirm(`Check 1: Kya sach mein puri "${name}" playlist udani hai?`)) {
        if (confirm(`Final Check: Saare gaane gayab ho jayenge! Pakka na?`)) {
            db.ref('collections/' + name).remove().then(() => {
                alert("Playlist Deleted!");
                select.value = "ALL_SONGS";
                onPlaylistChange();
            }).catch(e => alert("Error: " + e.message));
        }
    }
}

function deleteSong(pName, sId) {
    if(confirm("Delete gaana?")) db.ref(`collections/${pName}/${sId}`).remove();
}

function playSong(url, name) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        document.getElementById('playing-now').innerText = "Playing: " + name;
        document.getElementById('drive-player-wrapper').innerHTML = 
        `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;" allow="autoplay"></iframe>`;
    }
}
