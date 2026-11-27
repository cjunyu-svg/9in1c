// --- 計時器相關變數 ---
let timerInterval;
let seconds = 0;
let minutes = 0;
let isTimerRunning = false; // 追蹤計時器是否正在運行（計時中）
let isTimerPaused = false;  // 追蹤計時器是否處於暫停狀態
let startTime;

// --- DOM 元素引用 (在 DOMContentLoaded 後初始化) ---
let mainActionButton;
let resetStopButton;
let timerDisplay;
let showResultButton; // 新增對 showResultBtn 的引用
let getRecordButton;     // 新增對 getRecordxBtn 的引用
let getStatisticsButton;     // 新增對 getStatisticsData 的引用
let getTimelineButton; // 新增對 getTimeline 的引用
let getPieChartButton; // 新增對 getPieChart 的引用
let getZipButton;    // 新增對 getAllFileZip 的引用
let downloadDropdownToggle; // 新增對 id="download" 的引用 (按鈕本身)
let threeDArray = [];           // 儲存組合的發生次數
let combinationTimes = [];      // 儲存組合的累積時間 (秒)
let allBtnStartEnd = [];
let allBtnDuration = [];
let activeButtons = {
    work_div_0: null, // 儲存 work_div_0 中目前活躍按鈕的索引
    work_div_1: null, // 儲存 work_div_1 中目前活躍按鈕的索引
    work_div_2: null  // 儲存 work_div_2 中目前活躍按鈕的索引
};
let currentCombinationStartTime = null; // 當前有效組合開始的時間戳 (毫秒)
let currentTimedCombinationKey = null; // 新增：追蹤當前正在計時的組合的鍵，例如 "0_1_2"

let ftcInputName = [];
let ftcCategoryName = [];


const categorySetupDivs = [];
const categoryDisplayDivs = [];
const categoryTextSpans = [];
const categoryInput = [];
const addInputBtns = [];
const removeInputBtns = [];
const workDivs = [];


// --- 初始化函數 (在 DOMContentLoaded 事件中調用) ---
document.addEventListener('DOMContentLoaded', function () {
    let deviceType = getDeviceTypeModern(); // 優先使用新方法

    if (deviceType == null) { // 如果新方法不支援或無法判斷，則使用傳統 User Agent 方法
        deviceType = getDeviceType();
    }

    if (deviceType === 'M') {
        const mobilePageUrl = 'mobile_alarm.html';
        // window.location.replace 會取代目前頁面，使用者無法按上一頁返回
        // 如果希望使用者可以返回，可以使用 window.location.href
        window.location.replace(mobilePageUrl);
    }

    mainActionButton = document.getElementById('mainActionButton');
    if (!mainActionButton) {
        console.error("錯誤：找不到 ID 為 'mainActionButton' 的元素。");
    }

    resetStopButton = document.getElementById('resetStop');
    if (!resetStopButton) {
        console.error("錯誤：找不到 ID 為 'resetStop' 的元素。");
    }

    timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) {
        console.error("錯誤：找不到 ID 為 'timerDisplay' 的元素。");
    }

    showResultButton = document.getElementById('showResultBtn');
    if (!showResultButton) {
        console.error("錯誤：找不到 ID 為 'showResultBtn' 的元素。");
    }

    // 獲取 id="download" 的按鈕，也就是 dropdown-toggle 本身
    downloadDropdownToggle = document.getElementById('download');
    if (!downloadDropdownToggle) {
        console.error("錯誤：找不到 ID 為 'download' 的元素。");
    }
    
    getTimelineButton = document.getElementById('getTimeline');
    if (!getTimelineButton) {
        console.error("錯誤：找不到 ID 為 'getTimeline' 的元素。");
    }

    getRecordButton = document.getElementById('getRecordData');
    if (!getRecordButton) {
        console.error("錯誤：找不到 ID 為 'getRecordData' 的元素。");
    }

    getStatisticsButton = document.getElementById('getStatisticsData');
    if (!getStatisticsButton) {
        console.error("錯誤：找不到 ID 為 'getStatisticsData' 的元素。");
    }

    getPieChartButton = document.getElementById('getPieChart');
    if (!getPieChartButton) {
        console.error("錯誤：找不到 ID 為 'getPieChart' 的元素。");
    }
    
    getZipButton = document.getElementById('getAllFileZip');
    if (!getZipButton) {
        console.error("錯誤：找不到 ID 為 'getAllFileZip' 的元素。");
    }


    // 獲取所有相關的 DOM 元素並儲存起來
    ftcCategoryName = localStorage.ftcCategoryName ? JSON.parse(localStorage.ftcCategoryName) : [];
    ftcInputName = localStorage.ftcInputName ? JSON.parse(localStorage.ftcInputName) : [];
    for (let i = 0; i < 3; i++) {
        categorySetupDivs[i] = document.getElementById(`category_${i}_setup`);
        categoryDisplayDivs[i] = document.getElementById(`category_${i}_display`);
        categoryTextSpans[i] = document.getElementById(`category_${i}_text`);
        categoryInput[i] = document.getElementById(`category_${i}`);
        addInputBtns[i] = document.getElementById(`addInputBtn_${i}`);
        removeInputBtns[i] = document.getElementById(`removeInputBtn_${i}`);
        workDivs[i] = document.getElementById(`work_div_${i}`);

        // 為增減按鈕綁定事件
        if (addInputBtns[i]) {
            console.log("為增減按鈕綁定事件");
            addInputBtns[i].addEventListener('click', function () {
                const categoryIndex = parseInt(this.dataset.categoryIndex);
                addInput(workDivs[categoryIndex], categoryIndex, false);
            });
        }

        if (removeInputBtns[i]) {
            removeInputBtns[i].addEventListener('click', function () {
                const categoryIndex = parseInt(this.dataset.categoryIndex);
                removeInput(categoryIndex);
            });
        }

        //初始化時，回覆上一次儲存的類別名稱；若為第一次操作，則為Category_1 2 3
        if (localStorage.ftcCategoryName) {
            categoryInput[i].value = ftcCategoryName[i];
        }

        // 初始化時，回覆上一次儲存的按鈕名稱；若為第一次操作，則為每個 work_div_X 添加預設的 2 個 Input
        if (workDivs[i] && workDivs[i].children.length === 0 && localStorage.ftcInputName === undefined) {
            addInput(workDivs[i], i, false);
            addInput(workDivs[i], i, false);
        } else {
            for (let j = 0; j < ftcInputName[i].length; j++) {
                addInput(workDivs[i], i, true);
            }
        }
    }

    // 為主操作按鈕綁定事件 (Start/Pause)
    if (mainActionButton) {
        mainActionButton.addEventListener('click', toggleMainAction);
    }

    // 為 Reset/Stop 按鈕綁定事件
    if (resetStopButton) {
        resetStopButton.addEventListener('click', fullResetToSetup);
    }

    if (showResultButton) {
        showResultButton.addEventListener('click', showResult);
    }
    if (getStatisticsButton) {
        getStatisticsButton.addEventListener('click', generateStatisticsExcel);
    }
    if (getRecordButton) {
        getRecordButton.addEventListener('click', generateRecordExcel);
    }
    if (getTimelineButton) {
        getTimelineButton.addEventListener('click', downloadTimeline);
    }
    if (getPieChartButton) {
        getPieChartButton.addEventListener('click', downloadPieChart);
    }
    if (getZipButton) {
        getZipButton.addEventListener('click', downloadZipFile);
    }
    // 頁面載入完成後，首次初始化三維陣列並監聽按鈕事件
    // 這會在所有 DOM 元素準備就緒，並且初始按鈕（如果有）添加後執行
    resetAndInitializeCombinations(); // 新增這一行
});

// --- 計時器邏輯 ---
function updateTimer() {
    seconds++;
    minutes = Math.floor(seconds / 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

// --- 主要操作按鈕的切換邏輯 (Start / Pause / Resume) ---
function toggleMainAction() {
    if (!isTimerRunning) { // 初始狀態：Start
        startObservation();
    } else /* if (isTimerRunning && !isTimerPaused) { // 運行中狀態：Pause
        pauseTimer();
    } else if (!isTimerRunning && isTimerPaused) { // 暫停狀態：Resume
        resumeTimer();
    } */ {
        stopObservation();
    }
}

// --- 啟動計時器和觀察模式 ---
function startObservation() {
    ftcCategoryName = [];
    ftcInputName = [];
    var time = new Date();
    var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
    var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
    startTime = h + ":" + m;

    timerInterval = setInterval(updateTimer, 1000);
    isTimerRunning = true;
    isTimerPaused = false;

    mainActionButton.textContent = 'Stop';
    mainActionButton.classList.remove('btn-primary');
    mainActionButton.classList.add('btn-warning');

    //resetStopButton.textContent = 'Stop';
    resetStopButton.disabled = true;

    addInputBtns.forEach(btn => btn.classList.add('d-none'));
    removeInputBtns.forEach(btn => btn.classList.add('d-none'));

    for (let i = 0; i < 3; i++) {
        const categoryInput = document.getElementById(`category_${i}`);
        if (categoryInput) {
            categoryTextSpans[i].textContent = categoryInput.value || `Category${i + 1}`;
            categorySetupDivs[i].classList.add('d-none');
            categoryDisplayDivs[i].classList.remove('d-none');

            ftcCategoryName.push(categoryTextSpans[i].textContent);
        }
    }

    for (let i = 0; i < 3; i++) {
        const currentWorkDiv = workDivs[i];
        ftcInputName.push([]);
        if (currentWorkDiv) {
            if (currentWorkDiv.classList.contains('row-cols-1')) {
                currentWorkDiv.classList.remove('row-cols-1', 'gap-2');
                currentWorkDiv.classList.add('flex-wrap');

                Array.from(currentWorkDiv.children).forEach(childDiv => {
                    const originalInput = childDiv.querySelector('input');
                    const originalLabel = childDiv.querySelector('label');

                    if (originalInput && originalLabel) {
                        const buttonText = originalInput.value || originalInput.placeholder || originalLabel.textContent;
                        const newButton = document.createElement('button');
                        newButton.type = 'button';
                        let btnColorClass = '';
                        if (i === 0) btnColorClass = 'btn-outline-primary';
                        else if (i === 1) btnColorClass = 'btn-outline-success';
                        else if (i === 2) btnColorClass = 'btn-outline-danger';

                        newButton.className = `btn btn-lg ${btnColorClass} mb-2`;
                        newButton.textContent = buttonText;
                        newButton.dataset.categoryIndex = i;

                        ftcInputName[i].push(buttonText);

                        currentWorkDiv.replaceChild(newButton, childDiv);
                    }
                });
            }
            localStorage.ftcCategoryName = JSON.stringify(ftcCategoryName);
            localStorage.ftcInputName = JSON.stringify(ftcInputName);
            toggleWorkButtons(true);
        }
    }
    // 新增：在按鈕數量改變後，重新初始化和綁定事件
    resetAndInitializeCombinations();
    toggleShowDownloadButtons(false); // 禁用 Show Result 和 Download 按鈕
    console.log("計時開始。");
}

// --- 暫停計時 ---
/* function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    isTimerPaused = true;
    updateCombinationDuration(); // 新增：恢復時，檢查是否已有組合，並開始計時

    mainActionButton.textContent = 'RESUME';
    mainActionButton.classList.remove('btn-warning');
    mainActionButton.classList.add('btn-info');

    toggleWorkButtons(false);
    toggleShowDownloadButtons(false); // 新增這行：禁用 Show Result 和 Download 按鈕 (保持禁用)
    console.log("計時暫停。");
}

// --- 恢復計時 ---
function resumeTimer() {
    timerInterval = setInterval(updateTimer, 1000);
    isTimerRunning = true;
    isTimerPaused = false;

    mainActionButton.textContent = 'PAUSE';
    mainActionButton.classList.remove('btn-info');
    mainActionButton.classList.add('btn-warning');

    toggleWorkButtons(true);
    toggleShowDownloadButtons(false); // 新增這行：禁用 Show Result 和 Download 按鈕 (保持禁用)
    console.log("計時恢復。");
} */

// --- 啟用/禁用工作區按鈕 ---
function toggleWorkButtons(enable) {
    for (let i = 0; i < 3; i++) {
        const currentWorkDiv = workDivs[i];
        if (currentWorkDiv) {
            Array.from(currentWorkDiv.querySelectorAll('button')).forEach(button => {
                button.disabled = !enable;
                if (!enable) {
                    button.classList.add('disabled');
                } else {
                    button.classList.remove('disabled');
                }
            });
        }
    }
}

// --- 停止計時並進入結果檢視模式 ---
function stopObservation() {
    // 在計時器停止時，把仍為活躍的按鈕記錄終止時間
    for (let i = 0; i < 3; i++) {
        if (activeButtons[`work_div_${i}`] != null) {
            let lastBtnIndex = activeButtons[`work_div_${i}`];
            allBtnStartEnd[i][lastBtnIndex].push(seconds);
            allBtnDuration[i][lastBtnIndex] += seconds - allBtnStartEnd[i][lastBtnIndex][allBtnStartEnd[i][lastBtnIndex].length - 2];
        }
    }
    clearInterval(timerInterval);
    isTimerRunning = false;
    isTimerPaused = false;

    // 在計時器停止時，記錄當前組合的持續時間
    updateCombinationDuration(); // 新增：停止時，計算並記錄當前組合的持續時間



    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }

    // 禁用主按鈕，文字變回 Start
    if (mainActionButton) {
        mainActionButton.textContent = 'Start';
        mainActionButton.classList.remove('btn-warning', 'btn-info');
        mainActionButton.classList.add('btn-primary');
        mainActionButton.disabled = true; // 新增：禁用 START/PAUSE/RESUME 按鈕
    }

    // 將 STOP 按鈕變為 RESET (並確保啟用)
    if (resetStopButton) {
        resetStopButton.disabled = false; // 新增：確保 RESET 按鈕是啟用的
    }

    // 增減按鈕保持隱藏 (已在 startObservation 中處理，這裡只是再次確認)
    addInputBtns.forEach(btn => { if (btn) btn.classList.add('d-none'); });
    removeInputBtns.forEach(btn => { if (btn) btn.classList.add('d-none'); });

    // Category 標籤保持不變 (不變回輸入框)
    // 這裡不需要額外操作，因為它們已經是顯示狀態了

    // 工作區按鈕禁用，但保持為按鈕形式 (不變回輸入框)
    toggleWorkButtons(false); // 新增：禁用工作區所有按鈕

    // 啟用 Show Result 和 Download 按鈕
    toggleShowDownloadButtons(true); // 新增：啟用 Show Result 和 Download 按鈕

    // 生成最終報告
    generateFinalReport(); // 新增：停止計時後生成最終報告

    console.log("計時已停止，進入結果檢視模式。");
}

// --- 完全重置為初始設定模式 ---
function fullResetToSetup() {
    clearInterval(timerInterval); // 確保計時器停止
    isTimerRunning = false;
    isTimerPaused = false;
    seconds = 0;
    minutes = 0;
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }

    // 啟用主按鈕，設置為 Start 狀態
    if (mainActionButton) {
        mainActionButton.textContent = 'Start';
        mainActionButton.classList.remove('btn-warning', 'btn-info');
        mainActionButton.classList.add('btn-primary');
        mainActionButton.disabled = false;
    }

    // 確保 Reset 按鈕是啟用的
    if (resetStopButton) {
        resetStopButton.textContent = 'Reset';
        resetStopButton.classList.remove('btn-secondary');
        resetStopButton.classList.add('btn-danger');
        resetStopButton.disabled = false;
    }


    // 顯示增減按鈕
    addInputBtns.forEach(btn => { if (btn) btn.classList.remove('d-none'); });
    removeInputBtns.forEach(btn => { if (btn) btn.classList.remove('d-none'); });

    // 恢復 Category 輸入框設定
    for (let i = 0; i < 3; i++) {
        if (categorySetupDivs[i] && categoryDisplayDivs[i]) {
            categorySetupDivs[i].classList.remove('d-none');
            categoryDisplayDivs[i].classList.add('d-none');
        }
        const categoryInput = document.getElementById(`category_${i}`);
        if (localStorage.ftcCategoryName) {
            categoryInput.value = JSON.parse(localStorage.ftcCategoryName)[i];
        } else { // 重置 category input 的值
            categoryInput.value = `Category${i + 1}`;
        }
    }

    // 重置 work_div_X 內容，恢復為可編輯的 Input
    for (let i = 0; i < 3; i++) {
        const currentWorkDiv = workDivs[i];
        if (currentWorkDiv) {
            // 清空所有內容 (包括原來的按鈕)
            while (currentWorkDiv.firstChild) {
                currentWorkDiv.removeChild(currentWorkDiv.firstChild);
            }
            // 恢復原始 flexbox 樣式
            currentWorkDiv.classList.remove('btn-group', 'flex-wrap');
            currentWorkDiv.classList.add('row-cols-1', 'gap-2');

            // 重新添加預設的 2 個 Input
            if (localStorage.ftcInputName === undefined) {
                addInput(workDivs[i], i, false);
                addInput(workDivs[i], i, false);
            } else {
                for (let j = 0; j < ftcInputName[i].length; j++) {
                    addInput(workDivs[i], i, true);
                }
            }
        }
    }
    // 清除 Div timeline
    clearTimeline();

    // 清除 Div piechart
    clearPieChart();

    // 啟用 Show Result 和 Download 按鈕 (回到設定模式時也應啟用)
    toggleShowDownloadButtons(false);

    // 在所有 DOM 結構重置完畢後，執行最終的陣列和事件重置
    resetAndInitializeCombinations(); // 新增：確保徹底重置陣列和重新綁定所有事件

    console.log("頁面已完全重置為初始設定模式。");
}


// --- 新增/修改：處理動態生成按鈕的點擊事件（單選及跨區清除邏輯） ---
function handleCategoryButtonClick(event) { // 注意函數名稱變為  handleCategoryButtonClick
    // 如果計時器未運行或已暫停，則不允許點擊按鈕
    if (!isTimerRunning || isTimerPaused) {
        console.log("計時器未運行或已暫停，無法選中按鈕。");
        return;
    }

    const clickedButton = event.currentTarget; // 被點擊的按鈕
    const categoryIndex = parseInt(clickedButton.dataset.categoryIndex); // 獲取 workDiv 的索引 (0, 1, 2)
    const buttonIndex = parseInt(clickedButton.dataset.buttonIndex);     // 獲取按鈕在該 workDiv 中的索引

    // 1. 在更新 activeButtons 之前，先計算並記錄前一個組合的持續時間
    // 這確保了當點擊新按鈕打破舊組合時，舊組合的時間會被記錄下來。

    // 2. 實現單選模式：先清除當前 workDiv 內所有按鈕的選中狀態
    const currentWorkDivButtons = getButtonsInWorkDiv(workDivs[categoryIndex]);
    currentWorkDivButtons.forEach(btn => {
        btn.classList.remove('active-selected-button'); // 移除視覺選中狀態
    });

    // 3. 設定當前被點擊按鈕的選中狀態和 activeButtons 狀態
    if (activeButtons[`work_div_${categoryIndex}`] === buttonIndex) {
        activeButtons[`work_div_${categoryIndex}`] = null;
        allBtnStartEnd[categoryIndex][buttonIndex].push(seconds);
        allBtnDuration[categoryIndex][buttonIndex] += seconds - allBtnStartEnd[categoryIndex][buttonIndex][allBtnStartEnd[categoryIndex][buttonIndex].length - 2];
    } else {
        if (activeButtons[`work_div_${categoryIndex}`] != null) {
            let lastBtnIndex = activeButtons[`work_div_${categoryIndex}`];
            allBtnStartEnd[categoryIndex][lastBtnIndex].push(seconds);
            allBtnDuration[categoryIndex][lastBtnIndex] += seconds - allBtnStartEnd[categoryIndex][lastBtnIndex][allBtnStartEnd[categoryIndex][lastBtnIndex].length - 2];
        }
        allBtnStartEnd[categoryIndex][buttonIndex].push(seconds);
        clickedButton.classList.add('active-selected-button'); // 添加視覺選中狀態
        activeButtons[`work_div_${categoryIndex}`] = buttonIndex; // 設置當前 workDiv 的活躍按鈕索引
    }

    console.log(`[${timerDisplay.textContent}] WorkDiv${categoryIndex} 的按鈕 "${clickedButton.textContent}" (索引: ${buttonIndex}) 被選中。`);
    console.log("當前活躍按鈕狀態:", activeButtons);

    // 4. 更新 activeButtons 之後，再次呼叫 updateCombinationDuration()
    // 這會檢查是否形成了新的完整三鈕組合，並如果計時器運行，則啟動該組合的計時。
    updateCombinationDuration();
}


// --- 輸入欄位增減函數 ---
function addInput(targetDivElement, categoryIndex, isInitial) {
    if (!targetDivElement) { // 確保目標元素存在
        console.error(`目標 div 元素未提供或為空。`);
        return;
    }

    if (targetDivElement.children.length >= 6) {
        alert('每個類別的輸入欄位最多只能有 6 個！');
        return;
    }

    if (isInitial) {
        if (targetDivElement.children.length >= ftcInputName[categoryIndex].length) {
            return;
        }
    }

    const categoryInputId = `category_${categoryIndex}`;
    const categoryInputValue = `Button ${targetDivElement.children.length + 1}`;

    // 使用 DocumentFragment 來批次處理 DOM 插入
    const fragment = document.createDocumentFragment();

    const newDiv = document.createElement('div');
    newDiv.className = 'form-floating col-lg-12 mb-2';

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'form-control border';

    if (categoryIndex === 0) {
        newInput.classList.add('border-primary');
    } else if (categoryIndex === 1) {
        newInput.classList.add('border-success');
    } else if (categoryIndex === 2) {
        newInput.classList.add('border-danger');
    }
    newInput.value = isInitial ? ftcInputName[categoryIndex][targetDivElement.children.length] : "";

    newInput.id = `${categoryInputId}_dynamic_${targetDivElement.children.length}`;
    newInput.placeholder = categoryInputValue || `新項目`;
    newInput.maxLength = 20;

    const newLabel = document.createElement('label');
    newLabel.htmlFor = newInput.id;


    newLabel.textContent = categoryInputValue || `新項目`;

    newDiv.appendChild(newInput);
    newDiv.appendChild(newLabel);

    fragment.appendChild(newDiv); // 將新創建的 div 添加到 DocumentFragment

    targetDivElement.appendChild(fragment); // 一次性將 DocumentFragment 添加到目標 div
}

function removeInput(categoryIndex) {
    const targetDivId = `work_div_${categoryIndex}`;
    const targetDiv = document.getElementById(targetDivId);

    if (!targetDiv) {
        console.error(`Target div with ID ${targetDivId} not found.`);
        return;
    }

    if (targetDiv.children.length <= 2) {
        alert('每個類別的輸入欄位最少需要 2 個！');
        return;
    }

    if (targetDiv.lastElementChild) {
        targetDiv.removeChild(targetDiv.lastElementChild);
    }
    // 新增：在按鈕數量改變後，重新初始化和綁定事件
    //resetAndInitializeCombinations();
}

function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase(); // 取得 User Agent 並轉為小寫

    // 1. 優先偵測平板 (iPad 或 Android Tablet)
    // iPad 的 User Agent 通常包含 "ipad"
    // Android 平板的 User Agent 可能包含 "android" 但不包含 "mobile"
    if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
        return 'T';
    }
    // 2. 偵測手機
    // 大部分手機 User Agent 會包含 "mobile", "iphone", "ipod", "android", "windows phone" 等關鍵字
    if (/(mobi|ipod|iphone|android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|iris|kindle|lge |maemo|midp|opera mini|palm|psp|phone|playbook|plucker|pocket|psp|symbian|treo|up.browser|up.link|vodafone|wap|windows ce|windows phone|xda|xiino)/.test(ua)) {
        return 'M';
    }
    // 3. 如果以上都不是，則判斷為電腦
    return 'D';
}

// 新的 User-Agent Client Hints API (如果瀏覽器支援)
function getDeviceTypeModern() {
    // 檢查 navigator.userAgentData 是否存在 (較新的瀏覽器支援)
    if (navigator.userAgentData) {
        if (navigator.userAgentData.mobile) { // .mobile 會回傳 boolean
            // 這裡可以再細分是手機還是平板，但 userAgentData 本身不直接提供平板資訊
            // 通常會再搭配螢幕尺寸或 User Agent 字串輔助
            // 為了簡化，我們先判斷為行動裝置，然後可以再用舊方法細分
            const ua = navigator.userAgent.toLowerCase();
            if (/(ipad|tablet|(android(?!.*mobile)))/.test(ua)) {
                return 'T';
            }
            return 'M';
        } else {
            return 'D';
        }
    }
    return null; // 如果不支援 UserAgentData，回傳 null，讓後續使用舊方法
}

/*
 *	info window control
 */
(function () { // 使用 IIFE 包裹程式碼，避免全域變數污染
    const modal = document.getElementById('myModal');
    const btn = document.getElementById("infoButton");
    const span = modal.querySelector(".close-button");

    // 檢查元素是否存在
    if (!modal || !btn || !span) {
        console.error("Modal elements not found. Please check IDs and classes.");
        return; // 如果找不到元素，就停止執行
    }

    // 當用戶點擊按鈕時，打開 modal
    btn.addEventListener('click', () => {
        modal.style.display = "flex"; // 確保 modal 顯示
    });

    // 當用戶點擊 <span> (x) 時，關閉 modal
    span.addEventListener('click', () => {
        modal.style.display = "none"; // 確保 modal 隱藏
    });

    // 當用戶點擊 modal 外部時，關閉 modal
    window.addEventListener('click', (event) => {
        // 只有當點擊的目標是 modal 本身（背景），而不是 modal 內容區時才關閉
        if (event.target === modal) {
            modal.style.display = "none"; // 確保 modal 隱藏
        }
    });

    // 當用戶按下 ESC 鍵時，關閉 modal (無障礙性考量)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') { // 兼容不同瀏覽器對 'Esc' 的處理
            if (modal.style.display === "block") {
                modal.style.display = "none"; // 確保 modal 隱藏
            }
        }
    });
})();

// --- 新增：輔助函數：獲取 workDiv 中的所有按鈕 ---
/**
 * 獲取指定 workDiv 內所有按鈕的參考。
 * 這個函數會根據你的按鈕實際如何添加到 workDiv 中進行調整。
 * 目前假設按鈕是直接子元素或其一層內的子元素。
 * @param {HTMLElement} divElement workDiv 的 DOM 元素
 * @returns {HTMLElement[]} 包含所有找到的按鈕元素的陣列
 */
function getButtonsInWorkDiv(divElement) {
    if (!divElement) return [];
    const buttons = [];
    // 遍歷所有子元素，尋找 BUTTON 或包含 BUTTON 的容器
    for (let i = 0; i < divElement.children.length; i++) {
        const child = divElement.children[i];
        if (child.tagName === 'BUTTON') {
            buttons.push(child);
        } else {
            const nestedButton = child.querySelector('button');
            if (nestedButton) {
                buttons.push(nestedButton);
            }
        }
    }
    return buttons;
}

// --- 新增：核心邏輯：管理組合時間和次數 ---
/**
 * 檢查並記錄當前活躍組合的持續時間。
 * 這個函數會在任何一個 workDiv 的按鈕狀態改變時，或計時器 Start/Stop 時被呼叫。
 */
function updateCombinationDuration() {
    const idx0 = activeButtons.work_div_0;
    const idx1 = activeButtons.work_div_1;
    const idx2 = activeButtons.work_div_2;

    const currentActiveKey = (idx0 !== null && idx1 !== null && idx2 !== null) ? `${idx0}_${idx1}_${idx2}` : null;

    // Case 1: A combination *was* being timed (currentTimedCombinationKey is not null),
    //         AND it's either no longer a valid combination (currentActiveKey is null),
    //         OR it's a *different* valid combination (currentActiveKey !== currentTimedCombinationKey),
    //         OR the timer has stopped (!isTimerRunning).
    if (currentTimedCombinationKey !== null &&
        (currentActiveKey === null || currentActiveKey !== currentTimedCombinationKey || !isTimerRunning)) {

        const duration = seconds - currentCombinationStartTime;

        // 從 currentTimedCombinationKey 解析出之前的索引
        const [prevIdx0, prevIdx1, prevIdx2] = currentTimedCombinationKey.split('_').map(Number);

        // 確保索引不超出陣列範圍
        if (threeDArray[prevIdx0] && threeDArray[prevIdx0][prevIdx1] && typeof threeDArray[prevIdx0][prevIdx1][prevIdx2] === 'number') {
            combinationTimes[prevIdx0][prevIdx1][prevIdx2] += duration === 0 ? 1 : duration; // 累積時間
            threeDArray[prevIdx0][prevIdx1][prevIdx2]++; // 次數增加
            console.log(`[${timerDisplay.textContent}] 組合 [${prevIdx0}][${prevIdx1}][${prevIdx2}] 結束，持續 ${duration.toFixed(2)} 秒。累積時間: ${combinationTimes[prevIdx0][prevIdx1][prevIdx2].toFixed(2)} 秒。次數: ${threeDArray[prevIdx0][prevIdx1][prevIdx2]}`);
        } else {
            console.warn(`[DEBUG updateCombinationDuration] 警告: 嘗試記錄的組合索引超出了初始化陣列的範圍。` +
                `Indices from key: ${currentTimedCombinationKey}. ` +
                `This happened for a combination that was actively being timed.`);
        }

        // 重置追蹤變數，表示之前的組合已結束
        currentCombinationStartTime = null;
        currentTimedCombinationKey = null;
    }

    // Case 2: A new, complete combination is active (currentActiveKey is not null),
    //         AND the timer is running (isTimerRunning),
    //         AND it's not currently being timed (currentCombinationStartTime === null).
    //         或者，如果是同一個組合但計時器被暫停後恢復。
    if (currentActiveKey !== null && isTimerRunning && currentCombinationStartTime === null) {
        currentCombinationStartTime = seconds;
        currentTimedCombinationKey = currentActiveKey;
        console.log(`[${timerDisplay.textContent}] 新組合 [${idx0}][${idx1}][${idx2}] 開始計時。`);
        console.log(`[DEBUG updateCombinationDuration] currentCombinationStartTime set to: ${currentCombinationStartTime}, currentTimedCombinationKey set to: ${currentTimedCombinationKey}`);
    } else if (currentActiveKey !== null && isTimerRunning && currentCombinationStartTime !== null && currentTimedCombinationKey === currentActiveKey) {
        console.log(`[DEBUG updateCombinationDuration] Same combination active and timed. Do nothing.`);
    }
}

/**
 * 重置或初始化三維陣列 (次數和時間)，並重新綁定按鈕事件。
 * 應該在頁面載入時和 Reset 按鈕點擊時呼叫。
 * 這個函數也會移除所有按鈕的選中狀態。
 */
function resetAndInitializeCombinations() {
    // 修正：從 workDivs 的子元素數量來獲取長度，而不是未定義的 buttonsX.length
    // 確保 workDivs[0], [1], [2] 都有有效的 children 數組
    const len0 = workDivs[0] ? workDivs[0].children.length : 0;
    const len1 = workDivs[1] ? workDivs[1].children.length : 0;
    const len2 = workDivs[2] ? workDivs[2].children.length : 0;
    const totalLen = len0 + len1 + len2;

    // 1. 初始化 threeDArray (次數)
    threeDArray = [];
    for (let i = 0; i < len0; i++) {
        const dim1 = [];
        for (let j = 0; j < len1; j++) {
            const dim2 = [];
            for (let k = 0; k < len2; k++) {
                dim2.push(0); // 組合次數初始化為 0
            }
            dim1.push(dim2);
        }
        threeDArray.push(dim1);
    }

    // 2. 初始化 combinationTimes (累積時間)
    combinationTimes = [];
    for (let i = 0; i < len0; i++) {
        const dim1 = [];
        for (let j = 0; j < len1; j++) {
            const dim2 = [];
            for (let k = 0; k < len2; k++) {
                dim2.push(0); // 累積時間初始化為 0
            }
            dim1.push(dim2);
        }
        combinationTimes.push(dim1);
    }

    allBtnStartEnd = [];
    for (let i = 0; i < 3; i++) {
        const dim1 = [];
        for (let j = 0; j < (workDivs[i] ? workDivs[i].children.length : 0); j++) {
            const dim2 = [];
            dim1.push(dim2);
        }
        allBtnStartEnd.push(dim1);
    }

    allBtnDuration = [];
    for (let i = 0; i < 3; i++) {
        const dim1 = [];
        for (let j = 0; j < (workDivs[i] ? workDivs[i].children.length : 0); j++) {
            dim1.push(0);
        }
        allBtnDuration.push(dim1);
    }

    console.log("三維陣列 (次數和時間) 已初始化/重置。");

    // 3. 重置活躍按鈕追蹤和時間
    activeButtons = { work_div_0: null, work_div_1: null, work_div_2: null };
    currentCombinationStartTime = null;
    currentTimedCombinationKey = null; // 新增：重置此變數

    // 4. 移除所有按鈕的舊事件監聽器並重新綁定 (單選邏輯和狀態更新)
    // 遍歷所有 workDiv，並清除它們的活躍狀態和綁定事件
    [
        { div: workDivs[0], key: 'work_div_0' },
        { div: workDivs[1], key: 'work_div_1' },
        { div: workDivs[2], key: 'work_div_2' }
    ].forEach(item => {
        if (item.div) { // 確保 div 元素存在
            // 修正：動態獲取當前 workDiv 中的按鈕
            const currentButtonsInDiv = getButtonsInWorkDiv(item.div);
            currentButtonsInDiv.forEach((button, index) => {
                // 先移除可能存在的舊監聽器，避免重複綁定
                button.removeEventListener('click', handleCategoryButtonClick); // 注意這裡的函數名，這是新的處理函數
                button.classList.remove('active-selected-button'); // 移除視覺選中狀態
                // 重新綁定事件
                button.addEventListener('click', handleCategoryButtonClick); // 綁定到新的處理函數
                // 將按鈕的 categoryIndex 和 buttonIndex 存入 dataset，方便在事件中獲取
                button.dataset.categoryIndex = item.key.replace('work_div_', ''); // 例如 '0', '1', '2'
                button.dataset.buttonIndex = index;
            });
        }
    });

    console.log("所有按鈕事件已重新綁定，選中狀態已清除。");
}

/**
 * 最終報告生成 (在 Stop 或需要時呼叫)
 */
function generateFinalReport() {
    console.log("\n--- 最終組合統計報告 ---");
    // 使用 workDivs 陣列來訪問 workDiv 元素
    const buttons0 = workDivs[0] ? getButtonsInWorkDiv(workDivs[0]) : [];
    const buttons1 = workDivs[1] ? getButtonsInWorkDiv(workDivs[1]) : [];
    const buttons2 = workDivs[2] ? getButtonsInWorkDiv(workDivs[2]) : [];

    let hasData = false;
    for (let i = 0; i < threeDArray.length; i++) {
        for (let j = 0; j < threeDArray[i].length; j++) {
            for (let k = 0; k < threeDArray[i][j].length; k++) {
                const count = threeDArray[i][j][k];
                const totalTime = combinationTimes[i][j][k];

                if (count > 0 || totalTime > 0) {
                    hasData = true;
                    const btn0Text = buttons0[i] ? buttons0[i].textContent.trim() : `WorkDiv0-Button${i}`;
                    const btn1Text = buttons1[j] ? buttons1[j].textContent.trim() : `WorkDiv1-Button${j}`;
                    const btn2Text = buttons2[k] ? buttons2[k].textContent.trim() : `WorkDiv2-Button${k}`;

                    console.log(
                        `組合: [${btn0Text}]-[${btn1Text}]-[${btn2Text}] | ` +
                        `發生次數: ${count} 次 | ` +
                        `累積時間: ${totalTime.toFixed(2)} 秒`
                    );
                }
            }
        }
    }
    if (!hasData) {
        console.log("目前沒有任何組合記錄。");
    }
    console.log("----------------------");
}

// --- 啟用/禁用 Show Result 和 Download 按鈕 ---
function toggleShowDownloadButtons(enable) {
    if (showResultButton) {
        showResultButton.disabled = !enable;
        if (!enable) {
            showResultButton.classList.add('disabled');
        } else {
            showResultButton.classList.remove('disabled');
        }
    }
    // 對 id="download" 按鈕進行啟用/禁用
    if (downloadDropdownToggle) {
        downloadDropdownToggle.disabled = !enable;
        if (!enable) {
            downloadDropdownToggle.classList.add('disabled');
        } else {
            downloadDropdownToggle.classList.remove('disabled');
        }
    }
}