// ========== 支点森林 - 双人共享版 ==========

// 数据定义
let entries = { root: [], trunk: [], branch: [] };
let diaries = [];
let currentDay = 1;
let animating = { root: false, trunk: false, branch: false, growth: false };

// 用户系统
let currentUser = 'user1'; // 'user1' 或 'user2'
const users = {
    user1: { name: '👤 园丁一', color: '#3c763c', avatar: '🌱' },
    user2: { name: '👤 园丁二', color: '#763c76', avatar: '🌸' }
};

// 共享数据
let sharedData = {
    user1: { entries: { root: [], trunk: [], branch: [] }, diaries: [], currentDay: 1 },
    user2: { entries: { root: [], trunk: [], branch: [] }, diaries: [], currentDay: 1 },
    lastSync: null
};

// 当前用户数据引用
let userEntries = entries;
let userDiaries = diaries;
let userCurrentDay = currentDay;

// 生长阶段定义
const GROWTH_STAGES = {
    SEEDLING: { name: '幼苗期', minEnergy: 0, maxEnergy: 50, color: '#8b6b4d', leafColor: '#7cb342', flower: false, fruit: false },
    YOUTH: { name: '青年期', minEnergy: 51, maxEnergy: 250, color: '#8b5a2b', leafColor: '#4caf50', flower: true, fruit: false, flowerColor: '#ffb74d' },
    MATURE: { name: '壮年期', minEnergy: 251, maxEnergy: 500, color: '#6b4e3a', leafColor: '#2e7d32', flower: true, fruit: false, flowerColor: '#ff9800' },
    HARVEST: { name: '成熟期', minEnergy: 501, maxEnergy: 800, color: '#5d4037', leafColor: '#1b5e20', flower: false, fruit: true, fruitColor: '#f44336' },
    RIPEN: { name: '收获期', minEnergy: 801, maxEnergy: 1000, color: '#4e342e', leafColor: '#004d40', flower: false, fruit: true, fruitColor: '#ff5722' }
};

// DOM元素
const canvas = document.getElementById('treeCanvas');
const ctx = canvas?.getContext('2d');

// ========== 用户切换功能 ==========
window.switchUser = function(userId) {
    // 保存当前用户数据
    saveCurrentUserData();
    
    // 切换用户
    currentUser = userId;
    
    // 加载新用户数据
    loadUserData(userId);
    
    // 更新UI
    updateUserInterface();
    renderAll();
    
    console.log(`👤 切换到: ${users[userId].name}`);
};

function saveCurrentUserData() {
    sharedData[currentUser] = {
        entries: JSON.parse(JSON.stringify(entries)),
        diaries: JSON.parse(JSON.stringify(diaries)),
        currentDay: currentDay
    };
}

function loadUserData(userId) {
    const data = sharedData[userId] || { entries: { root: [], trunk: [], branch: [] }, diaries: [], currentDay: 1 };
    entries = data.entries;
    diaries = data.diaries;
    currentDay = data.currentDay;
    
    // 更新引用
    userEntries = entries;
    userDiaries = diaries;
    userCurrentDay = currentDay;
}

function updateUserInterface() {
    // 更新用户指示器
    const userIndicator = document.getElementById('currentUserIndicator');
    if (userIndicator) {
        userIndicator.innerHTML = `${users[currentUser].avatar} ${users[currentUser].name}`;
        userIndicator.style.color = users[currentUser].color;
    }
    
    // 更新按钮状态
    const userBtns = document.querySelectorAll('.user-btn');
    userBtns.forEach(btn => {
        if (btn.dataset.user === currentUser) {
            btn.classList.add('active');
            btn.style.background = users[currentUser].color;
            btn.style.color = 'white';
        } else {
            btn.classList.remove('active');
            btn.style.background = '#e0ecc0';
            btn.style.color = '#2a4a2a';
        }
    });
}

// ========== 共享功能 ==========
window.shareToday = function() {
    if (entries.root.length === 0 && entries.trunk.length === 0 && entries.branch.length === 0) {
        alert('今天还没有记录任何培育行动，无法分享');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const totalEnergy = calculateTotalEnergy();
    
    // 创建分享内容
    const shareContent = {
        fromUser: currentUser,
        fromUserName: users[currentUser].name,
        date: today,
        day: currentDay,
        root: [...entries.root],
        trunk: [...entries.trunk],
        branch: [...entries.branch],
        totalEnergy: totalEnergy,
        message: document.getElementById('shareMessage')?.value || '一起来养树吧！'
    };
    
    // 保存到分享历史
    saveShareHistory(shareContent);
    
    // 生成分享链接/代码
    const shareCode = generateShareCode(shareContent);
    
    // 显示分享弹窗
    showShareModal(shareCode, shareContent);
    
    console.log('📤 分享内容:', shareContent);
};

function generateShareCode(content) {
    // 将内容转换为字符串并编码
    const contentStr = JSON.stringify(content);
    return btoa(encodeURIComponent(contentStr));
}

window.importShare = function() {
    const shareCode = document.getElementById('shareCodeInput')?.value;
    if (!shareCode) {
        alert('请输入分享码');
        return;
    }
    
    try {
        // 解码分享码
        const contentStr = decodeURIComponent(atob(shareCode));
        const shareContent = JSON.parse(contentStr);
        
        // 询问是否导入
        if (confirm(`是否导入 ${shareContent.fromUserName} 分享的养树日记？\n日期: ${shareContent.date}\n能量: ${shareContent.totalEnergy}`)) {
            // 保存当前用户数据
            saveCurrentUserData();
            
            // 切换到另一个用户或创建新用户
            const importUser = 'user2'; // 默认导入到园丁二
            if (currentUser === importUser) {
                // 如果当前已经是园丁二，先保存
                saveCurrentUserData();
            }
            
            // 加载分享数据到指定用户
            sharedData[importUser] = {
                entries: {
                    root: shareContent.root || [],
                    trunk: shareContent.trunk || [],
                    branch: shareContent.branch || []
                },
                diaries: [{
                    date: shareContent.date,
                    day: shareContent.day,
                    root: shareContent.root || [],
                    trunk: shareContent.trunk || [],
                    branch: shareContent.branch || [],
                    totalEnergy: shareContent.totalEnergy,
                    sharedBy: shareContent.fromUserName
                }],
                currentDay: shareContent.day + 1
            };
            
            // 切换到该用户
            switchUser(importUser);
            
            alert('✅ 导入成功！');
        }
    } catch (e) {
        console.error('❌ 导入失败:', e);
        alert('导入失败，请检查分享码是否正确');
    }
};

function saveShareHistory(content) {
    let shareHistory = JSON.parse(localStorage.getItem('forestShareHistory') || '[]');
    shareHistory.unshift({
        ...content,
        timestamp: new Date().toISOString()
    });
    // 只保留最近20条
    if (shareHistory.length > 20) shareHistory.pop();
    localStorage.setItem('forestShareHistory', JSON.stringify(shareHistory));
}

function showShareModal(shareCode, content) {
    const modal = document.getElementById('shareModal');
    const codeDisplay = document.getElementById('shareCodeDisplay');
    const contentDisplay = document.getElementById('shareContentDisplay');
    
    if (!modal || !codeDisplay || !contentDisplay) return;
    
    codeDisplay.value = shareCode;
    
    let html = `
        <div style="background: #f0f7e8; padding: 15px; border-radius: 20px;">
            <p><strong>${content.fromUserName}</strong> 分享了今天的养树日记</p>
            <p>📅 第 ${content.day} 天 · ${content.date}</p>
            <p>⚡ 总能量: ${content.totalEnergy}</p>
            <p>💬 留言: ${content.message}</p>
        </div>
    `;
    
    contentDisplay.innerHTML = html;
    modal.style.display = 'flex';
}

window.closeShareModal = function() {
    document.getElementById('shareModal').style.display = 'none';
};

window.copyShareCode = function() {
    const codeInput = document.getElementById('shareCodeDisplay');
    codeInput.select();
    document.execCommand('copy');
    alert('✅ 分享码已复制到剪贴板');
};

// ========== 超级简单的存储函数 ==========
function saveAll() {
    try {
        // 先保存当前用户数据
        saveCurrentUserData();
        
        // 保存所有共享数据
        localStorage.setItem('forestSharedData', JSON.stringify(sharedData));
        localStorage.setItem('forestCurrentUser', currentUser);
        
        console.log('✅ 保存成功:', {
            user: currentUser,
            entries: entries,
            diaries: diaries.length + '篇',
            day: currentDay
        });
        
        updateDebugPanel();
        return true;
    } catch (e) {
        console.error('❌ 保存失败:', e);
        return false;
    }
}

function loadAll() {
    try {
        // 加载共享数据
        const savedSharedData = localStorage.getItem('forestSharedData');
        const savedCurrentUser = localStorage.getItem('forestCurrentUser');
        
        if (savedSharedData) {
            sharedData = JSON.parse(savedSharedData);
        }
        
        // 设置当前用户
        if (savedCurrentUser && sharedData[savedCurrentUser]) {
            currentUser = savedCurrentUser;
        }
        
        // 加载当前用户数据
        loadUserData(currentUser);
        
        updateUserInterface();
        renderAll();
        updateDebugPanel();
    } catch (e) {
        console.error('❌ 加载失败:', e);
        resetToDefault();
    }
}

function resetToDefault() {
    entries = { root: [], trunk: [], branch: [] };
    diaries = [];
    currentDay = 1;
    sharedData = {
        user1: { entries: { root: [], trunk: [], branch: [] }, diaries: [], currentDay: 1 },
        user2: { entries: { root: [], trunk: [], branch: [] }, diaries: [], currentDay: 1 },
        lastSync: null
    };
    currentUser = 'user1';
    loadUserData('user1');
    updateUserInterface();
    renderAll();
}

// ========== 调试面板 ==========
function updateDebugPanel() {
    const debug = document.getElementById('debugContent');
    if (!debug) return;
    
    try {
        const totalEnergy = calculateTotalEnergy();
        const stage = getGrowthStage(totalEnergy);
        const otherUser = currentUser === 'user1' ? 'user2' : 'user1';
        const otherData = sharedData[otherUser] || { entries: { root: [], trunk: [] }, currentDay: 1 };
        
        debug.innerHTML = `
            📊 当前状态:<br>
            ${users[currentUser].avatar} ${users[currentUser].name}<br>
            天数: ${currentDay}<br>
            总能量: ${totalEnergy}<br>
            阶段: ${stage.name}<br>
            日记: ${diaries.length}篇<br>
            <hr style="border-color:#555; margin:5px 0;">
            ${users[otherUser].avatar} ${users[otherUser].name}<br>
            天数: ${otherData.currentDay || 1}<br>
            条目: 根${otherData.entries?.root?.length || 0} 
                  干${otherData.entries?.trunk?.length || 0} 
                  叶${otherData.entries?.branch?.length || 0}<br>
            <hr style="border-color:#555; margin:5px 0;">
            <span style="color: #0f0">✅ 共享模式已开启</span>
        `;
    } catch (e) {
        debug.innerHTML = '❌ 错误: ' + e.message;
    }
}

// ========== 调试函数 ==========
window.debugClear = function() {
    if (confirm('确定清除所有用户的数据？')) {
        localStorage.clear();
        resetToDefault();
        alert('已清除所有数据');
    }
};

window.debugShow = function() {
    console.log('=== 当前数据 ===');
    console.log('当前用户:', currentUser, users[currentUser].name);
    console.log('entries:', entries);
    console.log('diaries:', diaries);
    console.log('currentDay:', currentDay);
    console.log('共享数据:', sharedData);
    alert('数据已输出到控制台，请按F12查看');
};

// ========== 单条清除功能 ==========
window.deleteEntry = function(type, index) {
    if (confirm('确定删除这条记录吗？')) {
        entries[type].splice(index, 1);
        renderAll();
        saveAll();
    }
};

// ========== UI渲染 ==========
function renderAll() {
    const userColor = users[currentUser].color;
    
    // 根系
    const rootList = document.getElementById('rootEntries');
    if (rootList) {
        rootList.innerHTML = '';
        entries.root.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'entry-item';
            div.style.borderLeft = `3px solid ${userColor}`;
            div.innerHTML = `
                <span class="entry-text">${item.text || ''}</span>
                <span class="entry-energy">${'💧'.repeat(item.energy || 1)}</span>
                <button class="entry-delete" onclick="deleteEntry('root', ${index})">✕</button>
            `;
            rootList.appendChild(div);
        });
    }

    // 主干
    const trunkList = document.getElementById('trunkEntries');
    if (trunkList) {
        trunkList.innerHTML = '';
        entries.trunk.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'entry-item';
            div.style.borderLeft = `3px solid ${userColor}`;
            div.innerHTML = `
                <span class="entry-text">${item.text || ''}</span>
                <span class="entry-energy">${'☀️'.repeat(item.energy || 1)}</span>
                <button class="entry-delete" onclick="deleteEntry('trunk', ${index})">✕</button>
            `;
            trunkList.appendChild(div);
        });
    }

    // 枝叶
    const branchList = document.getElementById('branchEntries');
    if (branchList) {
        branchList.innerHTML = '';
        entries.branch.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'entry-item';
            div.style.borderLeft = `3px solid ${userColor}`;
            div.innerHTML = `
                <span class="entry-text">${item.text || ''}</span>
                <span class="entry-energy">${'🍂'.repeat(item.energy || 1)}</span>
                <button class="entry-delete" onclick="deleteEntry('branch', ${index})">✕</button>
            `;
            branchList.appendChild(div);
        });
    }

    updateCounters();
    drawTree();
}

function updateCounters() {
    const daySpan = document.getElementById('dayNumber');
    if (daySpan) daySpan.textContent = currentDay;
    
    const rootTotal = entries.root.reduce((s, i) => s + (i.energy || 0), 0);
    const trunkTotal = entries.trunk.reduce((s, i) => s + (i.energy || 0), 0);
    const branchTotal = entries.branch.reduce((s, i) => s + (i.energy || 0), 0);
    const totalEnergy = calculateTotalEnergy();
    const stage = getGrowthStage(totalEnergy);
    
    const energyEl = document.getElementById('energyTotal');
    if (energyEl) {
        energyEl.innerHTML = `${users[currentUser].avatar} 根:${Math.min(rootTotal, 100)} | 干:${Math.min(trunkTotal, 100)} | 叶:${Math.min(branchTotal, 100)} | ${stage.name}`;
    }
    
    const preview = document.getElementById('previewContent');
    if (preview) {
        const totalEntries = entries.root.length + entries.trunk.length + entries.branch.length;
        if (totalEntries > 0) {
            preview.innerHTML = `今天已记录 ${totalEntries} 件小事 · 总能量 ${totalEnergy} · ${stage.name}`;
        } else {
            preview.innerHTML = '还没有记录今天的培育... 添加一些滋养行动吧！';
        }
    }
}

// ========== 计算总能量 ==========
function calculateTotalEnergy() {
    const todayEnergy = entries.root.reduce((s,i)=>s+(i.energy||0),0) + 
                       entries.trunk.reduce((s,i)=>s+(i.energy||0),0) + 
                       entries.branch.reduce((s,i)=>s+(i.energy||0),0);
    
    const historyEnergy = diaries.reduce((total, diary) => {
        return total + (diary.totalEnergy || 0);
    }, 0);
    
    return todayEnergy + historyEnergy;
}

// ========== 获取生长阶段 ==========
function getGrowthStage(totalEnergy) {
    if (totalEnergy <= 50) return GROWTH_STAGES.SEEDLING;
    if (totalEnergy <= 250) return GROWTH_STAGES.YOUTH;
    if (totalEnergy <= 500) return GROWTH_STAGES.MATURE;
    if (totalEnergy <= 800) return GROWTH_STAGES.HARVEST;
    return GROWTH_STAGES.RIPEN;
}

// ========== 添加条目 ==========
window.addEntry = function(type) {
    const input = document.getElementById(type + 'Input');
    const select = document.getElementById(type + 'Energy');
    
    const text = input.value.trim();
    if (!text) {
        alert('请输入内容');
        return;
    }
    
    entries[type].push({
        text: text,
        energy: parseInt(select.value) || 1,
        user: currentUser,
        userName: users[currentUser].name
    });
    
    // 动画
    animating[type] = true;
    
    setTimeout(() => {
        animating[type] = false;
        drawTree();
    }, 2500);
    
    input.value = '';
    renderAll();
    saveAll();
};

// ========== 完成今日培育 ==========
window.completeToday = function() {
    if (entries.root.length === 0 && entries.trunk.length === 0 && entries.branch.length === 0) {
        alert('今天还没有记录任何培育行动哦');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const totalEnergy = calculateTotalEnergy();
    
    const newDiary = {
        date: today,
        day: currentDay,
        root: [...entries.root],
        trunk: [...entries.trunk],
        branch: [...entries.branch],
        totalEnergy: totalEnergy,
        user: currentUser,
        userName: users[currentUser].name
    };
    
    diaries.unshift(newDiary);
    currentDay++;
    entries = { root: [], trunk: [], branch: [] };
    
    // 生长动画
    animating.growth = true;
    renderAll();
    
    setTimeout(() => {
        animating.growth = false;
        drawTree();
        saveAll();
    }, 3000);
    
    const newTotalEnergy = calculateTotalEnergy();
    const stage = getGrowthStage(newTotalEnergy);
    alert(`🌳 第 ${currentDay-1} 天的培育已完成！\n总能量: ${newTotalEnergy}\n生长阶段: ${stage.name}`);
};

// ========== 绘制树 ==========
function drawTree() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const totalEnergy = calculateTotalEnergy();
    const stage = getGrowthStage(totalEnergy);
    
    // 计算生长因子 (0-1)
    const growthFactor = Math.min(totalEnergy / 1000, 1);
    
    const rootTotal = Math.min(entries.root.reduce((s,i)=>s + (i.energy || 0), 0), 100);
    const trunkTotal = Math.min(entries.trunk.reduce((s,i)=>s + (i.energy || 0), 0), 100);
    const branchTotal = Math.min(entries.branch.reduce((s,i)=>s + (i.energy || 0), 0), 100);
    
    // 舒缓的动画效果
    let rootAnim = 1;
    let trunkAnim = 1;
    let branchAnim = 1;
    let growthAnim = 1;
    
    if (animating.root) {
        const progress = (Date.now() % 2500) / 2500;
        rootAnim = 1 + Math.sin(progress * Math.PI) * 0.15;
    }
    
    if (animating.trunk) {
        const progress = (Date.now() % 2500) / 2500;
        trunkAnim = 1 + Math.sin(progress * Math.PI) * 0.1;
    }
    
    if (animating.branch) {
        const progress = (Date.now() % 2500) / 2500;
        branchAnim = 1 + Math.sin(progress * Math.PI) * 0.08;
    }
    
    if (animating.growth) {
        const progress = Math.min((Date.now() % 3000) / 3000, 1);
        growthAnim = 1 + Math.sin(progress * Math.PI) * 0.05;
    }
    
    // 草地
    ctx.fillStyle = '#a7d18c';
    ctx.fillRect(0, canvas.height-40, canvas.width, 40);
    
    // 画一些草叶
    ctx.strokeStyle = '#5d8c4d';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
        const x = 20 + i * 30;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height-40);
        ctx.quadraticCurveTo(x-5, canvas.height-55, x+5, canvas.height-60);
        ctx.strokeStyle = '#4caf50';
        ctx.stroke();
    }
    
    const baseX = 200;
    const baseY = canvas.height - 40;
    
    // 绘制根系
    ctx.save();
    const rootCount = 8 + Math.floor(rootTotal * 0.5 * rootAnim) + Math.floor(growthFactor * 5);
    
    for (let i = 0; i < rootCount; i++) {
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        
        const angle = (i / rootCount - 0.5) * 1.8;
        const length = 25 + 30 * growthFactor + 15 * (rootAnim - 1) * 2;
        
        const cpX = baseX + Math.sin(angle) * length * 0.5;
        const cpY = baseY + 10 + Math.cos(angle) * length * 0.3;
        const endX = baseX + Math.sin(angle) * length;
        const endY = baseY + 15 + Math.cos(angle) * length * 0.5;
        
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        
        const gradient = ctx.createLinearGradient(baseX, baseY, endX, endY);
        gradient.addColorStop(0, '#7c5e46');
        gradient.addColorStop(1, '#a67c52');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + Math.random() * 2;
        ctx.stroke();
    }
    ctx.restore();
    
    // 绘制主干
    ctx.save();
    ctx.translate(baseX, baseY);
    
    const trunkHeight = (140 + 50 * growthFactor) * (1 + (trunkAnim - 1) * 0.5);
    const trunkWidth = (20 + 10 * growthFactor) * trunkAnim;
    
    // 主干轮廓 (有弧度)
    ctx.beginPath();
    ctx.moveTo(-trunkWidth/2, 0);
    ctx.quadraticCurveTo(
        -trunkWidth/3, -trunkHeight/2,
        -trunkWidth/4, -trunkHeight
    );
    ctx.lineTo(trunkWidth/4, -trunkHeight);
    ctx.quadraticCurveTo(
        trunkWidth/3, -trunkHeight/2,
        trunkWidth/2, 0
    );
    ctx.closePath();
    
    // 树干填充 - 使用用户颜色
    const gradient = ctx.createLinearGradient(-trunkWidth/2, 0, trunkWidth/2, -trunkHeight);
    gradient.addColorStop(0, users[currentUser].color);
    gradient.addColorStop(1, '#c49a6c');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#5d3e2e';
    ctx.shadowBlur = 8;
    ctx.fill();
    
    // 树干纹理
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = -trunkHeight * (0.2 + i * 0.15);
        ctx.beginPath();
        ctx.moveTo(-trunkWidth/4, y);
        ctx.lineTo(trunkWidth/4, y - 8);
        ctx.strokeStyle = '#8b5a2b';
        ctx.stroke();
    }
    ctx.restore();
    
    // 绘制树枝
    ctx.save();
    ctx.translate(baseX, baseY - trunkHeight * 0.8);
    
    const mainBranches = 4 + Math.floor(growthFactor * 4);
    
    for (let i = 0; i < mainBranches; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const baseAngle = side * (0.3 + i * 0.2);
        const branchY = -trunkHeight * 0.1 * Math.floor(i/2);
        
        ctx.save();
        ctx.translate(side * 8, branchY);
        
        const branchLength = 35 + 25 * growthFactor * branchAnim;
        const branchAngle = baseAngle + (side * 0.2);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        const cpX = Math.cos(branchAngle) * branchLength * 0.4;
        const cpY = Math.sin(branchAngle) * branchLength * 0.3 - 5;
        const endX = Math.cos(branchAngle) * branchLength;
        const endY = Math.sin(branchAngle) * branchLength * 0.5 - 15;
        
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 4 - i * 0.5;
        ctx.stroke();
        
        ctx.restore();
    }
    ctx.restore();
    
    // 绘制树叶
    ctx.save();
    ctx.translate(baseX, baseY - trunkHeight * 0.8);
    ctx.shadowColor = '#2d5a2d';
    ctx.shadowBlur = 10;
    
    const leafCount = 20 + Math.floor(branchTotal * 1.5 * branchAnim) + Math.floor(growthFactor * 30);
    
    for (let i = 0; i < leafCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + 40 * growthFactor + Math.random() * 30;
        const x = Math.cos(angle) * radius * (0.7 + Math.random() * 0.3);
        const y = Math.sin(angle) * radius * 0.6 - 20 + Math.random() * 30;
        
        const leafSize = 6 + 6 * growthFactor + Math.random() * 4;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.random() * Math.PI);
        
        const gradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, leafSize);
        gradient.addColorStop(0, '#8bc34a');
        gradient.addColorStop(0.7, stage.leafColor);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, leafSize/2, leafSize, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // 根据用户添加装饰
    if (currentUser === 'user1') {
        // 园丁一的树有星星装饰
        for (let i = 0; i < 3; i++) {
            const x = -30 + i * 30;
            const y = -40 + i * 10;
            drawStar(x, y, '#ffd700');
        }
    } else {
        // 园丁二的树有爱心装饰
        for (let i = 0; i < 3; i++) {
            const x = -30 + i * 30;
            const y = -40 + i * 10;
            drawHeart(x, y, '#ff69b4');
        }
    }
    
    ctx.restore();
    
    // 天数
    ctx.font = 'bold 14px system-ui';
    ctx.fillStyle = '#2d5a2d';
    ctx.shadowBlur = 0;
    ctx.fillText(`${users[currentUser].avatar} 第 ${currentDay} 天 · ${stage.name}`, 20, 40);
}

// 绘制星星
function drawStar(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5;
        const outerX = Math.cos(angle) * 6;
        const outerY = Math.sin(angle) * 6;
        ctx.lineTo(outerX, outerY);
        
        const innerAngle = angle + Math.PI / 5;
        const innerX = Math.cos(innerAngle) * 3;
        const innerY = Math.sin(innerAngle) * 3;
        ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// 绘制爱心
function drawHeart(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-5, 0, -8, -3, 0, -8);
    ctx.bezierCurveTo(8, -3, 5, 0, 0, 5);
    ctx.fill();
    ctx.restore();
}

// ========== 弹窗函数 ==========
window.showDetail = function(type) {
    const modal = document.getElementById('detailModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    if (!modal || !title || !body) return;
    
    const typeNames = { root: '根系', trunk: '主干', branch: '枝叶' };
    const typeIcons = { root: '🌱', trunk: '🌲', branch: '🍃' };
    title.innerHTML = `${users[currentUser].avatar} ${typeIcons[type]} ${typeNames[type]} 详情`;
    
    let html = '<div class="detail-list">';
    
    if (entries[type].length > 0) {
        html += '<h3 style="color:#2d5a2d;">📅 今天</h3>';
        entries[type].forEach(item => {
            const icon = type === 'root' ? '💧' : (type === 'trunk' ? '☀️' : '🍂');
            html += `
                <div class="detail-item" style="border-left-color: ${users[item.user || currentUser].color}">
                    <div class="detail-text">${item.text || ''}</div>
                    <div class="detail-energy">能量: ${icon.repeat(item.energy || 1)} ${item.userName ? '· ' + item.userName : ''}</div>
                </div>
            `;
        });
    }
    
    const history = [];
    diaries.forEach(d => {
        if (d[type]) {
            d[type].forEach(item => {
                history.push({ ...item, date: d.date, day: d.day, userName: d.userName });
            });
        }
    });
    
    if (history.length > 0) {
        html += '<h3 style="color:#2d5a2d; margin-top:20px;">📚 历史记录</h3>';
        history.reverse().forEach(item => {
            const icon = type === 'root' ? '💧' : (type === 'trunk' ? '☀️' : '🍂');
            html += `
                <div class="detail-item" style="border-left-color: ${users[item.user || 'user1'].color}">
                    <div class="detail-date">第 ${item.day} 天 · ${item.date}</div>
                    <div class="detail-text">${item.text || ''}</div>
                    <div class="detail-energy">能量: ${icon.repeat(item.energy || 1)} ${item.userName ? '· ' + item.userName : ''}</div>
                </div>
            `;
        });
    }
    
    if (entries[type].length === 0 && history.length === 0) {
        html += '<p style="color:#5b7a5b;">还没有记录</p>';
    }
    
    html += '</div>';
    body.innerHTML = html;
    modal.style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('detailModal').style.display = 'none';
};

window.showDiary = function() {
    const modal = document.getElementById('diaryModal');
    const body = document.getElementById('diaryBody');
    
    if (!modal || !body) return;
    
    let html = '';
    
    if (entries.root.length + entries.trunk.length + entries.branch.length > 0) {
        const total = entries.root.reduce((s,i)=>s+(i.energy||0),0) + 
                     entries.trunk.reduce((s,i)=>s+(i.energy||0),0) + 
                     entries.branch.reduce((s,i)=>s+(i.energy||0),0);
        
        html += '<div class="diary-entry" style="border-left:5px solid ' + users[currentUser].color + ';">';
        html += `<div class="diary-date">${users[currentUser].avatar} 第 ${currentDay} 天 · 今天</div>`;
        html += '<div class="diary-content">';
        entries.root.forEach(e => html += `🌱 ${e.text} (+${e.energy}💧)<br>`);
        entries.trunk.forEach(e => html += `🌲 ${e.text} (+${e.energy}☀️)<br>`);
        entries.branch.forEach(e => html += `🍃 ${e.text} (+${e.energy}🍂)<br>`);
        html += '</div>';
        html += `<div class="diary-stats">今日总能量: ${total}</div>`;
        html += '</div>';
    }
    
    if (diaries.length > 0) {
        diaries.forEach(d => {
            const total = d.totalEnergy || 0;
            const userColor = users[d.user || 'user1'].color;
            const userAvatar = users[d.user || 'user1'].avatar;
            
            html += '<div class="diary-entry" style="border-left:5px solid ' + userColor + ';">';
            html += `<div class="diary-date">${userAvatar} 第 ${d.day} 天 · ${d.date}</div>`;
            html += '<div class="diary-content">';
            
            if (d.root) d.root.forEach(e => html += `🌱 ${e.text} (+${e.energy}💧)<br>`);
            if (d.trunk) d.trunk.forEach(e => html += `🌲 ${e.text} (+${e.energy}☀️)<br>`);
            if (d.branch) d.branch.forEach(e => html += `🍃 ${e.text} (+${e.energy}🍂)<br>`);
            
            html += '</div>';
            html += `<div class="diary-stats">总能量: ${total}</div>`;
            html += '</div>';
        });
    }
    
    if (diaries.length === 0 && entries.root.length + entries.trunk.length + entries.branch.length === 0) {
        html = '<p style="color:#5b7a5b; text-align:center;">还没有日记</p>';
    }
    
    body.innerHTML = html;
    modal.style.display = 'flex';
};

window.closeDiary = function() {
    document.getElementById('diaryModal').style.display = 'none';
};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 页面加载完成 - 双人共享版');
    
    // 添加用户切换按钮到DOM
    addUserSwitchButtons();
    
    // 添加分享按钮到DOM
    addShareButtons();
    
    // 加载数据
    loadAll();
    
    // 绑定按钮
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.onclick = function(e) {
            e.preventDefault();
            window.completeToday();
        };
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.onclick = function(e) {
            e.preventDefault();
            if (confirm('确定要清空今天的记录吗？')) {
                entries = { root: [], trunk: [], branch: [] };
                renderAll();
                saveAll();
            }
        };
    }
    
    if (canvas) {
        canvas.onclick = window.showDiary;
    }
    
    function animate() {
        if (animating.root || animating.trunk || animating.branch || animating.growth) {
            drawTree();
        }
        requestAnimationFrame(animate);
    }
    animate();
});

// 添加用户切换按钮
function addUserSwitchButtons() {
    const container = document.querySelector('.day-counter');
    if (!container) return;
    
    const userDiv = document.createElement('div');
    userDiv.style.display = 'flex';
    userDiv.style.gap = '10px';
    userDiv.style.alignItems = 'center';
    userDiv.style.marginLeft = 'auto';
    
    userDiv.innerHTML = `
        <button class="user-btn" data-user="user1" onclick="switchUser('user1')" style="padding:8px 20px; border:none; border-radius:30px; background:#3c763c; color:white; cursor:pointer; font-weight:bold;">🌱 园丁一</button>
        <button class="user-btn" data-user="user2" onclick="switchUser('user2')" style="padding:8px 20px; border:none; border-radius:30px; background:#e0ecc0; color:#2a4a2a; cursor:pointer; font-weight:bold;">🌸 园丁二</button>
        <span id="currentUserIndicator" style="margin-left:10px; padding:8px 15px; background:white; border-radius:30px; font-weight:bold;">🌱 园丁一</span>
    `;
    
    container.appendChild(userDiv);
}

// 添加分享按钮
function addShareButtons() {
    const container = document.querySelector('.canvas-container');
    if (!container) return;
    
    const shareDiv = document.createElement('div');
    shareDiv.style.marginTop = '15px';
    shareDiv.style.display = 'flex';
    shareDiv.style.gap = '10px';
    shareDiv.style.justifyContent = 'center';
    shareDiv.style.width = '100%';
    
    shareDiv.innerHTML = `
        <button onclick="shareToday()" style="padding:10px 20px; border:none; border-radius:30px; background:#4a6ea8; color:white; cursor:pointer; font-weight:bold; flex:1;">📤 分享今天</button>
        <button onclick="showImportModal()" style="padding:10px 20px; border:none; border-radius:30px; background:#9b59b6; color:white; cursor:pointer; font-weight:bold; flex:1;">📥 导入分享</button>
    `;
    
    container.appendChild(shareDiv);
    
    // 添加分享弹窗
    addShareModal();
}

// 添加分享弹窗
function addShareModal() {
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h2>📤 分享养树日记</h2>
                <button class="close-btn" onclick="closeShareModal()">✕</button>
            </div>
            <div class="modal-body">
                <div id="shareContentDisplay" style="margin-bottom:20px;"></div>
                
                <div style="margin:20px 0;">
                    <label style="font-weight:bold; color:#2d5a2d;">分享码：</label>
                    <div style="display:flex; gap:10px; margin-top:5px;">
                        <input id="shareCodeDisplay" type="text" readonly style="flex:1; padding:10px; border:2px solid #b8d4a0; border-radius:30px; background:#f5fae8; font-family:monospace;">
                        <button onclick="copyShareCode()" style="padding:10px 20px; border:none; border-radius:30px; background:#3c763c; color:white; cursor:pointer;">复制</button>
                    </div>
                </div>
                
                <div style="margin:20px 0;">
                    <label style="font-weight:bold; color:#2d5a2d;">留言：</label>
                    <textarea id="shareMessage" placeholder="写一句分享语..." style="width:100%; padding:10px; border:2px solid #b8d4a0; border-radius:20px; margin-top:5px;" rows="2"></textarea>
                </div>
                
                <p style="color:#5b7a5b; font-size:0.9rem;">✨ 将分享码发给朋友，他们可以导入你的养树日记</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加导入弹窗
    const importModal = document.createElement('div');
    importModal.id = 'importModal';
    importModal.className = 'modal';
    importModal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h2>📥 导入分享</h2>
                <button class="close-btn" onclick="closeImportModal()">✕</button>
            </div>
            <div class="modal-body">
                <div style="margin:20px 0;">
                    <label style="font-weight:bold; color:#2d5a2d;">请输入分享码：</label>
                    <input id="shareCodeInput" type="text" style="width:100%; padding:10px; border:2px solid #b8d4a0; border-radius:30px; margin-top:5px;" placeholder="粘贴分享码...">
                </div>
                
                <button onclick="importShare()" style="width:100%; padding:12px; border:none; border-radius:30px; background:#9b59b6; color:white; cursor:pointer; font-weight:bold;">📥 导入</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(importModal);
}

window.showImportModal = function() {
    document.getElementById('importModal').style.display = 'flex';
};

window.closeImportModal = function() {
    document.getElementById('importModal').style.display = 'none';
};