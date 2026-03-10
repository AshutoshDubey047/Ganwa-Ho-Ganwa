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

// 1. AUTO-LOAD PLAYLIST NAMES IN DROPDOWN
db.ref('collections/').on('value', (snap) => {
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value;
    const data = snap.val();
    
    // Clear dropdown but keep "All Songs"
    select.innerHTML = '<option value="ALL_SONGS">✨ All Songs (Everything)</option>';
    
    if (data) {
        Object.keys(data).forEach(pName => {
            const option = document.createElement('option');
            option.value = pName;
            option.text = pName;
            select.add(option);
        });
    }
    select.value = currentVal; // Wapas wahi select rakho jo pehle tha
});

// 2. CREATE NEW PLAYLIST (Permanent in Firebase)
function createNewPlaylist() {
    let name = document.getElementById('newPlaylistInput').value.trim();
    if (name) {
        // Firebase mein ek placeholder daalna padta hai taki folder ban jaye
        db.ref('collections/' + name).update({ _created: true });
        document.getElementById('newPlaylistInput').value = "";
        alert("Playlist '" + name + "' Created!");
    }
}

// 3. ADD SONG
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const selectedP = document.getElementById('playlistSelect').value;
    
    // Agar "All Songs" par ho toh Default mein dalo, warna selected playlist mein
    let target = (selectedP === "ALL_SONGS") ? "Default" : selectedP;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
        alert("Song added to " + target);
    }
}

// 4. LOAD SONGS (Filtered or All)
function loadSongs() {
    const selectedP = document.getElementById('playlistSelect').value;
    document.getElementById('targetDisplayName').innerText = (selectedP === "ALL_SONGS") ? "Default" : selectedP;
    
    db.ref('collections/').on('value', (snap) => {
        const allData = snap.val();
        const list = document.getElementById('playlist');
        list.innerHTML = "";
        
        if (!allData) return;

        for (let pName in allData) {
            // Filter logic
            if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;

            const songs = allData[pName];
            for (let id in songs) {
                if (id === "_created") continue; // Skip placeholder
                
                const song = songs[id];
                list.innerHTML += `
                    <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; margin:8px 0; padding:12px; border-radius:10px; border-left:4px solid #1db954;">
                        <div>
                            <b>${song.name}</b> <br>
                            <small style="color:#666;">In: ${pName}</small>
                        </div>
                        <div>
                            <button onclick="playSong('${song.url}', '${song.name}')" style="background:#1db954; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">▶</button>
                            <button onclick="deleteSong('${pName}', '${id}')" style="background:#ff4444; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; color:white; margin-left:5px;">🗑️</button>
                        </div>
                    </li>`;
            }
        }
    });
}

// 5. DELETE & PLAY
function deleteSong(pName, sId) {
    if(confirm("Delete this song?")) { db.ref(`collections/${pName}/${sId}`).remove(); }
}

function playSong(rawUrl, name) {
    const wrapper = document.getElementById('drive-player-wrapper');
    const title = document.getElementById('playing-now');
    const match = rawUrl.match(/[-\w]{25,}/);
    if (match) {
        title.innerText = "Playing: " + name;
        wrapper.innerHTML = `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;" allow="autoplay"></iframe>`;
    }
}

// Initial Run
loadSongs();
