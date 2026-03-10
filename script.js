// Firebase Config (Aapka purana wala hi rahega)
const firebaseConfig = { ... }; 
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentQueue = [];
let currentSongIndex = -1;

// --- 1. DATA LOAD ---
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const container = document.getElementById('songsList');
    const activeP = select.value || "ALL";

    // Update Dropdown
    let options = '<option value="ALL">✨ All Playlists</option>';
    if(data) {
        Object.keys(data).forEach(p => { if(p !== "_init") options += `<option value="${p}">${p}</option>`; });
    }
    select.innerHTML = options;
    select.value = activeP;

    // Render Songs
    container.innerHTML = "";
    currentQueue = [];
    for (let pName in data) {
        if (activeP !== "ALL" && pName !== activeP) continue;
        const songs = data[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            currentQueue.push({ ...songs[id], pName, id });
            let idx = currentQueue.length - 1;
            container.innerHTML += `
                <div class="song-item" style="display:flex; justify-content:space-between; background:#181818; padding:15px; margin:10px 0; border-radius:10px; border-left:4px solid #1db954;">
                    <div onclick="playSong(${idx})" style="flex:1; cursor:pointer;">
                        <b style="color:#fff;">${songs[id].name}</b><br>
                        <small style="color:#888;">${pName}</small>
                    </div>
                    <button onclick="confirmDelete('${pName}','${id}')" style="background:none; border:none; color:#ff4444; font-size:20px; cursor:pointer;">🗑️</button>
                </div>`;
        }
    }
});

// --- 2. THE PLAYER ENGINE (No Iframe) ---
const audioPlayer = new Audio();

function playSong(idx) {
    if (idx < 0 || idx >= currentQueue.length) return;
    currentSongIndex = idx;
    const song = currentQueue[idx];
    const fileId = song.url.match(/[-\w]{25,}/);

    if (fileId) {
        document.getElementById('playing-now').innerText = "▶ " + song.name;
        // Direct Proxy Link to bypass Google Block
        audioPlayer.src = `https://docs.google.com/uc?export=download&id=${fileId[0]}`;
        audioPlayer.play().catch(() => {
            alert("Please click anywhere on the page once to allow Autoplay!");
        });
    }
}

// AUTO-NEXT: This works 100% with Audio Tag (No Reload Needed)
audioPlayer.onended = () => {
    let next = currentSongIndex + 1;
    if(next < currentQueue.length) playSong(next);
};

// --- 3. DOUBLE CONFIRMATION DELETE ---
function confirmDelete(p, id) {
    if (confirm("⚠️ Are you sure you want to delete this song?")) {
        if (confirm("🛑 FINAL CONFIRMATION: Remove it forever?")) {
            db.ref(`collections/${p}/${id}`).remove();
        }
    }
}

function playNext() {
    let next = currentSongIndex + 1;
    if(next < currentQueue.length) playSong(next);
}
