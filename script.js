const firebaseConfig = {
    apiKey: "AIzaSyDr18ZsJyhqzI0fKw6Ix3iex3FfYhPAywU",
    authDomain: "ganwaplayer.firebaseapp.com",
    databaseURL: "https://ganwaplayer-default-rtdb.firebaseio.com",
    projectId: "ganwaplayer",
    storageBucket: "ganwaplayer.firebasestorage.app",
    messagingSenderId: "28027251724",
    appId: "1:28027251724:web:792638e52fd8d842671229"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentQueue = [];
let currentIndex = -1;
let allData = {};

// 1. Fetch data ONCE and listen for changes
db.ref('collections').on('value', (snap) => {
    allData = snap.val();
    if(!allData) return;

    // Load Playlists in Dropdown
    const select = document.getElementById('playlistSelect');
    const oldVal = select.value || "ALL";
    let opts = '<option value="ALL">✨ All Playlists</option>';
    Object.keys(allData).forEach(p => { if(p !== "_init") opts += `<option value="${p}">${p}</option>`; });
    select.innerHTML = opts;
    select.value = oldVal;

    renderSongs();
});

function renderSongs() {
    const selectedP = document.getElementById('playlistSelect').value;
    const list = document.getElementById('songsList');
    list.innerHTML = "";
    currentQueue = [];

    for (let p in allData) {
        if (selectedP !== "ALL" && p !== selectedP) continue;
        const songs = allData[p];
        for (let id in songs) {
            if (id === "_init") continue;
            currentQueue.push({ ...songs[id], pName: p, id: id });
            let idx = currentQueue.length - 1;
            
            list.innerHTML += `
                <div class="song-item">
                    <div class="song-info" onclick="playSong(${idx})">
                        <b>${songs[id].name}</b><br><small style="color:#1db954;">${p}</small>
                    </div>
                    <button class="del-btn" onclick="deleteSong3X('${p}','${id}','${songs[id].name}')">DEL</button>
                </div>`;
        }
    }
}

// 2. Play with Iframe (This works for Google Drive)
function playSong(idx) {
    if(idx < 0 || idx >= currentQueue.length) return;
    currentIndex = idx;
    const song = currentQueue[idx];
    const fileId = song.url.match(/[-\w]{25,}/);

    if (fileId) {
        document.getElementById('status').innerText = "▶ " + song.name;
        document.getElementById('player').innerHTML = 
            `<iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" width="100%" height="80" style="border:none;" allow="autoplay"></iframe>`;
    }
}

function playNext() {
    let next = currentIndex + 1;
    if(next < currentQueue.length) playSong(next);
}

// 3. 3-TIMES DELETE (As requested)
function deleteSong3X(playlist, songId, name) {
    if(confirm("⚠️ PEHLA STEP: Kya '" + name + "' delete karna hai?")) {
        if(confirm("🛑 DUSRA STEP: Pakka? Yeh list se gayab ho jayega.")) {
            if(confirm("❗ TEESRA STEP: Last warning! Delete kar doon?")) {
                db.ref(`collections/${playlist}/${songId}`).remove();
            }
        }
    }
}

// 4. Add Song
function addSong() {
    const n = document.getElementById('songName').value;
    const u = document.getElementById('songUrl').value;
    const p = document.getElementById('playlistSelect').value === "ALL" ? "Default" : document.getElementById('playlistSelect').value;
    if(n && u) db.ref(`collections/${p}`).push({ name: n, url: u });
}
