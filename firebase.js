import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    databaseURL: "https://diary-tree-sync-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const stateRef = ref(database, "state");

onValue(stateRef, (snapshot) => { // 数据库参数更新回调
    const data = snapshot.val();
    console.log("state:", data);
});

window.uploadTree = function(){
    const usersTree = JSON.parse(localStorage.getItem('forestSharedData') || '{}')
    console.log("strTree:", localStorage.getItem('forestSharedData'))
    console.log("jsonTree:", usersTree)
    const userTree = usersTree[currentUser] || {}
    const userRef = ref(database, 'state/' + currentUser)
    set(userRef, userTree);
    console.log("uploadTree:", userTree)
    console.log("user:", currentUser)
};

window.downloadTree = async function() { //下载数据，异步处理
    const userRef = ref(database, 'state/' + currentUser)
    const snapshot = await get(userRef);
    const userTree = snapshot.val();

    console.log("downloadTree:", userTree);
    let treeData = JSON.parse(localStorage.getItem('forestSharedData') || '{}')
    treeData[currentUser] = userTree;

    // 补全被firebase吞掉的空列表
    const entries = treeData[currentUser].entries || {};
    entries.root = entries.root || [];
    entries.trunk = entries.trunk || [];
    entries.branch = entries.branch || [];
    treeData[currentUser].entries = entries;

    const diaries = treeData[currentUser].diaries || [];
    treeData[currentUser].diaries = diaries;

    localStorage.setItem('forestSharedData', JSON.stringify(treeData));

    loadAll();
}