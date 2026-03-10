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

let currentPlaylist = "Default";

// 1. SWITCH PLAYLIST
function switchPlaylist() {
    let name = document.getElementById('newPlaylistName').value.trim();
    if (name) {
        currentPlaylist = name;
        document.getElementById('currentPName').innerText = name;
        document.getElementById('targetPName').innerText = name;
        loadSongs();
        alert("Switched to: " + name);
    }
}

// 2. ADD SONG
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;

    if (name && url) {
        db.ref('collections/' + currentPlaylist).push({
            name: name,
            url: url
        });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
    }
}

// 3. DELETE SONG
function deleteSong(id) {
    if(confirm("Delete karna hai?")) {
        db.ref('collections/' + currentPlaylist + '/' + id).remove();
    }
}

// 4. LOAD SONGS
function loadSongs() {
    db.ref('collections/' + currentPlaylist).on('value', (snap) => {
        const data = snap.val();
        const list = document.getElementById('playlistDisplay');
        list.innerHTML = "";
        for (let id in data) {
            list.innerHTML += `
                <li class="song-item" style="display:flex; justify-content:space-between; background:#181818; padding:10px; margin:5px; border-radius:8px;">
                    <span><b>${data[id].name}</b></span>
                    <div>
                        <button onclick="playAntiBlock('${data[id].url}', '${data[id].name}')">▶ Play</button>
                        <button onclick="deleteSong('${id}')" style="background:red; margin-left:5px;">🗑️</button>
                    </div>
                </li>`;
        }
    });
}

// 5. ANTI-BLOCK PLAY LOGIC (Using Embed)
function playAntiBlock(rawUrl, name) {
    const wrapper = document.getElementById('drive-frame-wrapper');
    const title = document.getElementById('playing-now');
    const match = rawUrl.match(/[-\w]{25,}/);

    if (match) {
        const fileId = match[0];
        title.innerText = "Playing: " + name;
        
        // Google Drive ka official preview player (Isse block nahi hota)
        wrapper.innerHTML = `
            <iframe 
                src="https://drive.google.com/file/d/${fileId}/preview" 
                width="100%" 
                height="80" 
                allow="autoplay"
                style="border:none; border-radius:10px; background:#000;">
            </iframe>`;
    } else {
        alert("Invalid Drive Link!");
    }
}

// Initial Load
loadSongs();
