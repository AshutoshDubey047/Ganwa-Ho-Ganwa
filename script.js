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

// --- 1. GLOBAL DATA SYNC ---
// Isse data hamesha fresh rahega aur switch karne pe gayab nahi hoga
db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    updateDropdown(allData);
    const currentView = document.getElementById('playlistSelect').value || "ALL_SONGS";
    renderSongs(allData, currentView);
});

// --- 2. UPDATE DROPDOWN (Bina Selection Bigade) ---
function updateDropdown(allData) {
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value;
    
    let html = '<option value="ALL_SONGS">✨ All Songs (Everything)</option>';
    html += '<option value="Default">Default</option>';
    
    if (allData) {
        Object.keys(allData).forEach(pName => {
            if (pName !== "Default" && pName !== "_init") {
                html += `<option value="${pName}">${pName}</option>`;
            }
        });
    }
    
    // Sirf tabhi update karo agar options badle hain, taki selection jump na kare
    if (select.innerHTML !== html) {
        select.innerHTML = html;
        select.value = currentVal || "ALL_SONGS";
    }
}

// --- 3. SWITCH VIEW HANDLER ---
function onPlaylistChange() {
    const selectedP = document.getElementById('playlistSelect').value;
    document.getElementById('targetDisplayName').innerText = (selectedP === "ALL_SONGS") ? "Default" : selectedP;
    
    // Data ko phir se fetch karke render karo
    db.ref('collections/').once('value', (snap) => {
        renderSongs(snap.val(), selectedP);
    });
}

// --- 4. RENDER LOGIC (THE FIX) ---
function renderSongs(allData, selectedP) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    if (!allData) return;

    for (let pName in allData) {
        // Agar "ALL_SONGS" nahi hai, toh sirf selected wali playlist dikhao
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;

        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            const song = songs[id];
            
            list.innerHTML += `
                <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; margin:8px 0; padding:12px; border-radius:10px; border-left:4px solid ${pName === 'Default' ? '#1db954' : '#fb8c00'};">
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

// --- 5. ADD & DELETE FUNCTIONS ---
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const selectBox = document.getElementById('playlistSelect');
    const selectedP = selectBox.value;
    
    let target = (selectedP === "ALL_SONGS") ? "Default" : selectedP;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url })
        .then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
            alert("Added to " + target);
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

function deleteSong(pName, sId) {
    if(confirm("Delete this song?")) { db.ref(`collections/${pName}/${sId}`).remove(); }
}

function playSong(url, name) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
        document.getElementById('playing-now').innerText = "Playing: " + name;
        document.getElementById('drive-player-wrapper').innerHTML = 
        `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;" allow="autoplay"></iframe>`;
    }
}
