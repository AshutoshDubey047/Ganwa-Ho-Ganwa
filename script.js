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

// --- 1. LIVE SYNC DROPDOWN & RENDER ---
db.ref('collections/').on('value', (snap) => {
    const select = document.getElementById('playlistSelect');
    const allData = snap.val();
    const currentSelection = select.value || "ALL_SONGS";
    
    // Dropdown options update
    let optionsHTML = '<option value="ALL_SONGS">✨ All Songs (Everything)</option>';
    optionsHTML += '<option value="Default">Default</option>';
    
    if (allData) {
        Object.keys(allData).forEach(pName => {
            if (pName !== "Default" && pName !== "_init") {
                optionsHTML += `<option value="${pName}">${pName}</option>`;
            }
        });
    }
    select.innerHTML = optionsHTML;
    select.value = currentSelection; // Jo user ne chuna tha wahi rakho

    // Screen par display update karo
    renderSongs(allData, currentSelection);
});

// --- 2. DROPDOWN CHANGE HANDLER ---
function onPlaylistChange() {
    const selectedP = document.getElementById('playlistSelect').value;
    const targetDisplay = document.getElementById('targetDisplayName');
    
    // UI par turant dikhao ki ab gaana kahan jayega
    targetDisplay.innerText = (selectedP === "ALL_SONGS") ? "Default" : selectedP;
    
    // List refresh karo
    db.ref('collections/').once('value', (snap) => {
        renderSongs(snap.val(), selectedP);
    });
}

// --- 3. CREATE NEW PLAYLIST ---
function createNewPlaylist() {
    let nameInput = document.getElementById('newPlaylistInput');
    let name = nameInput.value.trim();
    if (name) {
        db.ref('collections/' + name).update({ _init: true })
        .then(() => {
            alert(`Playlist "${name}" created!`);
            nameInput.value = "";
            document.getElementById('playlistSelect').value = name;
            onPlaylistChange(); // UI update karne ke liye
        });
    }
}

// --- 4. ADD SONG (FIXED TARGETING) ---
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const selectBox = document.getElementById('playlistSelect');
    
    // Asli selected value yahan se uthao
    let selectedP = selectBox.options[selectBox.selectedIndex].value;
    
    // Agar "All Songs" chuna hai toh "Default" mein dalo, warna jo chuna hai usi mein
    let target = (selectedP === "ALL_SONGS") ? "Default" : selectedP;

    if (name && url) {
        db.ref('collections/' + target).push({ name, url })
        .then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
            alert(`Saved successfully in: ${target}`);
        }).catch(err => alert("Firebase Error: " + err.message));
    } else {
        alert("Enter Song Name and Link!");
    }
}

// --- 5. MASTER RENDER ---
function renderSongs(allData, selectedP) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    if (!allData) return;

    for (let pName in allData) {
        // FILTER: Sirf selected playlist dikhao (unless ALL_SONGS is selected)
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;

        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init" || id === "_created") continue;
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
