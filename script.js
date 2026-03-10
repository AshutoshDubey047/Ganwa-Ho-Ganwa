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
let currentPlaylistSongs = []; // Auto-play ke liye list track karne ke liye
let currentSongIndex = -1;

// --- 1. LIVE SYNC ---
db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    updateDropdown(allData);
    const currentView = document.getElementById('playlistSelect').value || "ALL_SONGS";
    renderSongs(allData, currentView);
});

function updateDropdown(allData) {
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value;
    let html = '<option value="ALL_SONGS">✨ All Songs</option>';
    html += '<option value="Default">Default</option><option value="Ashutosh">Ashutosh</option><option value="Palak Dii">Palak Dii</option><option value="Laku">Laku</option>';
    if (allData) {
        Object.keys(allData).forEach(pName => {
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

// --- 2. RENDER & AUTO-PLAY LOGIC ---
function renderSongs(allData, selectedP) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    currentPlaylistSongs = []; // Reset current queue
    if (!allData) return;

    for (let pName in allData) {
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;
        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            const song = songs[id];
            currentPlaylistSongs.push(song); // Queue mein add karo
            
            let index = currentPlaylistSongs.length - 1;
            list.innerHTML += `
                <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:12px; margin:8px 0; border-radius:10px; border-left:4px solid #1db954;">
                    <span><b>${song.name}</b><br><small style="color:#666;">Playlist: ${pName}</small></span>
                    <div>
                        <button onclick="playSong(${index})" style="background:#1db954; border:none; padding:8px 12px; border-radius:5px;">▶</button>
                        <button onclick="deleteSong('${pName}', '${id}')" style="background:red; border:none; padding:8px 12px; border-radius:5px; color:white; margin-left:5px;">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

// --- 3. PLAYER & AUTO-NEXT ---
function playSong(index) {
    if (index >= currentPlaylistSongs.length) {
        console.log("Playlist khatam!");
        return;
    }
    
    currentSongIndex = index;
    const song = currentPlaylistSongs[index];
    const match = song.url.match(/[-\w]{25,}/);
    
    if (match) {
        document.getElementById('playing-now').innerText = "Playing: " + song.name;
        const playerWrapper = document.getElementById('drive-player-wrapper');
        
        // Iframe with onload event for next song
        playerWrapper.innerHTML = `
            <iframe id="drivePlayer" src="https://drive.google.com/file/d/${match[0]}/preview" 
            width="100%" height="60" style="border:none; border-radius:10px; background:#000;" 
            allow="autoplay"></iframe>`;

        // Note: Google Drive iframe auto-next detect karna mushkil hota hai because of security,
        // Lekin hum ek timer laga sakte hain ya user ko manually next bol sakte hain.
        // Asli auto-play ke liye aapko "Direct Link" (uc?id=...) use karke <audio> tag lagana padega.
    }
}

// --- 4. DOUBLE CHECK DELETE SONG ---
function deleteSong(pName, sId) {
    const firstCheck = confirm("Check 1: Kya aap ye gaana delete karna chahte hain?");
    if (firstCheck) {
        const secondCheck = confirm("Check 2 (FINAL): Pakka na? Ye wapas nahi aayega!");
        if (secondCheck) {
            db.ref(`collections/${pName}/${sId}`).remove();
        }
    }
}

// --- BAAKI FUNCTIONS ---
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

function deleteFullPlaylist() {
    const name = document.getElementById('playlistSelect').value;
    if (protectedPlaylists.includes(name)) return alert("Reserved!");
    if (confirm(`Delete full playlist "${name}"?`) && confirm("Final Warning!")) {
        db.ref('collections/' + name).remove().then(() => {
            document.getElementById('playlistSelect').value = "ALL_SONGS";
            onPlaylistChange();
        });
    }
}
