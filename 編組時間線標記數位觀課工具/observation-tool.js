let observationStcFlow;
const obsPreferences = ObservationRecovery.preferences("STC");

const MAX_TOTAL_BUTTONS = 24;
const MIN_TOTAL_BUTTONS = 2;
const MAX_GROUPS = 8;
const MAX_BUTTONS_PERGROUP = 24;
const MIN_BUTTONS_PERGROUP = 1;
const GROUP_COLORS = [
    '#6c757d',  // 0: ungrouped
    '#dc3545',  // 1: red
    '#fd7e14',  // 2: orange
    '#ffc107',  // 3: yellow
    '#198754',  // 4: green
    '#20c997',  // 5: teal
    '#0d6efd',  // 6: blue
    '#6610f2',  // 7: indigo
    '#d63384'   // 8: pink
];

let buttonsData = [];
let btn_info = [];
let record_title = [];
let records = [];
let isRunning = false;
let isRecording = false;
let timerInterval = null;
let ticks = 0;
let startTime = null;

var filename = new Date().toLocaleDateString();
document.getElementById("filename").value = filename;

/**
 * 在 id="work_div" 的容器底下動態新增一個按鈕區塊，上限 24 個
 * @param {number} group - 群組編號 (0~8)
 * @param {string} inputValue - 輸入框的初始值 (可為空字串 "")
 */
function inputGen(group, inputValue = "") {
    // 驗證 group 範圍
    if (!Number.isInteger(group) || group < 0 || group > 8) {
        console.error("group 必須是 0 到 8 的整數");
        return;
    }

    // 取得目前已經存在的按鈕數量（計算 .col-12.col-md-6 的數量）
    const workDiv = document.getElementById("work_div");
    if (!workDiv) {
        console.error("找不到 id 為 'work_div' 的元素");
        return;
    }

    const currentGroups = workDiv.querySelectorAll('.col-12.col-md-6');
    const currentCount = currentGroups.length;

    // 上限判定：最多 24 個
    if (currentCount >= MAX_TOTAL_BUTTONS) {
        alert("已達到上限：最多只能新增 24 個按鈕！");
        // 或改成更溫和的提示：console.warn("已達 24 個按鈕上限，無法再新增");
        return;
    }

    // 繼續新增邏輯
    const groupClass = `group-${group}`;
    const labelText = group === 0 ? "Ungrouped" : `Group ${group}`;
    const uniqueId = `floatingInput_${group}_${Date.now()}` + currentCount;

    const newGroupHTML = `
        <div class="col-12 col-md-6 ${groupClass}">
            <div class="row group-row align-items-stretch g-0">
                <div class="col text-white d-flex align-items-center justify-content-center">
                    <div class="form-floating w-100">
                        <input type="text" class="form-control border-3" id="${uniqueId}" placeholder="${labelText}" value="${ObservationRecovery.escape(inputValue)}">
                        <label for="${uniqueId}" class="text-muted">${labelText}</label>
                    </div>
                </div>
                <div class="col-auto icon-group d-flex flex-column bg-light mx-1">
                    <div class="d-flex align-items-center justify-content-center flex-grow-1 p-1">
                        <i class="fa-regular fa-pen-to-square icon-btn align-middle text-dark fs-5"></i>
                    </div>
                    <div class="d-flex align-items-center justify-content-center flex-grow-1 p-1">
                        <i class="fa-regular fa-trash-can icon-btn align-middle text-dark fs-5"></i>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 新增到容器最後面
    workDiv.insertAdjacentHTML('beforeend', newGroupHTML);

    // 可選：新增成功後自動滾動到最下方（提升使用者體驗）
    // workDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
//info modal
function modalControl() {
    // Get the modal
    var modal = document.getElementById('myModal');
    // Get the button that opens the modal
    var btn = document.getElementById("infoButton");
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    // When the user clicks the button, open the modal 
    btn.onclick = function () {
        modal.style.display = "block";
    }
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function inputInitialize() {
    const work_div = document.getElementById('work_div');
    work_div.innerHTML = '';
    if (typeof (Storage) !== "undefined") {
        if (obsPreferences.btn_info) {
            btn_info = [];
            btn_info = JSON.parse(obsPreferences.btn_info);
            for (let i = 0; i < btn_info.length; i++) {
                inputGen(btn_info[i].group, btn_info[i].value);
            }
        } else {
            // 預設新增兩個按鈕
            btn_info = [[0, ""], [0, ""]];
            inputGen(0, "");
            inputGen(0, "");
        }
    }
}

function btnGen() {
    const workDiv = document.getElementById('work_div');
    if (!workDiv) return console.error("找不到 #work_div");

    const btn_div = document.getElementById('btn_div');
    btn_div.innerHTML = '';

    const groupElements = workDiv.querySelectorAll('.col-12.col-md-6');

    btn_info = [];
    buttonsData = [];

    groupElements.forEach((groupEl, index) => {
        const groupClass = Array.from(groupEl.classList).find(c => c.startsWith('group-'));
        let groupNum = 0;

        if (groupClass) {
            const match = groupClass.match(/group-(\d+)/);
            if (match) {
                groupNum = parseInt(match[1]);
                if (groupNum === 0) isUngrouped = true;
            }
        }

        const input = groupEl.querySelector('input');
        const label = groupEl.querySelector('label');

        if (input && label) {
            buttonsData.push({
                groupNum: groupNum,
                //isUngrouped: isUngrouped,
                value: input.value.trim() || label.textContent.trim(),
                //id: input.id,
                uniqueGroupKey: groupNum === 0 ? `ungrouped_${index}` : `group_${groupNum}`
            });
            btn_info.push({
                group: groupNum,
                value: input.value.trim()
            });
            obsPreferences.btn_info = JSON.stringify(btn_info);
        }
    });

    if (buttonsData.length === 0) {
        btn_div.innerHTML = '<p class="text-muted">目前沒有任何群組資料</p>';
        return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'row col-12 col-md-10 col-xxl-8 g-3 mb-4 justify-content-center mx-auto';
    record_data = new Array(buttonsData.length * 2).fill(0).map(() => []);

    buttonsData.forEach((item, buttonIndex) => {
        const col = document.createElement('div');

        let colClass = 'col-12 col-md-6'; // 預設：手機單欄，md 以上 2 欄
        let totalButtons = buttonsData.length;

        if (totalButtons <= 12) {
            colClass = 'col-6 col-md-5';           // 2 欄
        } else if (totalButtons <= 18) {
            colClass = 'col-6 col-md-4';           // 手機 2 欄，md 以上 3 欄
        } else if (totalButtons <= 24) {
            colClass = 'col-6 col-md-3';           // 手機 2 欄，md 以上 4 欄
        }

        col.className = colClass;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn w-100 py-3 fw-medium rounded d-flex align-items-center justify-content-center';
        btn.style.minHeight = '60px'; // 固定高度，讓畫面更整齊

        // 按鈕內容：文字 + 右側勾勾空間
        btn.innerHTML = `
            <span>${ObservationRecovery.escape(item.value || '(空白)')}</span>
            <span class="check-icon ms-2 fs-5 fw-bold" style="visibility: hidden; color: inherit;">✓</span>
        `;

        // 顏色對應（使用你提供的 hex 色碼）
        let colorHex = GROUP_COLORS[item.groupNum] || '#6c757d';

        // 非選中：實心顏色 + 白字
        btn.style.backgroundColor = colorHex;
        btn.style.borderColor = colorHex;
        btn.style.color = 'white';

        btn.dataset.groupKey = item.uniqueGroupKey;
        btn.dataset.groupNum = item.groupNum;
        btn.dataset.recordIndex = buttonIndex;

        // 點擊事件
        btn.addEventListener('click', function () {
            const thisGroupKey = this.dataset.groupKey;
            const isActive = this.classList.contains('active');

            // 1. 先處理同一群組內的「取消」邏輯
            gridContainer.querySelectorAll(`[data-group-key="${thisGroupKey}"]`).forEach(b => {
                if (b.classList.contains('active')) {
                    // 找到該按鈕對應的記錄，並記錄 stop
                    const btnValue = b.querySelector('span:first-child').textContent.trim();
                    const record = records.find(r =>
                        (r.buttonIndex === undefined ? r.group === item.groupNum && r.value === btnValue :
                            r.buttonIndex === Number(b.dataset.recordIndex)) &&
                        r.stop === null
                    );

                    if (record) {
                        record.stop = ticks;  // 記錄停止時間
                    }

                    b.classList.remove('active');
                    b.style.backgroundColor = colorHex;
                    b.style.borderColor = colorHex;
                    b.style.color = 'white';
                    b.querySelector('.check-icon').style.visibility = 'hidden';
                    b.classList.remove('shadow-lg');
                }
            });

            // 2. 如果原本不是 active → 選中並記錄 start
            if (!isActive) {
                this.classList.add('active');
                this.style.backgroundColor = 'white';
                this.style.borderColor = colorHex;
                this.style.color = colorHex;
                this.querySelector('.check-icon').style.visibility = 'visible';
                this.classList.add('shadow-lg');

                // 建立新記錄（start 時間）
                records.push({
                    group: item.groupNum,
                    buttonIndex,
                    value: item.value,
                    start: ticks,
                    stop: null
                });
            }

        });

        col.appendChild(btn);
        gridContainer.appendChild(col);
    });

    btn_div.appendChild(gridContainer);
}

//檢驗input是否有空值
function hasAnyEmptyInput() {
    const workDiv = document.getElementById('work_div');
    return workDiv && Array.from(workDiv.querySelectorAll('input')).some(i => i.value.trim() === '');
}

// 重新排序所有群組 div
function sortGroups() {
    const workDiv = document.getElementById('work_div');
    if (!workDiv) return;

    const groupElements = Array.from(workDiv.querySelectorAll('.col-12.col-md-6'));

    // 排序
    groupElements.sort((a, b) => {
        const aClass = Array.from(a.classList).find(c => c.startsWith('group-'));
        const bClass = Array.from(b.classList).find(c => c.startsWith('group-'));

        return getGroupPriority(aClass) - getGroupPriority(bClass);
    });

    // 清空容器後按新順序重新加入
    workDiv.innerHTML = '';
    groupElements.forEach(el => workDiv.appendChild(el));
}
// 呼叫 sortGroups 的時機點（你可以根據需求呼叫）
function afterGroupChange() {
    sortGroups();
    // 如果你有更新計數顯示，也可以加在這裡
    // updateGroupCount();
}

// 定義排序順序的優先級函式
function getGroupPriority(groupClass) {
    if (groupClass === 'group-0' || groupClass === 'group-no') return 9; // Ungrouped 永遠最後
    const match = groupClass.match(/group-(\d+)/);
    return match ? parseInt(match[1]) : 10; // 未知的放在最尾
}

document.addEventListener('DOMContentLoaded', function () {
    const addButton = document.getElementById('addInput');
    const workDiv = document.getElementById('work_div');
    const modalElement = document.getElementById('groupSelectorModal');
    const modal = new bootstrap.Modal(modalElement);

    let currentGroupRow = null;

    // Add button listener
    if (addButton) {
        addButton.addEventListener('click', function () {
            const currentCount = document.querySelectorAll('#work_div .col-12.col-md-6').length;
            if (currentCount >= MAX_TOTAL_BUTTONS) {
                alert(`已達到上限：最多只能有 ${MAX_TOTAL_BUTTONS} 個按鈕！`);
                return;
            }
            inputGen(0, "");
        });
    }

    if (!workDiv) {
        console.error("找不到 #work_div");
        return;
    }

    // Focus event - activate group
    workDiv.addEventListener('focus', function (e) {
        if (e.target.tagName === 'INPUT' && e.target.closest('.group-row')) {
            const groupRow = e.target.closest('.group-row');
            activateGroup(groupRow);
        }
    }, true);

    // Click event - handle all interactions
    workDiv.addEventListener('click', function (e) {
        const groupRow = e.target.closest('.group-row');
        const groupCol = e.target.closest('.col-12.col-md-6');

        // Delete button
        if (e.target.closest('.fa-trash-can') && groupCol) {
            e.stopPropagation();
            const currentCount = document.querySelectorAll('#work_div .col-12.col-md-6').length;
            if (currentCount <= MIN_TOTAL_BUTTONS) {
                alert(`至少需要保留 ${MIN_TOTAL_BUTTONS} 個按鈕！`);
                return;
            }
            if (confirm("確定要刪除這個按鈕嗎？")) {
                groupCol.remove();
                afterGroupChange();
            }
            return;
        }

        // Edit button - open modal
        if (e.target.closest('.fa-pen-to-square') && groupRow) {
            e.stopPropagation();
            currentGroupRow = groupRow;
            modal.show();
            return;
        }

        // Other icon-group clicks - activate
        if (e.target.closest('.icon-group') && groupRow) {
            e.stopPropagation();
            activateGroup(groupRow);
            return;
        }
    });

    // Close active on outside click
    document.addEventListener('click', function (e) {
        if (!workDiv.contains(e.target)) {
            document.querySelectorAll('.group-row.active').forEach(g => g.classList.remove('active'));
        }
    });

    // 監聽 Modal 開啟事件
    modalElement.addEventListener('show.bs.modal', function () {
        // 1. 先清除所有按鈕的 active 狀態
        modalElement.querySelectorAll('.group-item').forEach(btn => {
            btn.classList.remove('active');
        });

        if (currentGroupRow) {
            // 2. 從目前的欄位容器 (groupCol) 抓取目前的 group-X 類別
            const groupCol = currentGroupRow.closest('.col-12.col-md-6');

            // 使用正則表達式找出目前的群組編號
            const match = groupCol.className.match(/group-(\d+)/);
            const currentGroupNum = match ? match[1] : "0";

            // 3. 找到對應的按鈕並加上 active
            const targetBtn = modalElement.querySelector(`.group-item[data-group="${currentGroupNum}"]`);
            if (targetBtn) {
                targetBtn.classList.add('active');

                // 選優體驗：如果選單很長，自動捲動到選中項目的位置
                targetBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    });

    // Modal group selection
    modalElement.addEventListener('click', function (e) {
        // 1. 修改選擇器為新的類別名稱 .group-item
        const btn = e.target.closest('.group-item');

        // 確保點擊的是按鈕，且目前有選定的列 (currentGroupRow)
        if (btn && currentGroupRow) {
            const newGroupNum = parseInt(btn.dataset.group);

            // 取得按鈕內的文字（或根據編號生成），這讓標籤更動態
            const newLabelText = btn.querySelector('.group-label').textContent.trim();
            const newGroupClass = `group-${newGroupNum}`;

            // 找到最外層的容器 (Col)
            const groupCol = currentGroupRow.closest('.col-12.col-md-6');

            if (groupCol) {
                // 2. 優化類別替換邏輯：移除舊的 group-* 類別並加入新的
                // 使用正則表達式確保精確匹配 group-0 到 group-8
                groupCol.className = groupCol.className.replace(/\bgroup-\d+\b/g, '').trim();
                groupCol.classList.add(newGroupClass);
            }

            // 3. 更新標籤 (Label)
            const label = currentGroupRow.querySelector('label');
            if (label) label.textContent = newLabelText;

            // 4. 更新輸入框占位符 (Placeholder)
            const input = currentGroupRow.querySelector('input');
            if (input) input.placeholder = newLabelText;

            // 5. 隱藏 Modal 並執行後續邏輯
            modal.hide();

            // 確保這些自定義函式存在
            if (typeof activateGroup === 'function') activateGroup(currentGroupRow);
            if (typeof afterGroupChange === 'function') afterGroupChange();
        }
    });

    // Helper function
    function activateGroup(targetGroup) {
        document.querySelectorAll('.group-row').forEach(group => {
            group.classList.toggle('active', group === targetGroup);
        });
    }
    const startBtn = document.getElementById('startButton');
    const resetBtn = document.getElementById('resetStop');
    const timerDisplay = document.getElementById('timerDisplay'); // 可選顯示秒數
    const btnOP_div = document.getElementById('btnOP_div');
    const btn_div = document.getElementById('btn_div');
    const work_div = document.getElementById('work_div');
    const result_btns = document.getElementById('result_btns');

    ticks = 0;
    let timerInterval = null; // 計時器 ID
    let isRunning = false;

    // 更新顯示（可選）
    function updateDisplay() {
        const minutes = Math.floor(ticks / 60).toString().padStart(2, '0');
        const seconds = (ticks % 60).toString().padStart(2, '0');
        if (timerDisplay) timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    // 開始/暫停計時
    function StartTimer() {
        timerInterval = setInterval(() => {
            ticks++;
            updateDisplay();
        }, 1000);
    }
    function pauseTimer() {
        // 暫停
        clearInterval(timerInterval);
        timerInterval = null;
    }
    function resetTimer() {
        // 重置
        ticks = 0;
        updateDisplay();
    }

    //Start 按鈕事件處理
    function startBtnHandler() {
        if (isRunning === false) {//開始
            if(hasAnyEmptyInput()) {
                alert("請填寫所有欄位");
                return;
            }
            //狀態變更
            isRunning = true;
            isRecording = true;
            //計時器啟動
            StartTimer();
            //按鈕生成
            btnGen();

            //記錄開始時間
            let time = new Date();
            let h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
            let m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
            startTime = h + ":" + m;
            //UI變更
            btnOP_div.classList.add('d-none');
            work_div.classList.add('d-none');
            btn_div.classList.remove('d-none');

            startBtn.textContent = 'Pause';
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-success');
            resetBtn.textContent = 'Stop';
            resetBtn.classList.remove('btn-danger');
            resetBtn.classList.add('btn-warning');
        } else if (isRecording === true) {//暫停
            btn_div.querySelectorAll('.btn').forEach(b => {
                b.classList.add('disabled');
            });
            isRecording = false;
            pauseTimer();
            startBtn.textContent = 'Resume';
            startBtn.classList.remove('btn-success');
            startBtn.classList.add('btn-primary');
        } else {//繼續
            btn_div.querySelectorAll('.btn').forEach(b => {
                b.classList.remove('disabled');
            });
            isRecording = true;
            StartTimer();
            startBtn.textContent = 'Pause';
            startBtn.classList.remove('btn-primary');
            startBtn.classList.add('btn-success');
        }
    }
    //Reset/Stop 按鈕事件處理
    function resetOrStop(skipConfirmation) {
        if (isRunning === true) {//停止
            startBtn.classList.add('disabled');
            btn_div.querySelectorAll('.btn').forEach(b => {
                b.classList.add('disabled');
            });
            result_btns.querySelectorAll('.btn').forEach(b => {
                b.classList.remove('disabled');
            });

            resetBtn.className = 'btn btn-danger btn-lg px-4 fs-2';
            resetBtn.textContent = 'Reset';
            isRunning = false;
            isRecording = false;

            pauseTimer();

            const activeButtons = btn_div.querySelectorAll('.btn.active');
            activeButtons.forEach(btn => {
                //記錄收尾時間
                const groupNum = btn.dataset.groupNum;
                const btnValue = btn.querySelector('span:first-child').textContent.trim();

                // 找到該按鈕對應的最後一筆未結束記錄
                const record = records.find(r =>
                    (r.buttonIndex === undefined ? r.group === Number(groupNum) && r.value === btnValue :
                        r.buttonIndex === Number(btn.dataset.recordIndex)) &&
                    r.stop === null
                );

                if (record) {
                    record.stop = ticks;
                }
                //按鈕還原

                let colorHex = GROUP_COLORS[groupNum] || '#6c757d';
                btn.classList.remove('active');
                btn.style.backgroundColor = colorHex;
                btn.style.borderColor = colorHex;
                btn.style.color = 'white';
                btn.querySelector('.check-icon').style.visibility = 'hidden';

            });

        } else if (btnOP_div.classList.contains('d-none')) {//停止後重置
            if (skipConfirmation !== true && !confirm('清除目前的觀課記錄？')) return;
            startTime = null;
            clearTimeline();
            startBtn.className = 'btn btn-primary btn-lg px-4 fs-2';
            startBtn.textContent = 'Start';
            result_btns.querySelectorAll('.btn').forEach(b => {
                b.classList.add('disabled');
            });
            records = [];
            record_title = [];
            resetTimer();
            updateDisplay();
            btnOP_div.classList.remove('d-none');
            work_div.classList.remove('d-none');
            btn_div.classList.add('d-none');
        } else {//一般重置(清空obsPreferences)
            if (confirm("確定要重設所有按鈕記錄嗎？")) {
                obsPreferences.removeItem('btn_info');
                inputInitialize();
            }

        }

    }
    observationStcFlow = {
        running: () => isRunning,
        start: startBtnHandler,
        pause: pauseTimer,
        stop: resetOrStop,
        update: updateDisplay,
        resume: StartTimer
    };
    // 綁定事件
    startBtn.addEventListener('click', startBtnHandler);
    resetBtn.addEventListener('click', resetOrStop);

    // 頁面載入時初始化顯示
    updateDisplay();
});

// 離線/連線狀態追蹤
let isOffline = false;
let offlineStartTime = null;

// 建立 Toast 容器（只建立一次）
function createToastContainer() {
    if (document.getElementById('network-toast-container')) return;
    
    const container = document.createElement('div');
    container.id = 'network-toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1050';
    container.style.width = '350px';
    document.body.appendChild(container);
}

// 顯示 Toast 函式（使用 Bootstrap Toast）
function showNetworkToast(message, type = 'info', duration = 5000, buttons = []) {
    createToastContainer();

    const toastId = 'network-toast-' + Date.now();
    const bgClass = type === 'danger' ? 'bg-danger' : type === 'success' ? 'bg-success' : 'bg-info';
    const textClass = type === 'danger' || type === 'success' ? 'text-white' : '';

    const toastHTML = `
        <div id="${toastId}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} ${textClass}">
                <strong class="me-auto">網路狀態</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close ${type === 'danger' || type === 'success' ? 'btn-close-white' : ''}" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
                ${buttons.length > 0 ? '<div class="mt-3">' + buttons.join(' ') + '</div>' : ''}
            </div>
        </div>
    `;

    const container = document.getElementById('network-toast-container');
    container.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: duration > 0, delay: duration });

    toast.show();

    // 自動移除 Toast 元素（避免 DOM 堆積）
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    return toast;
}

// 斷線時顯示
window.addEventListener('offline', function () {
    if (isOffline) return; // 避免重複

    isOffline = true;
    offlineStartTime = Date.now();

    showNetworkToast(
        '網路已斷線，目前無法載入新資料或同步…',
        'danger',
        0  // 不自動隱藏，讓使用者知道狀態
    );

    console.log("網路已斷線");
});

// 連線恢復時詢問
window.addEventListener('online', function () {
    if (!isOffline) return;

    isOffline = false;
    const offlineDuration = Math.round((Date.now() - offlineStartTime) / 1000);

    showNetworkToast(
        `網路已重新連線！<br>斷線時間約 ${offlineDuration} 秒。<br><small>是否要重新整理頁面以載入最新內容？</small>`,
        'success',
        0,  // 不自動隱藏，讓使用者有時間決定
        [
            `<button class="btn btn-primary btn-sm" id="reloadPageBtn">重新整理頁面</button>`,
            `<button class="btn btn-secondary btn-sm ms-2" id="ignoreReloadBtn">暫時忽略</button>`
        ]
    );

    // 動態綁定按鈕事件（因為 Toast 是動態產生）
    document.addEventListener('click', function handler(e) {
        if (e.target.id === 'reloadPageBtn') {
            window.location.reload();
            document.removeEventListener('click', handler);
        } else if (e.target.id === 'ignoreReloadBtn') {
            const toast = bootstrap.Toast.getInstance(document.querySelector('.toast'));
            if (toast) toast.hide();
            document.removeEventListener('click', handler);
        }
    });

    console.log(`網路恢復連線！斷線時間：${offlineDuration} 秒`);
});


document.addEventListener("DOMContentLoaded", () => {
    const {el, all, obj, num, str, list} = ObservationRecovery;
    function rows() {
        return all("#work_div > .col-12.col-md-6").map(row => ({
            group: Number(row.className.match(/group-(\d+)/)?.[1] || 0), value: row.querySelector("input").value
        }));
    }
    const flow = observationStcFlow;
    el('filename').addEventListener('input', () => { filename = el('filename').value; });
    ObservationRecovery.install("STC", {
        config: () => ({rows: el("work_div").classList.contains("d-none") ? btn_info : rows()}),
        validConfig: c => obj(c) && list(c.rows, row => obj(row) && num(row.group) && row.group <= MAX_GROUPS &&
            str(row.value), MIN_TOTAL_BUTTONS, MAX_TOTAL_BUTTONS),
        apply(c) {
            obsPreferences.btn_info = JSON.stringify(c.rows);
            inputInitialize();
        },
        capture: () => el("work_div").classList.contains("d-none") ?
            {phase: flow.running() ? "active" : "stopped", data: {
                ticks, startTime, records, record_title, selected: all("#btn_div button").map(button => button.classList.contains("active"))
            }} : null,
        validState: (s,c) => c.rows.every(row => row.value.trim()) && obj(s) && num(s.ticks) && str(s.startTime) && list(s.record_title, str) &&
            list(s.records, r => obj(r) && num(r.group) && r.group <= MAX_GROUPS && str(r.value) &&
                num(r.start) && (r.stop === null || num(r.stop)) &&
                (r.buttonIndex === undefined || num(r.buttonIndex) && r.buttonIndex < c.rows.length)) &&
            list(s.selected, value => typeof value === "boolean", c.rows.length, c.rows.length),
        reset() {
            if (flow.running()) flow.stop(true);
            if (el("work_div").classList.contains("d-none")) flow.stop(true);
        },
        restore(s, phase) {
            flow.start();
            flow.pause();
            if (phase === "stopped") flow.stop(true);
            ({ticks, startTime, records, record_title} = s);
            flow.update();
            if (phase === "active") all("#btn_div button").forEach((button,i) => {
                if (!s.selected[i]) return;
                const color = GROUP_COLORS[Number(button.dataset.groupNum)] || "#6c757d";
                button.classList.add("active", "shadow-lg");
                button.style.backgroundColor = "white";
                button.style.color = color;
                button.querySelector(".check-icon").style.visibility = "visible";
            });
        },
        resume: () => flow.resume()
    });
});
