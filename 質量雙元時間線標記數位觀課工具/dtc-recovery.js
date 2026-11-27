// initialize data-array
var data = [];
var textData = [];
function clearData() {
    data = [];
    textData = [];
}

var tmp;
var ticks = 0;
var masterRunning = false;
var running = []; // as many as buttons
var startTime;
var getTime = false;
var rename = false;

var $bm = $("#bM");
var $rsmStp = $("#resetStop");

// Saving data as csv-file, default filename is current date 
var filename = new Date().toLocaleDateString();
document.getElementById("filename").value = filename;

var ismobile = isMobile();
function isMobile() {
    try {
        document.createEvent("TouchEvent");
        $("#divText").parent().attr("class", "col-12 mx-auto");
        return true;
    } catch (e) {
        document.getElementById("reminder").classList.add("d-none");
        $("#divText").parent().attr("class", "col-12 col-md-10 col-lg-8 mx-auto");
        return false;
    }
}

// Add button
function addButton(name) {
    buttons = document.getElementById("divButtons");
    var numOfButtons = buttons.childElementCount;

    var id = "b" + parseInt(numOfButtons);
    var functionName = "timeStamp('" + parseInt(numOfButtons) + "')";
    var btn = document.createElement("button");
    var inptdiv = document.createElement("div");
    inptdiv.setAttribute("class", "d-grid col-8 col-sm-7 col-md-5 col-lg-4");

    btn.id = id;
    btn.className = "btn btn-primary fs-3 mb-2";
    btn.setAttribute("onclick", functionName);
    btn.style.border = "5px #0d6efd solid";
    btn.textContent = name;
    inptdiv.appendChild(btn);
    document.getElementById("divButtons").appendChild(inptdiv);

    running.push(false);
}

// Remove Button
function removeInput() {
    if (masterRunning) return alert("No removing buttons while timer is running!");
    buttons = document.getElementById("divButtons")
    var numOfButtons = buttons.childElementCount;
    if (numOfButtons > 2) {
        buttons.removeChild(buttons.lastChild);
        running.pop();
    }
    else { alert("There are 2 buttons at least."); }
}

// Original timer by Leon Williams @
// https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript
/**
 * Self-adjusting interval to account for drifting
 * 
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds) - This 
 * @param {function} errorFunc (Optional) Callback to run if the drift
 *                             exceeds interval
 */
function AdjustingInterval(workFunc, interval, errorFunc) {
    var that = this;
    var expected, timeout;
    this.interval = interval;

    this.start = function () {
        expected = Date.now() + this.interval;
        timeout = setTimeout(step, this.interval);
    }

    this.stop = function () {
        clearTimeout(timeout);
    }

    this.clear = function () {

    }

    function step() {
        var drift = Date.now() - expected;
        if (drift > that.interval) {
            // You could have some default stuff here too...
            if (errorFunc) errorFunc();
        }
        workFunc();
        expected += that.interval;
        timeout = setTimeout(step, Math.max(0, that.interval - drift));
    }
}

// Define the work to be done
var doWork = function () {
    ++ticks; // time goes up
    var minutes = Math.floor(ticks / 60);
    var seconds = ticks - (60 * minutes);
    if (seconds.toString().length < 2) { seconds = '0' + seconds.toString() }
    if (minutes.toString().length < 2) { minutes = '0' + minutes.toString() }
    document.getElementById("MasterTime").innerHTML = minutes + ':' + seconds;
    dtcSave();
};

// Define what to do if something goes wrong
var doError = function () {
    console.warn('The drift exceeded the interval.');
};

// (The third argument is optional)
var ticker = new AdjustingInterval(doWork, 1000, doError);


function masterStartStop() {
    if (!getTime) {
        saveButtons();
        createButtons();

        $("#infoDiv").addClass('d-none');
        if (ismobile) {
            $("#reminder").addClass("d-none");
        }

        //flow control
        getTime = true;

        //data process
        $("#divButtons button").get().forEach(function (btn) {
            data.push(['start ' + btn.textContent]);
            data.push(['stop ' + btn.textContent]);
        });

        var time = new Date();
        var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
        var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
        startTime = h + ":" + m;
    }

    if (masterRunning == false) {//to start/resume
        ticker.start();
        masterRunning = true;

        $bm.removeClass("btn-primary");
        $bm.addClass("btn-warning");
        $bm.html("Pause");

        $rsmStp.html("Stop");

        $('#divText').find('input, button').prop('disabled', false);
        $("#divButtons button").removeClass("disabled");
    } else {//to pause
        ticker.stop();
        stopAll();
        $bm.addClass("btn-success");
        $bm.removeClass("btn-warning");
        $bm.html("Resume");
        masterRunning = false;
        $("#divButtons button").addClass("disabled");
        $('#divText').find('input, button').prop('disabled', true);
    }
    dtcSave();
}

function resetStop() {
    if (!getTime) {
        if (dtcHasSession() && !confirm("Reset 會清除觀課與文字記錄。確定要繼續嗎？")) return;
        dtcReset();
        return;
    }
    ticker.stop();
    stopAll();
    masterRunning = false;
    getTime = false;
    $bm.addClass("disabled");
    $rsmStp.text("Reset");
    $("#divButtons button").addClass("disabled");
    $("#divText button").prop("disabled", true);
    $(dtcDraft).prop("disabled", false).prop("readOnly", true);
    $("#divOperate button").removeClass("disabled");
    dtcSave();
}

function dtcReset() {
    ticker.stop();
    masterRunning = false;
    getTime = false;
    ticks = 0;
    clearData();
    clearTimeline();
    dtcDraft.value = "";
    document.getElementById("MasterTime").textContent = "00:00";
    $bm.removeClass("disabled btn-warning btn-success").addClass("btn-primary").text("Start");
    $rsmStp.text("Reset");
    $("#infoDiv").removeClass("d-none");
    $("#reminder").toggleClass("d-none", !ismobile);
    $("#divText").find("input, button").prop("disabled", true);
    $(dtcDraft).prop("readOnly", false);
    $("#divOperate button").addClass("disabled");
    dtcExport.disabled = true;
    dtcBackupStatus.textContent = "";
    dtcClearSnapshot();
    inptGen();
}

function stopAll() {
    for (var ii = 0; ii < running.length; ii++) {
        if (running[ii] == true) {
            data[ii * 2 + 1].push(ticks);
            document.getElementById("b" + ii).style.border = "";
            running[ii] = false;
        }
    }
}

function timeStamp(input) {
    if (!masterRunning) return;
    var idx = parseInt(input);
    if (running[idx] == false) {
        data[idx * 2].push(ticks);

        document.getElementById("b" + input).style.border = "solid 5px #3ddc97";
        running[idx] = true;
    }
    else {
        data[idx * 2 + 1].push(ticks);
        /* document.getElementById("b" + input).style.background = "#0d6efd"; */
        document.getElementById("b" + input).style.border = "solid 5px #0d6efd";
        running[idx] = false;
    }
    dtcSave();
}

function transpose(inputArray) {
    // 找出最長的子陣列長度，確保所有子陣列等長（填補 null）
    var len = Math.max(...inputArray.map(arr => arr.length));
    return Array.from({length: len}, (_, col) => inputArray.map(row => row[col] ?? null));
}

function getData() {
    var dataT = transpose(data);
    var ws = XLSX.utils.aoa_to_sheet(dataT);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    var content = s2ab(wbout);
    download(content, "DTC_" + filename + "_record.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
function getTextData() {
    if (textData.length == 0) {
        alert("無文字記錄");
        return;
    }

    // 建立 Excel 表格資料
    var dataT = [["序數", "送出時間", "記錄文字"]];
    textData.forEach(function (ary, index) {
        dataT.push([(index + 1), ary[0], ary[1]]);
    });

    var ws = XLSX.utils.aoa_to_sheet(dataT);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TextData");

    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    var content = s2ab(wbout);
    download(content, 'DTC_' + filename + '_textrecord.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
// Original function for downloading csv by Arne H. Bitubekk @
// https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
// The download function takes a CSV string, the filename and mimeType as parameters
function download(content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([content], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob([content], {
            type: mimeType
        }));
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(content); // only this mime type is supported
    }
}

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

let dtcSetupNames;
function saveButtons() {
    dtcSetupNames = currentButtonNames();
    try {
        localStorage.setItem("dtcButtonNames", JSON.stringify(dtcSetupNames));
    } catch (error) {
        // Recording and manual backups also work without browser storage.
    }
}



function enterEvent(event) {
    if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey && masterRunning) {
        event.preventDefault();
        sendText();
    }
}

function clearButtonDiv() {
    const myNode = document.getElementById("divButtons");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }
}

function inptGen() {
    clearButtonDiv();
    running = [];
    if (!dtcSetupNames) {
        try {
            const names = JSON.parse(localStorage.getItem("dtcButtonNames"));
            if (Array.isArray(names) && names.length >= 2 && names.length <= 12) {
                dtcSetupNames = names.map(String);
            }
        } catch (error) {
            // Defaults remain available if browser storage is unavailable.
        }
    }
    (dtcSetupNames || ["1", "2", "3", "4", "5", "6"]).forEach(addInput);
}

function addInput(iptName) {
    var workDiv = document.getElementById("divButtons");
    var iptNum = workDiv.childElementCount;
    if (iptNum < 12) {
        var inptdiv = document.createElement("div");
        var inpt = document.createElement("input");
        var lbl = document.createElement("label");

        inptdiv.setAttribute("class", "form-floating col-8 col-sm-7 col-md-5 col-lg-4")

        inpt.id = "input" + (iptNum + 1);
        inpt.setAttribute("class", "form-control border border-primary");
        inpt.type = "text";
        inpt.value = (iptName == '' ? (iptNum + 1) : iptName);
        inpt.maxLength = "20";

        lbl.innerHTML = "Button " + (iptNum + 1);
        lbl.setAttribute("for", inpt.id);

        inptdiv.appendChild(inpt);
        inptdiv.appendChild(lbl);
        workDiv.appendChild(inptdiv);
        running.push(false);
    } else {
        alert("There are 12 buttons at most.");
    }
}

function createButtons() {
    clearButtonDiv();
    running = [];
    dtcSetupNames.forEach(addButton);
}

function sendText() {
    if (!masterRunning) return;
    var text = document.getElementById("recordText").value;
    if (text != "") {
        textData.push([ticks, text]);
        document.getElementById("recordText").value = "";
        dtcSave();
    }
}

function downloadZipFile() {
    var zip = new JSZip();

    if (!document.getElementById("canvas")) {
        createTimeline();
    }
    var img = document.getElementById("canvas").toDataURL("image/png");
    img = img.split('base64,')[1];
    zip.file("DTC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^_])/g, '_') + "_timeline.png", img, { base64: true });

    // 匯出記錄資料為 Excel
    var dataT = transpose(data);
    var ws1 = XLSX.utils.aoa_to_sheet(dataT);
    var wb1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb1, ws1, "Sheet1");
    var wbout1 = XLSX.write(wb1, { bookType: 'xlsx', type: 'array' });
    zip.file("DTC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^_])/g, '_') + '_record.xlsx', wbout1);

    // 匯出文字記錄為 Excel
    if (textData.length > 0) {
        var textDataXlsx = [["序數", "送出時間", "記錄文字"]];
        textData.forEach((ary, idx) => {
            textDataXlsx.push([(idx + 1), ary[0], ary[1]]);
        });

        var ws2 = XLSX.utils.aoa_to_sheet(textDataXlsx);
        var wb2 = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb2, ws2, "TextData");
        var wbout2 = XLSX.write(wb2, { bookType: 'xlsx', type: 'array' });
        zip.file("DTC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^_])/g, '_') + '_textrecord.xlsx', wbout2);
    }
    zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, "DTC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^_])/g, '_') + "_all_files.zip");
    });
}
window.addEventListener("online", function (event) {
    event.stopPropagation();
    console.log("網路已重新連線，但不會自動刷新頁面");
});

var UTC_PRESETS_KEY = "dtcButtonPresetsV1";

function readPresets() {
    var raw = localStorage.getItem(UTC_PRESETS_KEY);
    var items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) throw new Error("設定格式無法讀取");
    return items;
}

function presetMessage(message) {
    document.getElementById("presetStatus").textContent = message;
}

function refreshPresets(selectedId) {
    try {
        var presets = readPresets();
        var select = document.getElementById("presetSelect");
        select.replaceChildren(new Option("請選擇設定", ""));
        presets.forEach(function (preset) {
            select.add(new Option(preset.name, preset.id));
        });
        if (selectedId) select.value = selectedId;
    } catch (error) {
        presetMessage("無法讀取儲存的設定：" + error.message);
    }
}

function currentButtonNames() {
    var inputs = document.querySelectorAll("#divButtons input");
    if (inputs.length) return Array.from(inputs).map(function (input, index) {
        return input.value.trim() || String(index + 1);
    });
    return Array.from(document.querySelectorAll("#divButtons button")).map(function (button) {
        return button.textContent;
    });
}

function savePreset() {
    try {
        var names = currentButtonNames();
        if (!names.length) return presetMessage("目前沒有可儲存的按鈕。");
        var presets = readPresets();
        var now = new Date();
        var dateName = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
        var sequence = presets.reduce(function (max, item) {
            return item.createdDate === dateName ? Math.max(max, Number(item.sequence) || 0) : max;
        }, -1) + 1;
        var name = sequence === 0 ? dateName : dateName + "-" + sequence;
        while (presets.some(function (item) { return item.name === name; })) {
            sequence++;
            name = dateName + "-" + sequence;
        }
        var id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
        presets.push({ id: id, name: name, buttons: names, createdDate: dateName, sequence: sequence });
        localStorage.setItem(UTC_PRESETS_KEY, JSON.stringify(presets));
        refreshPresets(id);
        presetMessage("已儲存設定：「" + name + "」。");
    } catch (error) {
        presetMessage("無法儲存設定，請確認瀏覽器允許本機儲存。");
    }
}

function selectedPreset(presets) {
    var id = document.getElementById("presetSelect").value;
    return presets.find(function (item) { return item.id === id; });
}

var presetRenameId = null;

function renamePreset() {
    try {
        var presets = readPresets();
        var preset = selectedPreset(presets);
        if (!preset) return presetMessage("請先選擇要重新命名的設定。");
        presetRenameId = preset.id;
        var input = document.getElementById("presetNewName");
        input.value = preset.name;
        document.getElementById("renameControls").hidden = false;
        presetMessage("請輸入新名稱，再按「儲存名稱」。");
        input.focus();
        input.select();
    } catch (error) {
        presetMessage("無法讀取設定，請確認瀏覽器允許本機儲存。");
    }
}

function cancelPresetRename() {
    presetRenameId = null;
    document.getElementById("renameControls").hidden = true;
    presetMessage("已取消重新命名。");
}

function confirmPresetRename() {
    try {
        var presets = readPresets();
        var preset = presets.find(function (item) { return item.id === presetRenameId; });
        if (!preset) return presetMessage("找不到這筆設定，請重新選擇。");
        var name = document.getElementById("presetNewName").value.trim();
        if (!name) return presetMessage("設定名稱不能空白。");
        if (presets.some(function (item) { return item.id !== preset.id && item.name === name; })) {
            return presetMessage("這個名稱已存在，請使用其他名稱。");
        }
        preset.name = name;
        localStorage.setItem(UTC_PRESETS_KEY, JSON.stringify(presets));
        refreshPresets(preset.id);
        presetRenameId = null;
        document.getElementById("renameControls").hidden = true;
        presetMessage("已重新命名為「" + name + "」。");
    } catch (error) {
        presetMessage("無法重新命名設定，請確認瀏覽器允許本機儲存。");
    }
}



const DTC_SESSION_KEY = "dtcObservationSessionV1";
const dtcDraft = document.getElementById("recordText");
const dtcFilename = document.getElementById("filename");
const dtcStatus = document.getElementById("dtcSaveStatus");
const dtcBackupStatus = document.getElementById("dtcBackupStatus");
const dtcExport = document.getElementById("dtcExportBackup");
const dtcImport = document.getElementById("dtcImportBackup");
let dtcLastSnapshot = null;

function dtcHasSession() {
    return getTime || data.length > 0;
}

function dtcSnapshot() {
    return {
        format: "DTC-observation",
        version: 1,
        buttons: currentButtonNames(),
        timeline: data,
        notes: textData,
        seconds: ticks,
        activeMarks: running.slice(0, data.length / 2),
        startedAt: startTime,
        phase: getTime ? "in-progress" : "stopped",
        filename: dtcFilename.value,
        draft: dtcDraft.value
    };
}

function dtcSave() {
    dtcExport.disabled = !dtcHasSession();
    if (!dtcHasSession()) return;
    const snapshot = JSON.stringify(dtcSnapshot());
    if (snapshot === dtcLastSnapshot) return;
    try {
        localStorage.setItem(DTC_SESSION_KEY, snapshot);
        dtcLastSnapshot = snapshot;
        dtcStatus.textContent = "記錄已自動暫存於此瀏覽器。";
    } catch (error) {
        dtcStatus.textContent = "自動暫存失敗。請用「下載觀課備份」保存目前記錄。";
    }
}

function dtcClearSnapshot() {
    try {
        localStorage.removeItem(DTC_SESSION_KEY);
        dtcLastSnapshot = null;
        dtcStatus.textContent = "開始觀課後，記錄會自動暫存於此瀏覽器。";
    } catch (error) {
        dtcStatus.textContent = "無法清除瀏覽器的暫存。重新載入可能顯示先前的記錄。";
    }
}

function dtcParseSnapshot(raw) {
    const saved = JSON.parse(raw);
    const valid = (condition) => {
        if (!condition) throw new Error("這不是完整且相容的 DTC 觀課備份。");
    };
    valid(saved && saved.format === "DTC-observation" && saved.version === 1);
    const {buttons, timeline, notes, seconds, activeMarks, startedAt, phase, filename, draft} = saved;
    const namesValid = Array.isArray(buttons) && buttons.length >= 2 && buttons.length <= 12 &&
        buttons.every(name => typeof name === "string");
    valid(namesValid && Number.isSafeInteger(seconds) && seconds >= 0);
    valid(typeof startedAt === "string" && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(startedAt));
    valid(typeof filename === "string" && typeof draft === "string");
    valid(phase === "in-progress" || phase === "stopped");
    valid(Array.isArray(activeMarks) && activeMarks.length === buttons.length &&
        activeMarks.every(mark => typeof mark === "boolean" && (phase === "in-progress" || !mark)));
    const timeValid = time => Number.isSafeInteger(time) && time >= 0 && time <= seconds;
    valid(Array.isArray(timeline) && timeline.length === buttons.length * 2 &&
        timeline.every(row => Array.isArray(row) && typeof row[0] === "string" && row.slice(1).every(timeValid)));
    buttons.forEach((name, index) => {
        const starts = timeline[index * 2].slice(1);
        const stops = timeline[index * 2 + 1].slice(1);
        valid(starts.length === stops.length + Number(activeMarks[index]));
        valid(starts.every((time, i) => (!i || time >= stops[i - 1]) && (i === stops.length || time <= stops[i])));
        timeline[index * 2][0] = "start " + name;
        timeline[index * 2 + 1][0] = "stop " + name;
    });
    valid(Array.isArray(notes) && notes.every(note =>
        Array.isArray(note) && note.length === 2 && timeValid(note[0]) && typeof note[1] === "string"));
    return saved;
}

function dtcRestore(saved) {
    ticker.stop();
    clearTimeline();
    ticks = saved.seconds;
    data = saved.timeline;
    textData = saved.notes;
    startTime = saved.startedAt;
    getTime = saved.phase === "in-progress";
    masterRunning = false;
    dtcSetupNames = saved.buttons;
    createButtons();
    running = saved.activeMarks;
    $("#divButtons button").addClass("disabled").each(function (index) {
        if (running[index]) this.style.borderColor = "#3ddc97";
    });
    document.getElementById("MasterTime").textContent = sec2time(ticks);
    dtcFilename.value = filename = saved.filename;
    dtcDraft.value = saved.draft;
    $("#infoDiv, #reminder").addClass("d-none");
    $("#divText").find("input, button").prop("disabled", true);
    $(dtcDraft).prop("disabled", getTime).prop("readOnly", !getTime);
    $bm.removeClass("disabled btn-primary btn-warning btn-success");
    $bm.addClass(getTime ? "btn-success" : "btn-primary disabled").text(getTime ? "Resume" : "Start");
    $rsmStp.text(getTime ? "Stop" : "Reset");
    $("#divOperate button").toggleClass("disabled", getTime);
    dtcExport.disabled = false;
}

function dtcRestoreLocal() {
    try {
        const raw = localStorage.getItem(DTC_SESSION_KEY);
        if (!raw) return;
        dtcRestore(dtcParseSnapshot(raw));
        dtcLastSnapshot = raw;
        dtcStatus.textContent = getTime
            ? "已復原上次記錄，計時已暫停。按 Resume 繼續。"
            : "已復原已停止的記錄，可以下載結果。";
    } catch (error) {
        dtcStatus.textContent = "無法讀取自動暫存。若有備份，可用「匯回觀課備份」復原。";
    }
}

dtcExport.addEventListener("click", () => {
    if (!dtcHasSession()) return;
    const backupName = dtcFilename.value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-") || "觀課";
    const backup = new Blob([JSON.stringify(dtcSnapshot(), null, 2)], {type: "application/json"});
    saveAs(backup, "DTC_" + backupName + "_觀課備份.json");
    dtcBackupStatus.textContent = "已交給瀏覽器下載。";
});

dtcImport.addEventListener("change", async () => {
    const file = dtcImport.files[0];
    if (!file) return;
    dtcImport.value = "";
    try {
        const saved = dtcParseSnapshot(await file.text());
        if (dtcHasSession() && !confirm("匯回備份會取代目前的觀課紀錄。確定要繼續嗎？")) {
            dtcBackupStatus.textContent = "已取消匯回。";
            return;
        }
        dtcRestore(saved);
        dtcSave();
        dtcBackupStatus.textContent = getTime
            ? "已匯回備份。計時暫停，按 Resume 繼續。"
            : "已匯回已停止的備份，可以下載結果。";
    } catch (error) {
        dtcBackupStatus.textContent = "匯回失敗。請選擇有效的 DTC 觀課備份（.json）。";
    }
});

function applyPreset() {
    try {
        const preset = selectedPreset(readPresets());
        if (!preset) return presetMessage("請先選擇要套用的設定。");
        if (dtcHasSession() && !confirm("套用設定會捨棄目前的觀課及文字記錄。確定要繼續嗎？")) return;
        localStorage.setItem("dtcButtonNames", JSON.stringify(preset.buttons));
        dtcSetupNames = preset.buttons;
        dtcReset();
        presetMessage("已套用「" + preset.name + "」。");
    } catch (error) {
        presetMessage("無法套用設定，請確認瀏覽器允許本機儲存。");
    }
}

dtcDraft.addEventListener("input", dtcSave);
dtcFilename.addEventListener("input", () => {
    filename = dtcFilename.value;
    dtcSave();
});
window.addEventListener("pagehide", dtcSave);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) dtcSave();
});

let dtcTouchStart;
document.addEventListener("touchstart", event => {
    const target = event.target;
    dtcTouchStart = event.touches.length === 1 && window.scrollY <= 0 &&
        !target.closest?.("input, textarea, select, [contenteditable]") ? event.touches[0] : null;
    for (let node = target; dtcTouchStart && node && node !== document.body; node = node.parentElement) {
        if (node.scrollTop > 0) dtcTouchStart = null;
    }
}, {passive: true});
document.addEventListener("touchmove", event => {
    if (!dtcTouchStart || event.touches.length !== 1 || window.scrollY > 0 || !event.cancelable) return;
    const touch = event.touches[0];
    const dy = touch.clientY - dtcTouchStart.clientY;
    if (dy > 4 && dy > Math.abs(touch.clientX - dtcTouchStart.clientX)) event.preventDefault();
}, {passive: false});
const dtcEndTouch = () => { dtcTouchStart = null; };
document.addEventListener("touchend", dtcEndTouch, {passive: true});
document.addEventListener("touchcancel", dtcEndTouch, {passive: true});
