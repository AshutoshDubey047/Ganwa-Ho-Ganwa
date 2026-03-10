const firebaseConfig = {
  apiKey: "AIzaSyDr18ZsJyhqzI0fKw6Ix3iex3FfYhPAywU",
  authDomain: "ganwaplayer.firebaseapp.com",
  databaseURL: "https://ganwaplayer-default-rtdb.firebaseio.com",
  projectId: "ganwaplayer",
  storageBucket: "ganwaplayer.firebasestorage.app",
  messagingSenderId: "28027251724",
  appId: "1:28027251724:web:792638e52fd8d842671229"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 1. ADD SONG
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const user = document.getElementById('userTag').value;

    if (name && url) {
        db.ref('smart_playlist/').push({
            name: name,
            url: url,
            user: user
        });
        document.getElementById('songName').value = "";
        document.getElementById('songUrl').value = "";
        alert("Gaana add ho gaya!");
    }
}

// 2. DELETE SONG
function deleteSong(id) {
    if(confirm("Kya aap ye gaana delete karna chahte hain?")) {
        db.ref('smart_playlist/' + id).remove()
        .then(() => alert("Deleted!"))
        .catch((e) => alert("Error: " + e.message));
    }
}

// 3. LIVE LISTENER & DISPLAY
let allSongs = {};
db.ref('smart_playlist/').on('value', (snap) => {
    allSongs = snap.val();
    showCat('all'); // Default sab dikhao
});

function showCat(cat) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    
    if (!allSongs) {
        list.innerHTML = "<p>Koi gaana nahi hai. Add kijiye!</p>";
        return;
    }

    for (let id in allSongs) {
        const song = allSongs[id];
        if (cat === 'all' || song.user === cat) {
            list.innerHTML += `
                <li class="song-item">
                    <div class="song-info">
                        <b>${song.name}</b> <br>
                        <small>Added by: ${song.user}</small>
                    </div>
                    <div class="actions">
                        <button class="play-btn" onclick="playNow('${song.url}', '${song.name}')">▶ Play</button>
                        <button class="del-btn" onclick="deleteSong('${id}')">🗑️</button>
                    </div>
                </li>`;
        }
    }
}

// 4. SMART PLAY LOGIC (Fixes 403 Forbidden)
function playNow(rawUrl, name) {
    const p = document.getElementById('main-player');
    const title = document.getElementById('playing-now');
    
    // Google ID extract karna
    const match = rawUrl.match(/[-\w]{25,}/);
    
    if (match) {
        const fileId = match[0];
        // Stream URL bypass
        const playUrl = `https://docs.google.com/uc?id=${fileId}`;
        
        p.pause();
        p.src = playUrl;
        p.load();
        
        title.innerText = "Buffering: " + name;

        p.play().then(() => {
            title.innerText = "Playing: " + name;
        }).catch(err => {
            console.error(err);
            title.innerText = "⚠️ Permission Error! Check Drive Link.";
            alert("Google Drive error! Make sure the link is 'Anyone with link'.");
        });
    } else {
        alert("Invalid Drive Link!");
    }
}