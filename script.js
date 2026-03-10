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
let currentIndex = -1;

// 1. DATA LOAD (No Filtering First)
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    if(!data) return;

    // Load Dropdown
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value;
    let options = '<option value="ALL">✨ Show All Playlists</option>';
    Object.keys(data).forEach(p => { if(p !== "_init") options += `<option value="${p}">${p}</option>`; });
    select.innerHTML = options;
    select.value = currentVal;

    loadSongs();
    
    // AUTO-NEXT CHECK FROM URL
    const params = new URLSearchParams(window.location.search);
    const jumpTo = params.get('next');
    if(jumpTo && currentQueue[jumpTo]) {
        setTimeout(() => playSong(parseInt(jumpTo)), 2000);
    }
});

function loadSongs() {
    const selectedP = document.getElementById('playlistSelect').value;
    const container = document.getElementById('songsList');
    container.innerHTML = "";
    currentQueue = [];

    db.ref('collections').once('value', (snap) => {
        const data = snap.val();
        for (let pName in data) {
            if (selectedP !== "ALL" && pName !== selectedP) continue;
            const songs = data[pName];
            for (let id in songs) {
                if (id === "_init") continue;
                currentQueue.push({ ...songs[id], pName, id });
                let idx = currentQueue.length - 1;
                container.innerHTML += `
                    <div class="spotify-card">
                        <div onclick="playSong(${idx})" style="flex:1; cursor:pointer;">
                            <b>${songs[id].name}</b><br><small style="color:#888;">${pName}</small>
                        </div>
                        <button onclick="deleteSong('${pName}','${id}')" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>
                    </div>`;
            }
        }
    });
}

// 2. PLAYER (Force Iframe Bypass)
function playSong(idx) {
    currentIndex = idx;
    const song = currentQueue[idx];
    const playerBox = document.getElementById('playerBox');
    const status = document.getElementById('nowPlaying');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "▶ " + song.name;
        // RELOAD URL update
        const cleanUrl = window.location.origin + window.location.pathname + "?next=" + (idx + 1);
        
        // Iframe with Force Preview
        playerBox.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none;" allow="autoplay"></iframe>`;

        // RELOAD TRIGGER (4 Minutes)
        // Agar gaana baj raha hai toh 4 min baad page reload hoke agla bajayega
        setTimeout(() => {
            window.location.href = cleanUrl;
        }, 240000); 
    }
}

function playNext() {
    let next = currentIndex + 1;
    if(next < currentQueue.length) playSong(next);
}

// 3. ADMIN
function addSong() {
    const n = document.getElementById('songName').value;
    const u = document.getElementById('songUrl').value;
    const p = document.getElementById('playlistSelect').value === "ALL" ? "Default" : document.getElementById('playlistSelect').value;
    if(n && u) db.ref(`collections/${p}`).push({ name: n, url: u });
}

function deleteSong(p, id) {
    if(confirm("Delete?")) db.ref(`collections/${p}/${id}`).remove();
}
