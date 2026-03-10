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

// 1. In Playlists ko koi delete nahi kar payega
const protectedPlaylists = ["Ashutosh", "Palak Dii", "Laku", "Default", "ALL_SONGS"];

// --- GLOBAL DATA SYNC ---
db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    updateDropdown(allData);
    const currentView = document.getElementById('playlistSelect').value || "ALL_SONGS";
    renderSongs(allData, currentView);
});

// --- UPDATE DROPDOWN ---
function updateDropdown(allData) {
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value;
    
    let html = '<option value="ALL_SONGS">✨ All Songs (Everything)</option>';
    html += '<option value="Default">Default</option>';
    html += '<option value="Ashutosh">Ashutosh</option>';
    html += '<option value="Palak Dii">Palak Dii</option>';
    html += '<option value="Laku">Laku</option>';
    
    if (allData) {
        Object.keys(allData).forEach(pName => {
            // Jo pehle se add nahi hain dropdown mein unhe add karo
            if (!protectedPlaylists.includes(pName) && pName !== "_init") {
                html += `<option value="${pName}">${pName}</option>`;
            }
        });
    }
    
    if (select.innerHTML !== html) {
        select.innerHTML = html;
        select.value = currentVal || "ALL_SONGS";
    }
}

// --- SWITCH VIEW ---
function onPlaylistChange() {
    const selectedP = document.getElementById('playlistSelect').value;
    document.getElementById('targetDisplayName').innerText = (selectedP === "ALL_SONGS") ? "Default" : selectedP;
    
    db.ref('collections/').once('value', (snap) => {
        renderSongs(snap.val(), selectedP);
    });
}

// --- DELETE FULL PLAYLIST (With Double Check & Protection) ---
function deleteFullPlaylist() {
    const select = document.getElementById('playlistSelect');
    const name = select.value;

    // Protection Check
    if (protectedPlaylists.includes(name)) {
        alert(`Bhai, "${name}" playlist ko delete karna allow nahi hai! Ye protected hai.`);
        return;
    }

    // Double Confirmation Logic
    const firstCheck = confirm(`[CHECK 1] Kya aap sach mein poori "${name}" playlist delete karna chahte hain?`);
    if (firstCheck) {
        const secondCheck = confirm(`[CHECK 2 - DOUBLE CHECK] Pakka na? Iske saare gaane hamesha ke liye ud jayenge!`);
        if (secondCheck) {
            db.ref('collections/' + name).remove().then(() => {
                alert("Playlist Deleted Successfully!");
                select.value = "ALL_SONGS";
                onPlaylistChange();
            });
        }
    }
}

// --- ADD SONG ---
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const selectedP = document.getElementById('playlistSelect').value;
    let target = (selectedP === "ALL_SONGS") ? "Default" : selectedP;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url }).then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
            alert("Added!");
        });
    }
}

function createNewPlaylist() {
    let nameInput = document.getElementById('newPlaylistInput');
    let name = nameInput.value.trim();
    if (name) {
        db.ref('collections/' + name).update({ _init: true }).then(() => {
            nameInput.value = "";
            document.getElementById('playlistSelect').value = name;
            onPlaylistChange();
        });
    }
}

// --- MASTER RENDER ---
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
                <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:12px; margin:8px 0; border-radius:10px; border-left:4px solid ${pName === 'Default' ? '#1db954' : '#fb8c00'};">
                    <span><b>${song.name}</b><br><small style="color:#666;">Playlist: ${pName}</small></span>
                    <div>
                        <button onclick="playSong('${song.url}', '${song.name}')" style="background:#1db954; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">▶</button>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:#ff4444; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; color:white; margin-left:5px;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

function deleteSong(pName, sId) {
    if(confirm("Delete gaana?")) { db.ref(`collections/${pName}/${sId}`).remove(); }
}

function playSong(url, name) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        document.getElementById('playing-now').innerText = "Playing: " + name;
        document.getElementById('drive-player-wrapper').innerHTML = 
        `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;" allow="autoplay"></iframe>`;
    }
}
