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

// 1. Fetch & Render
db.ref('collections').on('value', (snap) => {
    const data = snap.val();
    if(!data) return;

    const select = document.getElementById('playlistSelect');
    const oldVal = select.value;
    let options = '<option value="ALL">✨ All Songs</option>';
    Object.keys(data).forEach(p => { if(p !== "_init") options += `<option value="${p}">${p}</option>`; });
    select.innerHTML = options;
    select.value = oldVal;

    loadSongs();

    // AUTO-PLAY FROM RELOAD
    const urlParams = new URLSearchParams(window.location.search);
    const autoIdx = urlParams.get('play');
    if(autoIdx !== null && currentQueue[autoIdx]) {
        setTimeout(() => playSong(parseInt(autoIdx)), 2000);
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
                    <div class="song-item">
                        <div class="song-info" onclick="playSong(${idx})">
                            <b style="font-size:15px;">${songs[id].name}</b><br>
                            <small style="color:var(--spotify-green);">${pName}</small>
                        </div>
                        <button class="del-icon" onclick="deleteSong('${pName}','${id}')">🗑️</button>
                    </div>`;
            }
        }
    });
}

// 2. Player Logic (The ONLY 100% Working Way)
function playSong(idx) {
    currentIndex = idx;
    const song = currentQueue[idx];
    const playerBox = document.getElementById('playerBox');
    const status = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        status.innerText = "▶ " + song.name;
        
        // Use Official Preview Iframe - Sunaai 100% dega
        playerBox.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none;" allow="autoplay"></iframe>`;

        // UPDATE URL FOR RELOAD
        const nextUrl = window.location.origin + window.location.pathname + "?play=" + (idx + 1);
        
        // AUTO-NEXT (Reload Page after 4 mins)
        setTimeout(() => {
            window.location.href = nextUrl;
        }, 240000); // 4 Minute Timer
    }
}

function playNext() {
    let next = currentIndex + 1;
    if(next < currentQueue.length) playSong(next);
}

// 3. Delete with 2-Step Confirmation
function deleteSong(p, id) {
    const step1 = confirm("⚠️ STEP 1: Are you sure you want to delete this song?");
    if(step1) {
        const step2 = confirm("🛑 STEP 2: LAST WARNING! This will remove the song forever. Confirm?");
        if(step2) {
            db.ref(`collections/${p}/${id}`).remove();
        }
    }
}

function addSong() {
    const n = document.getElementById('songName').value;
    const u = document.getElementById('songUrl').value;
    const p = document.getElementById('playlistSelect').value === "ALL" ? "Default" : document.getElementById('playlistSelect').value;
    if(n && u) db.ref(`collections/${p}`).push({ name: n, url: u }).then(() => {
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
    });
}
