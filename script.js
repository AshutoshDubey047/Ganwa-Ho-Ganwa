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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 1. Gana Add Karne ka Function
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const user = document.getElementById('userTag').value;

    if (name && url) {
        db.ref('smart_playlist/').push({
            name: name,
            url: url,
            user: user
        }).then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
            alert("Gaana add ho gaya!");
        });
    } else {
        alert("Bhai, naam aur link dono daalo!");
    }
}

// 2. Gana Delete Karne ka Function
function deleteSong(id) {
    if(confirm("Kya aap is gaane ko hatana chahte hain?")) {
        db.ref('smart_playlist/' + id).remove();
    }
}

// 3. Live Playlist Update (Jo sabko dikhegi)
db.ref('smart_playlist/').on('value', (snap) => {
    const data = snap.val();
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    
    if (!data) {
        list.innerHTML = "<p style='text-align:center;'>Playlist khali hai.</p>";
        return;
    }

    for (let id in data) {
        const song = data[id];
        list.innerHTML += `
            <li class="song-item" style="display:flex; justify-content:space-between; align-items:center; background:#181818; margin:10px; padding:15px; border-radius:10px; border-left: 5px solid #1db954;">
                <div class="song-info">
                    <b style="color:#1db954;">${song.name}</b> <br>
                    <small style="color:#888;">By: ${song.user}</small>
                </div>
                <div class="actions">
                    <button onclick="playNow('${song.url}', '${song.name}')" style="background:#1db954; color:black; border:none; padding:8px 15px; border-radius:20px; cursor:pointer; font-weight:bold;">▶ Play</button>
                    <button onclick="deleteSong('${id}')" style="background:#ff4444; color:white; border:none; padding:8px 10px; border-radius:20px; cursor:pointer; margin-left:10px;">🗑️</button>
                </div>
            </li>`;
    }
});

// 4. Play Logic (The Final Fix for Drive)
function playNow(rawUrl, name) {
    const player = document.getElementById('main-player');
    const title = document.getElementById('playing-now');
    
    // Extract ID
    const match = rawUrl.match(/[-\w]{25,}/);
    
    if (match) {
        const fileId = match[0];
        
        // Google Drive "Download" bypass link
        const streamUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
        
        player.pause();
        player.src = streamUrl;
        player.load();
        
        title.innerText = "Connecting... " + name;

        player.play().then(() => {
            title.innerText = "Playing: " + name;
        }).catch(err => {
            console.warn("Method 1 failed, trying Preview Mode...");
            // Backup Play
            player.src = `https://drive.google.com/uc?id=${fileId}`;
            player.play().catch(e => {
                alert("Permission Error: Link 'Anyone with link' check karo!");
                title.innerText = "⚠️ Drive Permission Error";
            });
        });
    } else {
        alert("Invalid Link! Drive link daalo.");
    }
}
