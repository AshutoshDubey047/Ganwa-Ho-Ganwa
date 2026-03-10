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

// 1. Playlist Dropdown Loader
db.ref('collections/').on('value', (snap) => {
    const select = document.getElementById('playlistSelect');
    const data = snap.val();
    const currentView = select.value;
    
    select.innerHTML = '<option value="ALL_SONGS">✨ All Songs (Everything)</option>';
    if (data) {
        Object.keys(data).forEach(pName => {
            let opt = document.createElement('option');
            opt.value = pName;
            opt.text = pName;
            select.add(opt);
        });
    }
    select.value = currentView;
    renderSongs(data);
});

// 2. Create Playlist
function createNewPlaylist() {
    let name = document.getElementById('newPlaylistInput').value.trim();
    if (name) {
        db.ref('collections/' + name).set({ _init: true })
        .then(() => {
            alert("Playlist Created!");
            document.getElementById('newPlaylistInput').value = "";
        }).catch(e => alert("Permission Error: " + e.message));
    }
}

// 3. Add Song
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const selectedP = document.getElementById('playlistSelect').value;
    let target = (selectedP === "ALL_SONGS") ? "Default" : selectedP;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url })
        .then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
        });
    }
}

// 4. Render Songs
function renderSongs(allData) {
    const list = document.getElementById('playlist');
    const selectedP = document.getElementById('playlistSelect').value;
    list.innerHTML = "";
    if (!allData) return;

    for (let pName in allData) {
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;
        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            const song = songs[id];
            list.innerHTML += `
                <li style="display:flex; justify-content:space-between; background:#181818; padding:10px; margin:5px; border-radius:8px; border-left:4px solid #1db954;">
                    <span><b>${song.name}</b><br><small>${pName}</small></span>
                    <div>
                        <button onclick="playSong('${song.url}', '${song.name}')">▶</button>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:red; color:white;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

function deleteSong(pName, sId) {
    if(confirm("Delete?")) db.ref(`collections/${pName}/${sId}`).remove();
}

function playSong(url, name) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        document.getElementById('playing-now').innerText = "Playing: " + name;
        document.getElementById('drive-player-wrapper').innerHTML = 
        `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px;"></iframe>`;
    }
}
