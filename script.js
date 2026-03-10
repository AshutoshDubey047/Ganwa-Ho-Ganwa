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
let currentQueue = []; 
let currentSongIndex = -1;

db.ref('collections/').on('value', (snap) => {
    const allData = snap.val();
    const select = document.getElementById('playlistSelect');
    const currentVal = select.value || "ALL_SONGS";
    let html = '<option value="ALL_SONGS">✨ All Songs</option><option value="Default">Default</option><option value="Ashutosh">Ashutosh</option><option value="Palak Dii">Palak Dii</option><option value="Laku">Laku</option>';
    if (allData) {
        Object.keys(allData).forEach(pName => {
            if (!protectedPlaylists.includes(pName) && pName !== "_init") {
                html += `<option value="${pName}">${pName}</option>`;
            }
        });
    }
    select.innerHTML = html;
    select.value = currentVal; 
    renderSongs(allData, currentVal);
});

function renderSongs(allData, selectedP) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    currentQueue = []; 
    if (!allData) return;
    for (let pName in allData) {
        if (selectedP !== "ALL_SONGS" && pName !== selectedP) continue;
        const songs = allData[pName];
        for (let id in songs) {
            if (id === "_init") continue;
            currentQueue.push({ name: songs[id].name, url: songs[id].url });
            let index = currentQueue.length - 1;
            list.innerHTML += `<li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; padding:12px; margin:8px 0; border-radius:10px; border-left:4px solid #1db954;">
                <span><b style="color:white;">${songs[id].name}</b></span>
                <button onclick="playSong(${index})" style="background:#1db954; border:none; padding:8px; border-radius:5px;">▶</button>
            </li>`;
        }
    }
}

// MAIN PLAY LOGIC
function playSong(index) {
    if (index < 0 || index >= currentQueue.length) return;
    currentSongIndex = index;
    const song = currentQueue[index];
    const audio = document.getElementById('mainAudio');
    const title = document.getElementById('playing-now');

    const fileId = song.url.match(/[-\w]{25,}/);
    if (fileId) {
        // HACK: Use direct link and add a timestamp to bypass cache if needed
        const directLink = `https://docs.google.com/uc?export=download&id=${fileId[0]}`;
        title.innerText = "Playing: " + song.name;
        audio.src = directLink;
        audio.load(); // Force reload for new source
        
        let playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay prevented. User must click play.");
            });
        }
    }
}

function playNextSong() {
    console.log("Song Ended. Moving to next...");
    let next = currentSongIndex + 1;
    if (next < currentQueue.length) {
        playSong(next);
    } else {
        document.getElementById('playing-now').innerText = "Playlist Ended";
    }
}

// Helper functions for playlist management
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
        db.ref('collections/' + name).set({ _init: true }).then(() => {
            input.value = "";
            document.getElementById('playlistSelect').value = name;
            onPlaylistChange();
        });
    }
}

function deleteFullPlaylist() {
    const name = document.getElementById('playlistSelect').value;
    if (protectedPlaylists.includes(name)) return alert("Reserved!");
    if (confirm(`Delete "${name}"?`) && confirm("Final Warning!")) {
        db.ref('collections/' + name).remove();
    }
}
