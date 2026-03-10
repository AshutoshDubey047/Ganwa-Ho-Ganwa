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

let currentView = "ALL_SONGS";

// 1. CREATE NEW PLAYLIST (Doesn't delete old ones)
function createNewPlaylist() {
    let name = document.getElementById('newPlaylistName').value.trim();
    if (name) {
        // Just add to dropdown
        const select = document.getElementById('playlistSelect');
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        select.add(option);
        select.value = name;
        changePlaylistView();
        document.getElementById('newPlaylistName').value = "";
    }
}

// 2. SWITCH VIEW LOGIC
function changePlaylistView() {
    currentView = document.getElementById('playlistSelect').value;
    document.getElementById('currentPName').innerText = (currentView === "ALL_SONGS") ? "All Songs" : currentView;
    document.getElementById('targetPName').innerText = (currentView === "ALL_SONGS") ? "Default" : currentView;
    loadSongs();
}

// 3. ADD SONG
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    // Agar "All Songs" par ho toh Default mein save karo, warna current playlist mein
    let target = (currentView === "ALL_SONGS") ? "Default" : currentView;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url, playlistName: target });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
        alert("Saved to " + target);
    }
}

// 4. LOAD SONGS (The Master Fetch)
function loadSongs() {
    const list = document.getElementById('playlist');
    db.ref('collections/').off(); // Clear old listeners

    db.ref('collections/').on('value', (snap) => {
        const allData = snap.val();
        list.innerHTML = "";
        
        if (!allData) {
            list.innerHTML = "<p style='text-align:center;'>Empty Database.</p>";
            return;
        }

        for (let pName in allData) {
            // Agar specific playlist dekhni hai toh baaki skip karo
            if (currentView !== "ALL_SONGS" && pName !== currentView) continue;

            const songs = allData[pName];
            for (let id in songs) {
                const song = songs[id];
                list.innerHTML += `
                    <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; margin:8px 0; padding:12px; border-radius:10px; border-left:4px solid ${pName === 'Default' ? '#1db954' : '#fb8c00'};">
                        <div>
                            <b>${song.name}</b> <br>
                            <small style="color:#666;">Playlist: ${pName}</small>
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

// 5. DELETE LOGIC
function deleteSong(pName, sId) {
    if(confirm("Delete this song?")) {
        db.ref(`collections/${pName}/${sId}`).remove();
    }
}

// 6. PLAYER
function playSong(rawUrl, name) {
    const wrapper = document.getElementById('drive-player-wrapper');
    const title = document.getElementById('playing-now');
    const match = rawUrl.match(/[-\w]{25,}/);
    if (match) {
        title.innerText = "Playing: " + name;
        wrapper.innerHTML = `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;" allow="autoplay"></iframe>`;
    }
}

// Initial start
loadSongs();
