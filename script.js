const firebaseConfig = {
    apiKey: "AIzaSyDr18ZsJyhqzI0fKw6Ix3iex3FfYhPAywU",
    authDomain: "ganwaplayer.firebaseapp.com",
    databaseURL: "https://ganwaplayer-default-rtdb.firebaseio.com",
    projectId: "ganwaplayer",
    storageBucket: "ganwaplayer.firebasestorage.app",
    messagingSenderId: "28027251724",
    appId: "1:28027251724:web:792638e52fd8d842671229"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentQueue = [];
let currentSongIndex = -1;

// --- 1. Load Data ---
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    const select = document.getElementById('playlistSelect');
    const activeP = select.value || "ALL_SONGS";
    
    let options = '<option value="ALL_SONGS">✨ All Songs</option>';
    if (data) {
        Object.keys(data).forEach(p => { if (p !== "_init") options += `<option value="${p}">${p}</option>`; });
    }
    select.innerHTML = options;
    select.value = activeP;

    renderSongs(data, activeP);
    
    // CHECK URL FOR AUTO-PLAY AFTER RELOAD
    checkUrlParams();
});

function renderSongs(data, selected) {
    const container = document.getElementById('song-list-container');
    container.innerHTML = "";
    currentQueue = [];
    if (!data) return;

    for (let pName in data) {
        if (selected !== "ALL_SONGS" && pName !== selected) continue;
        const songs = data[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            currentQueue.push({ ...songs[id], pName, id });
            let idx = currentQueue.length - 1;

            container.innerHTML += `
                <div class="song-card" onclick="playSong(${idx})" style="display:flex; justify-content:space-between; background:#121212; padding:15px; margin-bottom:8px; border-radius:10px; cursor:pointer; border:1px solid #222;">
                    <div><b>${songs[id].name}</b><br><small style="color:#1db954;">${pName}</small></div>
                </div>`;
        }
    }
}

// --- 2. Play & Auto-Reload Logic ---
function playSong(idx) {
    if (idx < 0 || idx >= currentQueue.length) return;
    currentSongIndex = idx;
    const song = currentQueue[idx];
    const wrapper = document.getElementById('player-wrapper');
    const status = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "▶ " + song.name;
        wrapper.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none;" allow="autoplay"></iframe>`;

        // UPDATE URL WITHOUT RELOAD (To keep track)
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?songIdx=' + idx;
        window.history.pushState({path:newUrl},'',newUrl);

        // START A TIMER (Reload after 4 minutes to play next)
        // Note: Google Drive songs are usually 3-5 mins. 
        // We set a 240 seconds (4 min) timer for auto-reload.
        console.log("Auto-next timer started...");
        setTimeout(() => {
            playNextWithReload();
        }, 240000); // 4 minutes
    }
}

function playNextWithReload() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) {
        // Page Reload with next index in URL
        window.location.href = window.location.pathname + "?songIdx=" + next;
    }
}

function playNextSong() {
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) playSong(next);
}

// --- 3. URL Parameter Checker ---
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const songIdx = urlParams.get('songIdx');
    
    if (songIdx !== null && currentQueue.length > 0) {
        // Wait 1 second for everything to load, then play
        setTimeout(() => {
            if (currentSongIndex === -1) { // Only play if not already playing
                playSong(parseInt(songIdx));
            }
        }, 1000);
    }
}

function onPlaylistChange() {
    db.ref('collections').once('value', (s) => renderSongs(s.val(), document.getElementById('playlistSelect').value));
}
