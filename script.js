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
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

// --- 1. Real-time Listen (Data Dikhega) ---
db.ref('collections/Default').on('value', (snapshot) => {
    const songListDiv = document.getElementById('song-list-container');
    songListDiv.innerHTML = ""; // Clear old list
    
    const data = snapshot.val();
    if (!data) {
        songListDiv.innerHTML = "<p style='text-align:center;'>No songs found. Add one!</p>";
        return;
    }

    // Loop through songs
    Object.keys(data).forEach((id) => {
        if (id === "_init") return;
        const song = data[id];
        
        songListDiv.innerHTML += `
            <div class="song-item">
                <div onclick="playSong('${song.url}', '${song.name}')" style="flex:1; cursor:pointer;">
                    <b>${song.name}</b>
                </div>
                <button class="del-btn" onclick="deleteSong('${id}')">DELETE</button>
            </div>
        `;
    });
});

// --- 2. Add Song ---
function addSong() {
    const name = document.getElementById('songName').value;
    const url = document.getElementById('songUrl').value;
    
    if (name && url) {
        db.ref('collections/Default').push({ name: name, url: url })
        .then(() => {
            document.getElementById('songName').value = "";
            document.getElementById('songUrl').value = "";
            alert("Song added successfully!");
        });
    } else {
        alert("Please fill both fields!");
    }
}

// --- 3. Play Song (Sunaai dega) ---
function playSong(url, name) {
    const playerDiv = document.getElementById('player-ui');
    const status = document.getElementById('now-playing');
    
    // Google Drive ID extract
    const fileId = url.match(/[-\w]{25,}/);
    
    if (fileId) {
        status.innerText = "▶ Playing: " + name;
        playerDiv.innerHTML = `
            <iframe src="https://drive.google.com/file/d/${fileId[0]}/preview" 
            width="100%" height="60" style="border:none; border-radius:5px; background:#000;" 
            allow="autoplay"></iframe>`;
    } else {
        alert("Invalid Link! Make sure it's a Google Drive link.");
    }
}

// --- 4. Delete Song ---
function deleteSong(id) {
    if (confirm("Are you sure you want to delete this song?")) {
        db.ref('collections/Default/' + id).remove();
    }
}
