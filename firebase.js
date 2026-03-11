import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    databaseURL: "https://diary-tree-sync-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const stateRef = ref(database, "state");

onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    console.log("state:", data);
});

let history = ""

window.setState = function(value){
    history = JSON.parse(localStorage.getItem('forestSharedData') || '[]')
    set(stateRef, {
        value: history
    });
    console.log("setState:", history)
}