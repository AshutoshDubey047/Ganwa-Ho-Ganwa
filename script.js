// 1. Firebase Configuration (Aapka Project)
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

// 2. Add Song Function (Saves to Firebase)
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
        alert("Gaana List mein add ho gaya!");
    } else {
        alert("Bhai, Naam aur Link dono bharo!");
    }
}

// 3. Delete Song Function
function deleteSong(id) {
    if(confirm("Kya aap ye gaana sach mein delete karna chahte hain?")) {
        db.ref('smart_playlist/' + id).remove()
        .then(() => {
            console.log("Deleted successfully");
        })
        .catch((error) => {
            alert("Delete nahi ho paya: " + error.message);
        });
    }
}

// 4. Live Playlist Loader (Updates automatically for all users)
let allSongs = {};
db.ref('smart_playlist/').on('value', (snap) => {
    allSongs = snap.val();
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    
    if (!allSongs) {
        list.innerHTML = "<p style='text-align:center;'>Playlist khali hai. Gaana add karein!</p>";
        return;
    }

    for (let id in allSongs) {
        const song = allSongs[id];
        const li = document.createElement('li');
        li.className = "song-item";
        li.innerHTML = `
            <div class="song-info">
                <b>${song.name}</b> <br>
                <small>By: ${song.user}</small>
            </div>
            <div class="actions">
                <button class="play-btn" onclick="playNow('${song.url}', '${song.name}')">▶ Play</button>
                <button class="del-btn" style="background:#ff4444; margin-left:10px;" onclick="deleteSong('${id}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    }
});

// 5. Smart Play Logic (Google Drive Bypass)
function playNow(rawUrl, name) {
    const player = document.getElementById('main-player');
    const title = document.getElementById('playing-now');
    
    // Google Drive ID nikalne ka regex
    const match = rawUrl.match(/[-\w]{25,}/);
    
    if (match) {
        const fileId = match[0];
        
        // Method 1: UC Export (Sabse tez)
        const method1 = `https://docs.google.com/uc?export=open&id=${fileId}`;
        // Method 2: Direct Stream (Bypass link)
        const method2 = `https://drive.google.com/uc?id=${fileId}&export=download`;
        
        player.pause();
        player.src = method1; 
        player.load();
        
        title.innerText = "Connecting... " + name;

        // Play koshish karein
        let playPromise = player.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                title.innerText = "Playing: " + name;
            }).catch(error => {
                console.log("Method 1 failed, trying Method 2...");
                // Agar Method 1 fail ho (403 Error), toh Method 2 try karein
                player.src = method2;
                player.play().then(() => {
                    title.innerText = "Playing (Bypass Mode): " + name;
                }).catch(err => {
                    title.innerText = "⚠️ Error: Drive Permission Issue!";
                    console.error("All play methods failed.");
                });
            });
        }
    } else {
        alert("Bhai, ye Google Drive ka link nahi lag raha. Check karein!");
    }
}

// 6. Category Filter (Optional support)
function showCat(cat) {
    const list = document.getElementById('playlist');
    list.innerHTML = "";
    for (let id in allSongs) {
        if (cat === 'all' || allSongs[id].user === cat) {
            const song = allSongs[id];
            list.innerHTML += `
                <li class="song-item">
                    <div class="song-info"><b>${song.name}</b><br><small>${song.user}</small></div>
                    <div class="actions">
                        <button class="play-btn" onclick="playNow('${song.url}', '${song.name}')">▶ Play</button>
                        <button class="del-btn" style="background:#ff4444; margin-left:10px;" onclick="deleteSong('${id}')">🗑️</button>
                    </div>
                </li>`;
        }
    }
}
