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

// 1. Live Sync: Playlists Dropdown aur Songs List
db.ref('collections/').on('value', (snap) => {
    const select = document.getElementById('playlistSelect');
    const allData = snap.val();
    const currentView = select.value || "ALL_SONGS";
    
    // Dropdown update karein (sirf ek baar)
    let optionsHTML = '<option value="ALL_SONGS">✨ All Songs (Everything)</option>';
    optionsHTML += '<option value="Default">Default</option>';
    
    if (allData) {
        Object.keys(allData).forEach(pName => {
            if (pName !== "Default") {
                optionsHTML += `<option value="${pName}">${pName}</option>`;
            }
        });
    }
    select.innerHTML = optionsHTML;
    select.value = currentView; // User ka selection barkarar rakhein

    // Songs Render karein
    renderSongs(allData, currentView);
});

// 2. Playlist Switch hone par list refresh karein
function onPlaylistChange() {
    const select = document.getElementById('playlistSelect');
    db.ref('collections/').once('value', (snap) => {
        renderSongs(snap.val(), select.value);
    });
}

// 3. Create New Playlist
function createNewPlaylist() {
    let nameInput = document.getElementById('newPlaylistInput');
    let name = nameInput.value.trim();
    if (name) {
        db.ref('collections/' + name).update({ _init: true })
        .then(() => {
            nameInput.value = "";
            document.getElementById('playlistSelect').value = name;
        });
    }
}

// 4. Add Song (Usi playlist mein jayega jo selected hai)
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const selectedP = document.getElementById('playlistSelect').value;
    
    // Agar "All Songs" par ho toh Default mein save karo, warna selected wali mein
    let target = (selectedP === "ALL_SONGS") ? "Default" : selectedP;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url })
        .then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
            alert(`Gaana "${target}" mein add ho gaya!`);
        });
    }
}

// 5. MASTER RENDER LOGIC (Alag-Alag karne wala logic yahan hai)
function renderSongs(allData, selectedP) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    if (!allData) return;

    for (let pName in allData) {
        // FILTER: Agar specific playlist chuni hai, toh baaki folders skip karo
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;

        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            const song = songs[id];
            
            list.innerHTML += `
                <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:12px; margin:8px 0; border-radius:10px; border-left:4px solid ${pName === 'Default' ? '#1db954' : '#fb8c00'};">
                    <span>
                        <b style="color:white;">${song.name}</b><br>
                        <small style="color:#888;">Playlist: ${pName}</small>
                    </span>
                    <div>
                        <button onclick="playSong('${song.url}', '${song.name}')" style="background:#1db954; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">▶</button>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:#ff4444; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; color:white; margin-left:5px;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

function deleteSong(pName, sId) {
    if(confirm("Delete gaana?")) {
        db.ref(`collections/${pName}/${sId}`).remove();
    }
}

function playSong(url, name) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        document.getElementById('playing-now').innerText = "Playing: " + name;
        document.getElementById('drive-player-wrapper').innerHTML = 
        `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;"></iframe>`;
    }
}
