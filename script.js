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

let currentPlaylist = "Default";

// 1. SWITCH PLAYLIST
function switchPlaylist() {
    let name = document.getElementById('newPlaylistName').value.trim();
    if (name) {
        currentPlaylist = name;
        document.getElementById('currentPName').innerText = name;
        document.getElementById('newPlaylistName').value = "";
        loadSongs(); // Nayi list load karo
    }
}

// 2. DELETE FULL PLAYLIST (Puri Playlist Khatam)
function deleteFullPlaylist() {
    if (currentPlaylist === "Default") {
        return alert("Bhai, Default playlist delete mat karo!");
    }
    if (confirm(`Kya aap puri "${currentPlaylist}" playlist aur uske saare gaane delete karna chahte hain?`)) {
        db.ref('collections/' + currentPlaylist).remove().then(() => {
            alert("Playlist Deleted!");
            currentPlaylist = "Default";
            document.getElementById('currentPName').innerText = "Default";
            loadSongs();
        });
    }
}

// 3. ADD SONG
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    if (name && url) {
        db.ref('collections/' + currentPlaylist).push({ name, url });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
    }
}

// 4. DELETE SINGLE SONG
function deleteSong(id) {
    if(confirm("Ye gaana hatayein?")) {
        db.ref('collections/' + currentPlaylist + '/' + id).remove();
    }
}

// 5. LOAD SONGS (Refreshes on switch)
function loadSongs() {
    // Purana listener band karke naya chalu karna zaroori hai
    db.ref('collections/' + currentPlaylist).off(); 
    
    db.ref('collections/' + currentPlaylist).on('value', (snap) => {
        const data = snap.val();
        const list = document.getElementById('playlist');
        list.innerHTML = "";
        
        if (!data) {
            list.innerHTML = `<p style='text-align:center; color:#888;'>"${currentPlaylist}" khali hai. Gaane add karein!</p>`;
            return;
        }

        for (let id in data) {
            const song = data[id];
            list.innerHTML += `
                <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; margin:10px 0; padding:15px; border-radius:10px; border-left:4px solid #1db954;">
                    <span><b>${song.name}</b></span>
                    <div>
                        <button onclick="playSong('${song.url}', '${song.name}')" style="background:#1db954; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;">▶ Play</button>
                        <button onclick="deleteSong('${id}')" style="background:#ff4444; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; color:white; margin-left:5px;">🗑️</button>
                    </div>
                </li>`;
        }
    });
}

// 6. PLAYER LOGIC
function playSong(rawUrl, name) {
    const wrapper = document.getElementById('drive-player-wrapper');
    const title = document.getElementById('playing-now');
    const match = rawUrl.match(/[-\w]{25,}/);
    if (match) {
        title.innerText = "Playing: " + name;
        wrapper.innerHTML = `<iframe src="https://drive.google.com/file/d/${match[0]}/preview" width="100%" height="60" style="border:none; border-radius:10px; background:#000;" allow="autoplay"></iframe>`;
    }
}

loadSongs();
