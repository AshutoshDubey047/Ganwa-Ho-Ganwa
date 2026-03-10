// ==========================================
// 1. FIREBASE CONFIGURATION (Aapka Project)
// ==========================================
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

// ==========================================
// 2. ADD SONG FUNCTION
// ==========================================
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    const user = document.getElementById('userTag').value;

    if (name && url) {
        // Firebase mein data bhej raha hai
        db.ref('smart_playlist/').push({
            name: name,
            url: url,
            user: user
        }).then(() => {
            // Input boxes khali karna
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
            alert("Gaana List mein add ho gaya!");
        }).catch((error) => {
            alert("Firebase Error: " + error.message);
        });
    } else {
        alert("Bhai, Naam aur Drive Link dono daalo!");
    }
}

// ==========================================
// 3. DELETE SONG FUNCTION
// ==========================================
function deleteSong(id) {
    if(confirm("Kya aap is gaane ko hamesha ke liye hatana chahte hain?")) {
        db.ref('smart_playlist/' + id).remove()
        .then(() => {
            console.log("Deleted successfully");
        })
        .catch((error) => {
            alert("Delete fail: " + error.message);
        });
    }
}

// ==========================================
// 4. LIVE PLAYLIST LISTENER (Real-time update)
// ==========================================
db.ref('smart_playlist/').on('value', (snap) => {
    const data = snap.val();
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    
    if (!data) {
        list.innerHTML = "<p style='text-align:center; color:#888;'>Playlist khali hai. Pehla gaana aap add karein!</p>";
        return;
    }

    // Har gaane ke liye list item banana
    for (let id in data) {
        const song = data[id];
        const li = document.createElement('li');
        li.className = "song-item";
        li.style = "display:flex; justify-content:space-between; align-items:center; background:#181818; margin:10px; padding:15px; border-radius:10px; border-left: 5px solid #1db954;";
        
        li.innerHTML = `
            <div class="song-info">
                <b style="color:#1db954; font-size:1.1rem;">${song.name}</b> <br>
                <small style="color:#aaa;">By: ${song.user}</small>
            </div>
            <div class="actions">
                <button onclick="playNow('${song.url}', '${song.name}')" style="background:#1db954; color:black; border:none; padding:8px 15px; border-radius:20px; cursor:pointer; font-weight:bold;">▶ Play</button>
                <button onclick="deleteSong('${id}')" style="background:#ff4444; color:white; border:none; padding:8px 10px; border-radius:20px; cursor:pointer; margin-left:10px;">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    }
});

// ==========================================
// 5. SMART PLAY LOGIC (Bypass & Fix)
// ==========================================
function playNow(rawUrl, name) {
    const player = document.getElementById('main-player');
    const title = document.getElementById('playing-now');
    
    // Google Drive ID extract karne ka logic
    const match = rawUrl.match(/[-\w]{25,}/);
    
    if (match) {
        const fileId = match[0];
        
        // Google Drive Direct Stream URL (Bypass method)
        const streamUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
        
        player.pause();
        player.src = streamUrl;
        player.load();
        
        title.innerText = "Connecting to Drive... " + name;

        // Play karne ki koshish
        player.play().then(() => {
            title.innerText = "Playing: " + name;
        }).catch(err => {
            console.warn("Method 1 failed, trying Preview Mode...");
            // Agar pehla tarika fail ho, toh ye backup try karega
            player.src = `https://drive.google.com/uc?id=${fileId}`;
            player.play().catch(e => {
                title.innerText = "⚠️ Permission Denied by Google";
                alert("Google ne is gaane ko block kiya hai. Drive mein 'Anyone with link' and 'Allow Download' check karein.");
            });
        });
    } else {
        alert("Bhai, ye Google Drive ka link nahi lag raha. Check karein!");
    }
}
