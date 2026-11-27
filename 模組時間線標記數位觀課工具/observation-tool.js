const obsPreferences = ObservationRecovery.preferences("MTC");

var data = [];
var vardata = [];
var tmp;
var ticks = 0;
var masterRunning = false;
var masterEnd = false;
var subTime = [];
var startTime;
var getTime = false;
var itemNum = 0;
var module = 0;
var isMobile = isMobile();
var counts = {};
var lastNumber = null;
var group_1 = null;
var group_2 = null;
let getZipButton;    // 新增對 getAllFileZip 的引用
let sequenceResult = [];
// Saving data as csv-file, default filename is current date 
var filename;

let matrix = [];
document.getElementById("filename").value = new Date().toLocaleDateString();

// --- 初始化函數 (在 DOMContentLoaded 事件中調用) ---
document.addEventListener('DOMContentLoaded', function () {
    getZipButton = document.getElementById('getAllFileZip');
    if (!getZipButton) {
        console.error("錯誤：找不到 ID 為 'getAllFileZip' 的元素。");
    }
    if (getZipButton) {
        getZipButton.addEventListener('click', downloadZipFile);
    }
});
function isMobile() {
    try {
        document.createEvent("TouchEvent"); return true;
    } catch (e) {
        return false;
    }
}
var btninptDiv = document.getElementById("divButtons");
var groupColor = ["btn-outline-primary", "btn-outline-success", "btn-outline-danger"]

const MODULES = [
    ["1.接納學生的情感", "2.稱讚或鼓勵", "3.接受或利用學生的想法", "4.問問題", "5.講述", "6.指示", "7.批評學生或維護權威", "8.學生被動發言", "9.學生主動發言", "0.安靜或混亂"],//FIAS
    ["1.教師主動教學", "2.教師被動教學", "3.學生主動學習", "4.學生被動學習", "5.安靜", "6.吵雜", "7.其他"],//TPI
    [["1.教師A語言發言", "2.教師B語言發言", "3.非語言教學行為", "4.教師非教學行為"], ["5.學生A語言發言", "6.學生B語言發言", "7.非語言學習行為", "8.學生非學習行為"], ["9.其它"]],//LUBT
    [["1.教師導學-講述", "2.教師導學-提問", "3.教師導學-回饋或檢視", "4.教師非教學行為"], ["5.組內共學", "6.組間互學", "7.學生自學", "8.學生非學習行為"], ["9.其它"]]//FLSRL
];
var moduleName = ["FIAS", "TPI", "LUBT", "FLSRL"];
var moduleNameCHT = ["佛蘭德斯互動分析", "師生互動", "雙語教學語言使用", "自主學習四學架構("];

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
    ++ticks;
    //console.log(ticks); // time goes up
    var minutes = Math.floor(ticks / 60);
    var seconds = ticks - (60 * minutes);
    if (seconds.toString().length < 2) { seconds = '0' + seconds.toString() }
    if (minutes.toString().length < 2) { minutes = '0' + minutes.toString() }
    document.getElementById("MasterTime").innerHTML = minutes + ':' + seconds;
};

// Define what to do if something goes wrong
var doError = function () {
    console.warn('The drift exceeded the interval.');
};

// (The third argument is optional)
var ticker = new AdjustingInterval(doWork, 1000, doError);


//control btn generation
function btnGen() {
    module = parseInt(document.getElementById("module").value);
    if (module !== 1) {
        if ($(".dropdown-item[onclick='getFreqData()']").hasClass("d-none")) {
            $(".dropdown-item[onclick='getFreqData()']").removeClass("d-none");
        }
    } else {
        if (!$(".dropdown-item[onclick='getFreqData()']").hasClass("d-none")) {
            $(".dropdown-item[onclick='getFreqData()']").addClass("d-none");
        }
    }
    clearButtonDiv(); // clear current buttons before creating new buttons
    if (module <= 1) {//module:FIAS,TPI
        itemNum = MODULES[module].length;
        for (var i = 0; i < itemNum; i++)
            addButton(MODULES[module][i], 0, i);
    } else {//module:CLIL,DL
        itemNum = 0;
        for (var i = 0; i < MODULES[module].length; i++) {//i:group
            for (var j = 0; j < MODULES[module][i].length; j++)
                addButton(MODULES[module][i][j], i, itemNum++);
        }
    }
}
// Add button
function addButton(btnName, gupName, btnNum) {
    var inpt = document.createElement("input");
    var lbl = document.createElement("label");
    var id = btnNum;

    inpt.type = "radio";
    inpt.className = "btn-check";
    inpt.name = gupName;
    inpt.id = id;
    inpt.value = btnNum;
    inpt.autocomplete = "off";

    lbl.className = "btn btn-lg fs-3 py-xl-4 py-md-3 py-2 " + groupColor[gupName] + " col-10 col-sm-10 col-md-5 d-flex align-items-center justify-content-center disabled" + (isMobile ? " mobile-device" : "");
    lbl.setAttribute("for", id);
    lbl.addEventListener("click", timeStamp, false);

    lbl.innerHTML = btnName;
    btninptDiv.appendChild(inpt);
    btninptDiv.appendChild(lbl);
}
//btn action
var preIdx = [-1, -1, -1];
function timeStamp(event) {
    var idx = event.target.htmlFor;
    var group = document.getElementById(idx).name;
    var check = document.getElementById(idx).checked;
    if (check) {
        $("#" + idx).prop("checked", false);
        event.preventDefault();
        data[idx * 2 + 1].push(ticks);
        subTime[idx] += ticks - data[idx * 2][data[idx * 2].length - 1];
        preIdx[group] = -1;
    } else {
        if (preIdx[group] >= 0) {
            data[preIdx[group] * 2 + 1].push(ticks);
            subTime[preIdx[group]] += ticks - data[preIdx[group] * 2][data[preIdx[group] * 2].length - 1];
            preIdx[group] = -1;
        }
        data[idx * 2].push(ticks);
        preIdx[group] = idx;
    }
    if (module === 0) {
        const currentNum = idx;
        if (lastNumber === '3' || lastNumber === '7' || lastNumber === '8') {
            const key = `${lastNumber}-${currentNum}`;
            if (counts[key] !== undefined) {
                counts[key]++;
            }
        }
        lastNumber = currentNum;
    } else if (module === 2) {
        const currentNum = idx;
        if (check) {
            return;
        }
        if (currentNum <= 3) {
            if ($("input[name='1']:checked").length > 0) {
                lastNumber = parseInt($("input[name='1']:checked")[0].value, 10);
            } else {
                return;
            }
        } else if (3 < currentNum <= 7) {
            if ($("input[name='0']:checked").length > 0) {
                lastNumber = parseInt($("input[name='0']:checked")[0].value, 10);
            } else {
                return;
            }
        } else {
            return;
        }
        const key = `${lastNumber}-${currentNum}`;
        if (counts[key] !== undefined) {
            counts[key]++;
        }
    } else if (module === 3) {
        const currentNum = idx;
        if (currentNum === 8) {
            return;
        } else if (currentNum <= 3) {
            if (group_1 === currentNum) {
                group_1 = null;
            } else {
                group_1 = currentNum;
            }
        } else if (3 < currentNum <= 7) {
            if (group_2 === currentNum) {
                group_2 = null;
            } else {
                group_2 = currentNum;
            }
        }
        if (group_1 !== null && group_2 !== null) {
            var key_1 = `${group_1}+${group_2}`;
            var key_2 = `${group_2}+${group_1}`;
            if (counts[key_1] !== undefined) {
                counts[key_1]++;
            } else if (counts[key_2] !== undefined) {
                counts[key_2]++;
            }
        }
    }
}
//main flow control
function flowStartPause() {
    if (masterRunning) {
        flowPause();
    } else {
        if (!getTime) {
            flowStart();
        };
        flowResume();
    }
}
function flowStopReset() {
    if (masterEnd) {
        if (confirm('清除目前的觀課記錄？')) flowReset();
    } else {
        flowStop();
    }
}
function flowStart() {
    //data prepare
    var time = new Date();
    var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
    var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
    startTime = h + ":" + m;
    getTime = true;

    switch (module.toString()) {
        case '0': //FIAS
            counts = {
                '7-0': 0, '7-1': 0, '7-2': 0, '7-3': 0, '7-4': 0, '7-5': 0, '7-6': 0, '7-9': 0, '8-0': 0, '8-1': 0, '8-2': 0, '8-3': 0, '8-4': 0, '8-5': 0, '8-6': 0, '8-9': 0, '3-4': 0, '3-7': 0, '3-9': 0
            };
            break;
        case '2': //LUBT
            counts = {
                '0-4': 0, '0-5': 0, '0-6': 0, '0-7': 0, '1-4': 0, '1-5': 0, '1-6': 0, '1-7': 0, '4-0': 0, '4-1': 0, '4-2': 0, '4-3': 0, '5-0': 0, '5-1': 0, '5-2': 0, '5-3': 0
            };
            break;
        case '3': //FLSRL
            counts = {
                '0+4': 0, '0+5': 0, '0+6': 0, '0+7': 0, '1+4': 0, '1+5': 0, '1+6': 0, '1+7': 0, '2+4': 0, '2+5': 0, '2+6': 0, '2+7': 0, '3+4': 0, '3+5': 0, '3+6': 0, '3+7': 0
            };
            break;
    }

    if (module <= 1) {//module:FIAS,TPI
        for (var i = 0; i < MODULES[module].length; i++) {
            data.push(['start ' + MODULES[module][i]]);
            data.push(['stop ' + MODULES[module][i]]);
            subTime.push(0);
        }
    } else {//module:CLIL,DL
        for (var i = 0; i < MODULES[module].length; i++) {//i:group
            for (var j = 0; j < MODULES[module][i].length; j++) {
                data.push(['start ' + MODULES[module][i][j]]);
                data.push(['stop ' + MODULES[module][i][j]]);
                subTime.push(0);
            }
        }
    }

    //flow control
    //UI states
    var btnSR = document.getElementById("flowStpRst");
    let moduleInfoDiv = document.getElementById("moduleInfo");
    moduleInfoDiv.classList.remove('d-none');
    let moduleFullName = ["佛蘭德斯互動分析(FIAS)", "師生互動(TPI)", "雙語教學語言使用 (LUBT)", "自主學習四學架構(FLSRL)"];
    moduleInfoDiv.querySelector('#moduleName').textContent = moduleFullName[module];
    btnSR.classList.remove("btn-danger", "disabled");
    btnSR.classList.add("btn-warning");
    btnSR.innerHTML = "Stop";
    $("#setting").addClass('d-none');
}
function flowPause() {
    //data process
    for (var i = 0; i < preIdx.length; i++) {
        if (preIdx[i] >= 0) {
            data[preIdx[i] * 2 + 1].push(ticks);
            $("#" + preIdx[i]).prop("checked", false);
            subTime[preIdx[i]] += ticks - data[preIdx[i] * 2][data[preIdx[i] * 2].length - 1];
            preIdx[i] = -1;
        }
    }
    //flow control
    ticker.stop();
    masterRunning = false;

    //UI states
    var btnSP = document.getElementById("flowStrPas");
    btnSP.classList.replace("btn-success", "btn-primary");
    btnSP.innerHTML = "Resume";
    $("#divButtons label").addClass("disabled");
}
function flowResume() {
    //data process
    //flow control
    ticker.start();
    masterRunning = true;

    //UI states
    var btnSP = document.getElementById("flowStrPas");
    btnSP.classList.replace("btn-primary", "btn-success");
    btnSP.innerHTML = "Pause";
    $("#divButtons label").removeClass("disabled");
}
function flowStop() {
    //data process
    for (var i = 0; i < preIdx.length; i++) {
        if (preIdx[i] >= 0) {
            data[preIdx[i] * 2 + 1].push(ticks);
            $("#" + preIdx[i]).prop("checked", false);
            subTime[preIdx[i]] += ticks - data[preIdx[i] * 2][data[preIdx[i] * 2].length - 1];
            preIdx[i] = -1;
        }
    }

    //flow control
    ticker.stop();
    masterRunning = false;
    masterEnd = true;

    //UI states
    var btnSP = document.getElementById("flowStrPas");
    var btnSR = document.getElementById("flowStpRst");
    btnSP.classList.add("disabled");

    btnSR.classList.remove("btn-warning");
    btnSR.classList.add("btn-danger");
    btnSR.innerHTML = "Reset";

    if (!$("#divButtons label").hasClass("disabled")) {
        $("#divButtons label").addClass("disabled");
    }
    $("#divOperate button").removeClass("disabled");

    filename = sanitizeName(document.getElementById("filename")?.value || new Date().toLocaleDateString(), 200);
    if (module >= 2) {//LUBT, FLSRL
        $("#btnSequenceLog").addClass("d-none");
        $("#btnMatrixImg").addClass("d-none");
        $("#btnMatrixXLSX").addClass("d-none");
    }/*  else if (filename == "test") {// --- 測試範例 ---
        if (module == 0) {
            sequenceResult = [4, 9, 5, 8, 5, 2, 9, 0, 7, 5, 7, 8, 0, 2, 9, 9, 9, 8, 7, 5, 3, 3, 0, 2, 2, 3, 7, 6, 2, 3, 0, 4, 3, 7, 5, 8, 5, 6, 6, 6, 6, 2, 4, 8, 6, 8, 4, 4, 9, 3, 2, 1, 7, 0, 1, 8, 9, 1, 2, 2, 0, 0, 5, 1, 8, 1, 5, 2, 6, 4, 5, 7, 4, 6, 7, 0, 6, 9, 8, 8, 4, 7, 7, 8, 1, 2, 2, 0, 8, 1, 7, 1, 8, 0, 9, 8, 9, 0, 3, 9, 4, 0, 0, 8, 9, 3, 3, 0, 0, 0, 3, 2, 0, 9, 1, 6, 0, 9, 7, 2, 9, 5, 6, 3, 1, 1, 7, 1, 2, 4, 9, 0, 3, 9, 4, 7, 4, 0, 5, 7, 9, 2, 3, 7, 2, 1, 7, 9, 9, 8, 1, 9, 1, 4, 2, 1, 0, 6, 8, 1, 0, 9, 8, 7, 3, 1, 5, 9, 3, 9, 5, 6, 1, 0, 5, 1, 8, 6, 7, 5, 0, 7, 6, 9, 4, 6, 1, 6, 4, 2, 9, 4, 3, 2, 1, 5, 9, 8, 8, 9, 1, 4, 4, 3, 6, 4, 0, 8, 6, 9, 2, 6, 8, 0, 9, 7, 5, 9, 5, 2, 4, 8, 3, 6, 6, 8, 6, 1, 3, 7, 7, 9, 1, 5, 8, 6, 5, 3, 5, 5, 9, 4, 8, 3, 7, 0, 2, 9, 7, 4, 9, 0, 8, 2, 9, 0, 4, 7, 4, 3, 6, 3, 6, 0, 6, 3, 7, 4, 5, 4, 8, 0, 8, 1, 0, 6, 7, 4, 4, 0, 2, 6, 7, 6, 7, 8, 2, 9, 5, 0, 6, 2, 7, 3, 0, 6, 8, 2, 4, 9, 3, 7, 1, 7, 5, 3, 9, 9, 7, 1, 3, 7, 6, 8, 8, 6, 1, 0, 1, 9, 8, 9, 0, 5, 0, 0, 4, 1, 9, 4, 5, 6, 2, 1, 5, 7, 5, 1, 4, 7, 8, 1, 8, 8, 3, 8, 7, 6, 8, 6, 3, 2, 3, 7, 5, 6, 9, 4, 9, 0, 5, 9, 0, 7, 9, 5, 5, 9, 6, 1, 8, 8, 9, 8, 6, 1, 7, 2, 2, 7, 4, 6, 5, 4, 3, 5, 6, 9, 5, 9, 4, 7, 0, 7, 4, 3, 3, 4, 2, 9, 4, 5, 9, 4, 4, 1, 6, 0, 5, 9, 2, 4, 5, 8, 3, 3, 1, 9, 0, 4, 2, 5, 2, 2, 3, 4, 5, 1, 3, 3, 0, 2, 8, 6, 0, 1, 7, 9, 1, 8, 7, 3, 0, 0, 6, 6, 1, 5, 5, 6, 7, 4, 8, 8, 0, 9, 3, 9, 6, 3, 8, 3, 7, 6, 5, 0, 3, 5, 3, 2, 8, 6, 5, 9, 6, 7, 7, 9, 5, 0, 8, 0, 7, 5, 1, 1, 6, 0, 7, 4, 2, 1, 9, 7, 4, 3, 1, 9, 6, 9, 2, 0, 6, 2, 3, 6, 3, 0, 6, 9, 1, 8, 2, 4, 2, 7, 0, 0, 2, 5, 9, 9, 8, 3, 8, 0, 0, 2, 5, 6, 4, 6, 2, 2, 1, 6, 1, 7, 6, 4, 9, 6, 4, 7, 3, 6, 7, 5, 7, 4, 2, 5, 8, 2, 4, 9, 1, 2, 2, 9, 9, 4, 5, 1, 9, 1, 8, 7, 4, 2, 6, 7, 0, 3, 3, 7, 7, 4, 4, 9, 6, 0, 7, 2, 5, 0, 7, 6, 2, 4, 7, 7, 9, 7, 2, 3, 8, 5, 9, 5, 1, 9, 7, 3, 8, 0, 6, 4, 1, 9, 9, 1, 8, 0, 6, 7, 2, 0, 7, 6, 5, 1, 2, 7, 3, 1, 4, 2, 1, 4, 3, 8, 7, 1, 2, 0, 4, 2, 7, 5, 6, 8, 1, 2, 2, 4, 0, 9, 1, 9, 9, 9, 2, 9, 1, 2, 3, 3, 4, 0, 8, 4, 0, 2, 2, 9, 4, 4, 1, 4, 6, 1, 0, 5, 7, 3, 1, 0, 6, 4, 8, 9, 2, 2, 2, 1, 8, 7, 8, 5, 6, 7, 2, 6, 2, 5, 7, 5, 0, 0, 5, 1, 6, 7, 7, 5, 1, 7, 5, 9, 2, 6, 9, 8, 4, 9, 4, 5, 0, 7, 6, 1, 7, 4, 8, 1, 5, 0, 7, 5, 6, 2, 7, 6, 1, 4, 8, 1, 7, 3, 7, 7, 5, 4, 7, 5, 3, 7, 4, 2, 4, 0, 9, 3, 9, 8, 9, 8, 4, 0, 8, 8, 3, 0, 9, 8, 3, 1, 9, 3, 5, 7, 2, 8, 5, 5, 6, 8, 9, 9, 6, 5, 8, 3, 5, 0, 5, 3, 9, 3, 0, 4, 0, 8, 4, 7, 4, 4, 4, 3, 3, 1, 3, 9, 0, 0, 4, 7, 5, 4, 9, 3, 8, 9, 0, 6, 6, 7, 8, 1, 1, 3, 1, 3, 8, 6, 8, 6, 5, 0, 5, 9, 1, 9, 4, 7, 9, 7, 8, 7, 7, 0, 6, 4, 8, 1, 3, 7, 2, 6, 9, 5, 9, 8, 2, 5, 5, 2, 0, 4, 0, 3, 8, 0, 5, 3, 7, 4, 0, 3, 8, 8, 4, 1, 7, 6, 8, 3, 3, 9, 1, 5, 6, 5, 9, 0, 1, 9, 4, 3, 4, 9, 6, 3, 5, 9, 1, 4, 7, 1, 0, 2, 0, 5, 9, 4, 9, 9, 0, 6, 7, 0, 2, 0, 4, 9, 4, 3, 8, 6, 8, 9, 5, 1, 9, 8, 9, 1, 1, 3, 6, 1, 9, 1, 8, 5, 0, 2, 0, 6, 3, 6, 3, 4, 1, 6, 5, 4, 3, 2, 3, 6, 3, 8, 3, 7, 5, 7, 7, 7, 5, 1, 4, 3, 7, 7, 4, 6, 0, 3, 8, 5, 2, 0, 0, 9, 2, 5, 1, 6, 1, 5, 6, 3, 1, 8, 9, 1, 3, 7, 3, 8, 6, 6, 4, 1, 0, 3, 9, 5, 4, 7, 4, 2, 6, 7, 7, 3, 5, 2, 3, 5, 2, 0, 9, 9, 1, 1, 7, 8, 9, 9, 1, 7, 6, 8, 2, 0, 8, 6, 1, 1, 2, 4, 1, 6, 1, 7, 9, 0, 3, 9, 3, 4, 3, 6, 6, 5, 8, 7, 9, 2, 9, 2, 7, 9, 1, 1, 8, 8, 7, 6, 6, 0, 8, 2, 1, 9, 3, 8, 3, 1, 5, 5, 4, 8, 3, 5, 4, 8, 1, 0, 8, 6, 5, 7, 5, 5, 5, 9, 3, 7, 5, 5, 5, 8, 8, 0, 1, 5, 5, 8, 7, 9, 7, 1, 8, 4, 3, 3, 0, 7, 7, 5, 1, 4, 1, 8, 5, 4, 4, 3, 2, 7, 5, 5, 9, 5, 9, 6, 5, 4, 2, 1, 3, 6, 1, 1, 5, 8, 0, 6, 0, 6, 3, 5, 8, 2, 8, 9, 0, 8, 6, 8, 7, 9, 7, 4, 5, 3, 7, 1, 7, 8, 6, 3, 9, 3, 4, 3, 3, 6, 9, 9, 3, 3, 4, 5, 5, 2, 4, 9, 0, 0, 8, 8, 8, 9, 7, 2, 7, 3, 2, 0, 2, 2, 3, 8, 8, 1, 5, 8, 0, 4, 4, 8, 2, 1, 4, 9, 5, 5, 3, 5, 8, 8, 0, 7, 6, 5, 3, 8, 2, 1, 3, 5, 0, 8, 3, 2, 5, 1, 5, 0, 9, 1, 7, 6, 3, 2, 1, 1, 9, 7, 8, 5, 2, 9, 9, 1, 4, 9, 3, 2, 9, 5, 5, 0, 0, 5, 7, 1, 2, 4, 7, 3, 3, 6, 0, 8, 0, 8, 2, 1, 6, 2, 1, 0, 7, 1, 9, 1, 1, 7, 8, 9, 1, 0, 3, 0, 7, 2, 8, 9, 7, 8, 0, 0, 5, 9, 3, 3, 7, 7, 2, 5, 0, 0, 6, 7, 5, 4, 7, 0, 7, 1, 1, 2, 5, 0, 2, 7, 5, 7, 0, 4, 6, 3, 5, 7, 0, 9, 9, 7, 3, 3, 5, 6, 3, 4, 3, 4, 5, 1, 0, 5, 9, 4, 7, 5, 3, 7, 2, 6, 4, 6, 2, 7, 9, 4, 4, 0, 8, 2, 4, 3, 2, 0, 6, 6, 4, 7, 0, 7, 1, 6, 4, 6, 5, 7, 7, 2, 9, 7, 8, 2, 5, 9, 5, 8, 3, 2, 2, 3, 2, 3, 3, 4, 8, 8, 8, 5, 4, 1, 1, 4, 7, 1, 9, 1, 4, 3, 4, 8, 6, 8, 3, 8, 3, 5, 1, 9, 4, 8, 0, 7, 5, 7, 3, 0, 2, 8, 4, 0, 5, 9, 4, 0, 4, 0, 1, 5, 2, 0, 9, 8, 6, 3, 4, 0, 3, 0, 3, 7, 9, 0, 0, 2, 3, 4, 9, 8, 4, 0, 2, 2, 1, 2, 7, 4, 3, 1, 4, 6, 0, 6, 6, 6, 1, 0, 4, 4, 1, 5, 2, 1, 8, 6, 6, 9, 0, 7, 0, 2, 2, 3, 1, 5, 2, 9, 0, 6, 1, 1, 4, 0, 6, 6, 0, 4, 4, 2, 8, 4, 4, 7, 9, 3, 1, 4, 4, 1, 3, 0, 4, 6, 9, 7, 8, 0, 9, 6, 3, 3, 0, 6, 4, 4, 1, 0, 6, 5, 1, 3, 3, 8, 8, 5, 5, 8, 1, 7, 5, 6, 1, 1, 1, 4, 0, 4, 8, 1, 9, 2, 9, 9, 4, 4, 3, 3, 5, 4, 9, 2, 0, 9, 1, 1, 5, 8, 8, 7, 9, 0, 4, 4, 6, 7, 6, 6, 1, 4, 7, 3, 6, 6, 4, 6, 7, 3, 6, 9, 8, 1, 7, 2, 4, 1, 8, 4, 9, 7, 8, 6, 5, 1, 3, 6, 3, 5, 9, 8, 3, 6, 9, 0, 6, 1, 0, 3, 2, 3, 9, 5, 0, 8, 3, 4, 2, 4, 4, 0, 1, 5, 6, 3, 9, 3, 2, 7, 6, 3, 2, 2, 4, 1, 9, 3, 3, 8, 1, 5, 7, 3, 3, 6, 5, 1, 7, 3, 6, 0, 5, 4, 2, 9, 0, 0, 5, 0, 9, 7, 5, 1, 9, 5, 0, 6, 7, 9, 6, 5, 9, 9, 8, 0, 2, 8, 1, 9, 4, 4, 3, 6, 4, 9, 0, 2, 6, 0, 9, 2, 2, 9, 9, 1, 8, 0, 1, 7, 3, 4, 7, 4, 1, 6, 7, 4, 7, 9, 8, 3, 1, 7, 8, 0, 9, 2, 5, 7, 7, 0, 7, 7, 4, 1, 0, 5, 0, 5, 6, 0, 2, 3, 4, 3, 6, 1, 2, 5, 4, 8, 8, 6, 2, 0, 6, 3, 9, 6, 4, 0, 0, 0, 4, 1, 2, 0, 1, 7, 9, 4, 7, 9, 5, 0, 9, 3, 4, 2, 4, 2, 6, 0, 3, 3, 9, 8, 4, 2, 3, 3, 8, 6, 4, 8, 6, 5, 8, 4, 1, 3, 2, 2, 7, 0, 0, 4, 8, 3, 6, 3, 5, 1, 7, 5, 0, 0, 9, 4, 0, 0, 0, 6, 9, 6, 7, 1, 7, 4, 7, 5, 0, 5, 5, 4, 8, 7, 7, 2, 6, 2, 0, 2, 5, 1, 2, 4, 0, 9, 4, 6, 3, 4, 5, 9, 9, 9, 9, 4, 5, 2, 3, 6, 6, 1, 9, 2, 4, 9, 4, 4, 3, 6, 8, 4, 2, 2, 5, 5, 1, 0, 3, 5, 0, 8, 6, 6, 1, 5, 1, 6, 3, 8, 4, 8, 9, 6, 2, 1, 8, 1, 7, 4, 6, 9, 4, 6, 8, 8, 2, 3, 4, 2, 5, 5, 7, 1, 8, 5, 7, 3, 2, 5, 9, 1, 0, 8, 9, 6, 4, 9, 6, 7, 2, 5, 0, 6, 5, 9, 9, 6, 7, 1, 6, 2, 2, 1, 4, 0, 1, 2, 7, 4, 1, 0, 8, 5, 6, 8, 2, 3, 3, 8, 8, 7, 8, 8, 0, 3, 1, 7, 7, 1, 6, 8, 3, 5, 8, 3, 7, 3, 0, 6, 7, 8, 9, 7, 6, 0, 5, 5, 8, 8, 9, 0, 3, 3, 6, 4, 3, 1, 0, 7, 2, 0, 3, 8, 0, 3, 0, 7, 4, 1, 1, 6, 5, 1, 2, 0, 6, 7, 5, 5, 4, 8, 2, 6, 0, 8, 6, 3, 7, 9, 1, 7, 9, 4, 6, 9, 8, 2, 6, 4, 9, 5, 3, 5, 1, 8, 9, 5, 2, 8, 5, 7, 7, 2, 4, 3, 5, 3, 1, 1, 7, 9, 8, 9, 8, 4, 7, 8, 8, 9, 5, 2, 7, 7, 8, 1, 1, 6, 0, 5, 1, 8, 9, 0, 3, 7, 9, 5, 7, 2, 9, 3, 9, 2, 1, 6, 0, 3, 6, 0, 2, 1, 9, 9, 3, 9, 0, 4, 8, 6, 4, 8, 8, 1, 0, 2, 9, 9, 9, 4, 1, 5, 4, 3, 3, 3, 3, 5, 2, 2, 2, 9, 4, 3, 2, 6, 9, 1, 2, 2, 0, 6, 5, 7, 3, 6, 3, 8, 6, 9, 4, 9, 2, 6, 9, 5, 7, 9, 1, 5, 0, 6, 8, 4, 8, 0, 8, 4, 4, 4, 7, 8, 1, 0, 7, 9, 0, 9, 6, 4, 3, 6, 9, 2, 4, 9, 4, 1, 9, 7, 9, 5, 7, 2, 3, 9, 9, 7, 9, 4, 8, 1, 8, 5, 2, 2, 7, 1, 8, 2, 4, 7, 7, 2, 8, 8, 8, 9, 7, 9, 7, 1, 6, 8, 8, 5, 8, 3, 9, 0, 0, 0, 0, 0, 9, 8, 9, 0, 4, 4, 5, 2, 5, 1, 3, 3, 4, 9, 8, 7, 0, 0, 5, 6, 8, 4, 3, 0, 1, 4, 3, 3, 8, 8, 3, 5, 8, 1, 5, 6, 7, 0, 9, 5, 5, 0, 0, 9, 5, 2, 7, 1, 3, 2, 6, 1, 1, 5, 9, 7, 6, 3, 8, 5, 2, 8, 9, 5, 1, 6, 1, 7, 7, 9, 7, 8, 0, 9, 0, 7, 0, 9, 8, 0, 1, 2, 1, 9, 9, 1, 5, 2, 8, 7, 8, 8, 2, 4, 9, 6, 4, 8, 1, 6, 5, 1, 0, 9, 1, 9, 5, 2, 6, 1, 8, 7, 9, 3, 4, 2, 5, 6, 1, 6, 1, 8, 4, 5, 6, 0, 2, 5, 9, 4, 1, 2, 3, 6, 6, 7, 7, 0, 9, 9, 6, 6, 6, 1, 2, 2, 3, 7, 7, 2, 6, 2];
            console.log("test FIAS");
        }
        else if (module == 1) {
            sequenceResult = [2, 1, 6, 5, 5, 6, 7, 7, 4, 6, 7, 5, 1, 1, 5, 3, 5, 2, 4, 7, 2, 6, 2, 4, 5, 5, 1, 2, 4, 3, 5, 4, 1, 1, 7, 4, 2, 5, 5, 4, 7, 3, 2, 3, 4, 4, 3, 7, 5, 7, 1, 3, 5, 5, 4, 7, 4, 3, 2, 4, 5, 2, 7, 7, 6, 2, 4, 6, 1, 4, 7, 4, 1, 1, 3, 4, 5, 2, 7, 3, 2, 2, 7, 1, 5, 7, 1, 7, 1, 6, 1, 7, 4, 2, 1, 4, 5, 7, 7, 6, 4, 2, 1, 5, 1, 3, 6, 2, 3, 5, 2, 7, 6, 6, 6, 7, 7, 7, 4, 2, 5, 5, 7, 3, 1, 2, 5, 5, 4, 5, 5, 3, 4, 2, 5, 6, 5, 7, 1, 3, 1, 3, 4, 7, 5, 1, 3, 3, 5, 4, 3, 4, 6, 4, 6, 6, 6, 4, 7, 5, 5, 3, 4, 2, 6, 5, 2, 4, 6, 5, 5, 5, 3, 6, 1, 7, 4, 6, 7, 1, 6, 6, 5, 7, 1, 3, 5, 7, 3, 5, 1, 4, 3, 7, 2, 3, 1, 5, 1, 4, 3, 4, 4, 5, 4, 2, 2, 7, 3, 7, 1, 6, 5, 7, 1, 6, 6, 2, 7, 6, 2, 5, 2, 4, 1, 3, 2, 3, 6, 4, 3, 1, 3, 3, 1, 7, 7, 1, 6, 2, 7, 4, 3, 5, 2, 1, 2, 5, 3, 3, 6, 1, 1, 1, 2, 1, 5, 1, 3, 7, 3, 5, 1, 1, 1, 4, 3, 5, 4, 1, 2, 6, 7, 2, 7, 2, 3, 1, 4, 6, 4, 3, 7, 6, 4, 2, 3, 6, 5, 6, 6, 4, 3, 3, 7, 3, 4, 5, 7, 3, 2, 6, 3, 3, 6, 2, 3, 4, 2, 4, 5, 6, 4, 7, 3, 1, 4, 2, 1, 4, 3, 1, 2, 5, 2, 3, 2, 5, 7, 5, 7, 4, 5, 5, 3, 2, 6, 1, 3, 2, 5, 4, 1, 2, 7, 4, 4, 5, 3, 1, 4, 6, 1, 5, 2, 1, 7, 3, 4, 3, 3, 7, 4, 7, 7, 7, 3, 6, 6, 6, 3, 5, 5, 6, 6, 3, 3, 6, 7, 7, 5, 2, 6, 2, 7, 7, 5, 7, 1, 2, 4, 2, 1, 1, 6, 6, 2, 1, 7, 7, 1, 1, 7, 5, 2, 6, 6, 5, 4, 3, 1, 6, 5, 7, 1, 3, 6, 1, 6, 3, 2, 2, 5, 1, 5, 5, 3, 7, 5, 3, 2, 7, 2, 6, 4, 7, 6, 5, 1, 6, 6, 6, 2, 7, 6, 2, 3, 2, 4, 4, 6, 7, 3, 5, 2, 2, 2, 4, 3, 6, 5, 6, 2, 2, 5, 3, 2, 3, 6, 2, 1, 6, 3, 1, 3, 2, 5, 2, 2, 7, 4, 5, 6, 5, 2, 3, 4, 3, 4, 2, 5, 5, 4, 7, 2, 2, 5, 6, 1, 3, 3, 3, 2, 5, 5, 6, 6, 5, 7, 2, 3, 4, 3, 5, 5, 7, 3, 1, 6, 2, 4, 1, 2, 7, 6, 5, 2, 3, 3, 2, 7, 3, 2, 1, 3, 7, 1, 6, 7, 3, 7, 4, 6, 4, 2, 3, 5, 2, 3, 4, 3, 6, 2, 7, 1, 6, 4, 1, 5, 7, 4, 5, 6, 1, 4, 6, 2, 3, 2, 1, 2, 7, 5, 3, 1, 5, 6, 6, 5, 6, 7, 6, 6, 4, 7, 2, 3, 2, 2, 2, 2, 4, 5, 2, 1, 6, 2, 5, 4, 5, 6, 3, 5, 3, 5, 6, 3, 2, 2, 2, 1, 6, 2, 5, 5, 5, 6, 2, 6, 6, 3, 4, 2, 6, 7, 5, 6, 1, 3, 5, 7, 5, 3, 4, 5, 6, 6, 2, 2, 5, 4, 1, 4, 7, 7, 6, 7, 2, 7, 5, 5, 5, 3, 3, 7, 5, 6, 6, 3, 3, 4, 4, 1, 6, 2, 7, 7, 4, 7, 4, 7, 7, 3, 2, 6, 1, 6, 2, 4, 6, 7, 4, 5, 3, 3, 6, 5, 3, 4, 6, 4, 5, 4, 7, 2, 1, 7, 5, 5, 1, 7, 5, 7, 2, 3, 2, 7, 4, 2, 1, 3, 4, 4, 4, 2, 5, 1, 1, 4, 1, 5, 7, 6, 2, 6, 7, 2, 1, 2, 4, 3, 1, 4, 7, 4, 7, 4, 7, 7, 3, 4, 4, 7, 3, 1, 5, 6, 5, 2, 6, 4, 6, 1, 3, 5, 6, 2, 1, 2, 1, 1, 4, 3, 6, 3, 4, 3, 2, 7, 4, 2, 2, 6, 7, 7, 6, 2, 5, 1, 3, 7, 5, 2, 2, 2, 1, 6, 4, 6, 1, 7, 5, 4, 2, 7, 2, 5, 5, 4, 2, 2, 1, 2, 2, 6, 3, 1, 7, 3, 2, 2, 7, 6, 4, 5, 3, 7, 2, 2, 6, 2, 5, 5, 4, 5, 1, 7, 6, 1, 3, 5, 5, 4, 1, 4, 3, 3, 3, 2, 4, 4, 7, 5, 1, 4, 5, 5, 4, 4, 5, 3, 4, 6, 7, 3, 2, 2, 2, 6, 2, 3, 3, 1, 3, 2, 6, 7, 5, 4, 1, 6, 5, 6, 7, 2, 6, 4, 4, 3, 6, 6, 4, 6, 3, 3, 6, 6, 3, 4, 7, 3, 5, 3, 5, 7, 2, 4, 7, 3, 5, 5, 3, 5, 3, 6, 3, 1, 6, 5, 1, 1, 5, 2, 1, 4, 6, 6, 7, 5, 4, 6, 4, 4, 1, 3, 2, 6, 2, 2, 4, 2, 2, 7, 1, 7, 3, 6, 3, 3, 4, 1, 7, 3, 3, 6, 3, 1, 4, 3, 1, 5, 5, 7, 7, 4, 3, 6, 3, 6, 2, 6, 7, 2, 7, 3, 7, 4, 2, 3, 4, 7, 4, 5, 4, 7, 2, 7, 6, 1, 2, 7, 4, 3, 7, 3, 6, 6, 1, 7, 3, 2, 1, 4, 4, 6, 2, 2, 3, 3, 4, 1, 5, 3, 7, 1, 3, 6, 7, 2, 2, 6, 7, 7, 6, 2, 1, 2, 3, 6, 6, 7, 4, 1, 2, 1, 2, 2, 6, 7, 5, 4, 6, 2, 4, 5, 5, 1, 7, 5, 4, 3, 4, 6, 3, 4, 6, 6, 4, 3, 5, 6, 5, 5, 6, 7, 2, 7, 4, 3, 3, 1, 7, 2, 2, 2, 5, 3, 2, 6, 2, 7, 7, 7, 4, 4, 1, 4, 5, 3, 6, 5, 1, 1, 1, 4, 5, 3, 4, 7, 4, 6, 3, 7, 6, 6, 4, 4, 4, 4, 3, 4, 5, 2, 4, 5, 6, 2, 7, 1, 1, 4, 7, 3, 6, 6, 5, 5, 6, 6, 1, 7, 6, 7, 5, 3, 1, 1, 4, 2, 7, 1, 5, 7, 4, 6, 3, 1, 3, 5, 7, 5, 4, 5, 1, 5, 5, 5, 7, 2, 6, 6, 3, 6, 7, 4, 2, 7, 2, 6, 7, 1, 6, 2, 2, 3, 4, 2, 3, 7, 2, 7, 4, 5, 2, 2, 2, 7, 6, 3, 7, 3, 4, 5, 1, 5, 6, 6, 2, 2, 6, 3, 3, 4, 1, 1, 7, 6, 2, 5, 3, 2, 1, 7, 2, 6, 5, 2, 3, 6, 7, 4, 1, 1, 4, 5, 4, 4, 1, 4, 6, 7, 7, 6, 1, 3, 1, 3, 7, 7, 3, 7, 1, 3, 7, 7, 1, 1, 7, 2, 7, 7, 3, 1, 1, 7, 2, 2, 7, 5, 4, 4, 5, 5, 2, 7, 4, 5, 5, 2, 4, 4, 7, 7, 5, 1, 3, 4, 5, 7, 2, 6, 2, 7, 2, 6, 5, 7, 5, 1, 5, 7, 2, 6, 2, 1, 6, 7, 4, 7, 5, 3, 1, 4, 1, 2, 5, 6, 6, 6, 3, 5, 3, 2, 5, 1, 7, 3, 1, 4, 5, 5, 3, 1, 4, 5, 2, 3, 2, 6, 7, 6, 7, 2, 2, 3, 6, 5, 5, 7, 6, 5, 5, 3, 5, 6, 1, 2, 7, 4, 6, 1, 5, 4, 5, 6, 4, 1, 6, 4, 3, 7, 5, 3, 7, 1, 6, 1, 5, 1, 2, 5, 4, 7, 1, 7, 1, 1, 2, 1, 4, 1, 1, 6, 5, 7, 7, 6, 2, 1, 5, 1, 3, 6, 5, 1, 5, 1, 4, 5, 3, 1, 4, 7, 2, 6, 7, 1, 1, 1, 3, 7, 6, 6, 5, 3, 5, 6, 1, 7, 3, 1, 1, 7, 1, 3, 4, 3, 2, 6, 6, 7, 1, 7, 3, 6, 5, 3, 5, 3, 3, 1, 6, 7, 6, 5, 4, 2, 3, 7, 5, 1, 3, 1, 2, 4, 5, 2, 6, 4, 4, 6, 7, 2, 3, 5, 5, 7, 2, 7, 2, 5, 6, 4, 2, 4, 4, 3, 2, 2, 1, 3, 5, 5, 5, 2, 4, 2, 4, 3, 3, 7, 1, 3, 4, 7, 6, 2, 5, 1, 2, 5, 4, 7, 4, 3, 2, 6, 1, 7, 1, 1, 6, 5, 1, 5, 7, 4, 7, 6, 2, 3, 7, 4, 3, 4, 2, 7, 2, 3, 1, 1, 4, 5, 6, 7, 3, 6, 5, 7, 5, 3, 5, 4, 4, 1, 5, 4, 6, 2, 6, 6, 1, 1, 1, 7, 7, 7, 3, 6, 3, 7, 7, 5, 3, 1, 7, 3, 7, 3, 3, 1, 5, 3, 7, 4, 7, 4, 3, 2, 3, 6, 5, 1, 5, 6, 6, 3, 7, 1, 3, 5, 7, 3, 7, 3, 3, 3, 1, 2, 5, 2, 7, 1, 6, 4, 1, 7, 2, 7, 7, 6, 2, 7, 1, 6, 5, 7, 7, 5, 2, 4, 6, 3, 6, 5, 7, 4, 3, 4, 3, 1, 5, 6, 7, 1, 7, 2, 1, 4, 6, 3, 7, 2, 2, 6, 7, 5, 7, 6, 5, 6, 3, 2, 3, 5, 2, 1, 5, 4, 6, 3, 2, 7, 4, 4, 1, 5, 2, 4, 2, 4, 3, 6, 2, 3, 3, 2, 7, 6, 7, 2, 7, 1, 7, 2, 5, 1, 5, 7, 3, 6, 6, 2, 4, 1, 1, 2, 3, 6, 6, 5, 3, 6, 6, 2, 5, 2, 1, 6, 4, 1, 4, 2, 1, 2, 2, 5, 1, 6, 3, 3, 6, 3, 1, 7, 4, 7, 5, 7, 4, 3, 1, 6, 3, 3, 6, 4, 2, 2, 1, 1, 1, 4, 3, 2, 4, 4, 5, 4, 5, 1, 5, 1, 4, 1, 2, 3, 2, 7, 6, 4, 5, 1, 4, 5, 2, 2, 3, 2, 7, 3, 5, 5, 7, 1, 3, 6, 3, 6, 6, 6, 3, 2, 5, 3, 1, 6, 4, 7, 4, 3, 6, 5, 1, 5, 6, 3, 7, 2, 6, 5, 3, 4, 1, 3, 2, 6, 7, 3, 2, 3, 7, 6, 7, 7, 4, 4, 1, 3, 2, 4, 6, 1, 4, 5, 1, 7, 4, 5, 7, 3, 3, 2, 2, 5, 5, 3, 5, 7, 2, 2, 2, 4, 6, 7, 3, 6, 2, 1, 5, 1, 4, 3, 2, 5, 3, 6, 3, 4, 5, 2, 4, 7, 5, 6, 3, 2, 4, 7, 3, 1, 2, 1, 1, 1, 2, 2, 1, 4, 4, 7, 3, 3, 7, 7, 2, 1, 3, 5, 6, 4, 2, 4, 2, 4, 1, 3, 7, 7, 2, 7, 5, 1, 2, 3, 4, 5, 5, 2, 4, 6, 5, 3, 2, 7, 4, 7, 1, 3, 4, 4, 6, 3, 6, 6, 6, 6, 4, 4, 7, 1, 7, 1, 1, 6, 3, 2, 3, 7, 7, 1, 1, 4, 3, 5, 1, 3, 5, 2, 1, 5, 1, 5, 1, 2, 4, 5, 2, 5, 3, 6, 3, 6, 5, 3, 6, 1, 7, 2, 3, 1, 3, 6, 2, 6, 5, 6, 3, 6, 5, 6, 5, 6, 1, 1, 2, 5, 3, 2, 5, 3, 3, 1, 7, 1, 2, 5, 1, 6, 3, 3, 1, 5, 3, 4, 2, 5, 7, 1, 7, 7, 5, 6, 4, 7, 7, 2, 4, 3, 5, 6, 3, 2, 7, 7, 5, 6, 3, 7, 3, 7, 1, 5, 6, 5, 4, 2, 7, 2, 6, 3, 2, 6, 6, 2, 5, 4, 2, 4, 6, 2, 2, 5, 2, 4, 6, 3, 3, 2, 6, 4, 6, 1, 7, 6, 2, 6, 1, 2, 6, 5, 1, 7, 1, 5, 4, 3, 5, 3, 1, 2, 4, 4, 6, 7, 5, 2, 1, 6, 4, 2, 1, 7, 1, 7, 6, 6, 2, 7, 2, 2, 7, 4, 4, 3, 5, 7, 7, 5, 7, 4, 3, 1, 2, 4, 4, 4, 3, 4, 4, 6, 7, 2, 4, 6, 7, 3, 4, 3, 1, 4, 6, 3, 3, 2, 2, 3, 1, 1, 6, 2, 2, 2, 3, 3, 7, 3, 4, 6, 1, 6, 2, 1, 2, 5, 1, 4, 7, 3, 6, 3, 3, 4, 1, 2, 1, 6, 4, 4, 5, 3, 1, 2, 1, 2, 1, 1, 4, 4, 3, 1, 7, 3, 1, 6, 2, 5, 1, 4, 2, 4, 1, 2, 2, 6, 2, 4, 2, 4, 6, 6, 3, 6, 6, 3, 5, 3, 4, 2, 4, 5, 7, 5, 4, 7, 5, 3, 7, 1, 4, 3, 4, 1, 4, 6, 4, 6, 4, 2, 2, 6, 5, 7, 1, 4, 6, 7, 7, 4, 6, 4, 5, 2, 6, 3, 5, 7, 1, 2, 4, 3, 6, 3, 5, 6, 7, 6, 7, 1, 1, 2, 6, 3, 7, 5, 4, 2, 5, 1, 2, 7, 1, 6, 6, 1, 5, 5, 1, 7, 3, 3, 6, 1, 5, 4, 7, 4, 4, 7, 7, 6, 6, 2, 4, 2, 7, 7, 4, 3, 4, 1, 4, 3, 4, 3, 5, 2, 6, 6, 6, 3, 1, 5, 5, 6, 6, 4, 4, 1, 6, 3, 5, 5, 6, 7, 2, 2, 3, 7, 2, 1, 7, 2, 2, 1, 6, 1, 7, 7, 4, 5, 6, 1, 4, 3, 3, 5, 7, 6, 1, 1, 7, 5, 7, 5, 1, 3, 6, 3, 3, 2, 1, 2, 4, 4, 2, 5, 1, 1, 6, 7, 1, 5, 1, 4, 3, 7, 3, 3, 6, 5, 4, 3, 6, 2, 5, 3, 2, 1, 3, 1, 1, 7, 7, 5, 2, 2, 5, 1, 2, 5, 1, 4, 3, 7, 3, 4, 7, 4, 5];
            console.log("test TPI");
        }
        generateInteractionMatrix();
    } */ else {
        convertRecordToSequence();
        generateInteractionMatrix();
    }

}
function flowReset() {
    console.log("flow rest");
    //data process
    preIdx = [-1, -1, -1];
    data.length = 0;
    vardata.length = 0;
    subTime.length = 0;
    sequenceResult.length = 0;
    matrix.length = 0;
    if (module >= 2) {//LUBT, FLSRL
        console.log("hi");
        $("#btnSequenceLog").removeClass("d-none");
        $("#btnMatrixImg").removeClass("d-none");
        $("#btnMatrixXLSX").removeClass("d-none");
    }
    module = 0;
    ticks = 0;
    document.getElementById('module').getElementsByTagName('option')[0].selected = 'selected';
    lastNumber = null;
    group_1 = null;
    group_2 = null;
    for (let key in counts) {
        if (counts.hasOwnProperty(key)) {
            counts[key] = 0;
        }
    }

    //flow control
    getTime = false;
    masterRunning = false;
    masterEnd = false;
    //UI states
    var btnSP = document.getElementById("flowStrPas");
    var btnSR = document.getElementById("flowStpRst");
    btnSP.innerHTML = "Start";
    btnSP.setAttribute("class", "btn btn-primary btn-lg px-4 fs-2");
    btnSR.setAttribute("class", "btn btn-danger btn-lg px-4 fs-2 disabled");
    document.getElementById("MasterTime").innerHTML = "00:00";
    let moduleInfoDiv = document.getElementById("moduleInfo");
    moduleInfoDiv.classList.add('d-none');
    btnGen();
    $("#setting").removeClass('d-none');
    if (!$("#divOperate button").hasClass("disabled")) {
        $("#divOperate button").addClass("disabled");
    }

    clearTimeline();
    clearMatrix();
}

function showResult() {
    createTimeline();
    if (module <= 1) {
        generateMatrixImage();
    }
}

function transpose(inputArray) {
    // find length of longest inner array
    var len = 0;
    for (ii = 0; ii < inputArray.length; ii++) {
        var inputLen = inputArray[ii].length;
        if (inputLen > len) { len = inputLen };
    }
    // if inner arrays length less than longest, add necessary nulls
    for (ii = 0; ii < inputArray.length; ii++) {
        var diff = len - inputArray[ii].length;
        //console.log(diff);
        if (diff > 0) {
            for (jj = 0; jj < diff; jj++) { inputArray[ii].push(null) }
        }
    }
    // return transposed array
    return inputArray[0].map((col, c) => inputArray.map((row, r) => inputArray[r][c]));
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
function clearButtonDiv() {
    const myNode = document.getElementById("divButtons");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }
}

window.addEventListener("online", function (event) {
    event.stopPropagation();
    console.log("網路已重新連線，但不會自動刷新頁面");
});

function subArrSum(arr, start, end) {
    if (end == arr.length) {
        end = -1;
    }
    return arr.slice(start - 1, end).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

/**
 * 將二進位字串轉換為 ArrayBuffer。
 * 這對於將 XLSX.write() 輸出的二進位字串轉換為 Blob 是必要的。
 * @param {string} s 二進位字串
 * @returns {ArrayBuffer}
 */
function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}

/**
 * 淨化檔案名稱或分頁名稱，移除特殊字元並限制長度。
 * @param {string} name 原始名稱字串
 * @param {number} maxLength 字串允許的最大長度
 * @returns {string} 淨化後的名稱
 */
function sanitizeName(name, maxLength) {
    // 移除不適合作為檔案名稱或分頁名稱的特殊字元。
    const sanitized = name.replace(/[\/\\:*?"<>|]/g, '_');
    // 限制字串長度
    return sanitized.substring(0, maxLength);
}

/**
 * 處理記錄資料，並將其轉換為 XLSX 格式的 Blob。
 * @returns {Blob} 包含記錄資料的 XLSX Blob
 */
function recordDataProcess() {
    // 原始程式碼中用來處理資料的部分
    var dataT = transpose(data);

    // 使用 XLSX 函式庫建立工作表和工作簿
    var ws = XLSX.utils.aoa_to_sheet(dataT);
    var wb = XLSX.utils.book_new();

    // 設置分頁名稱，並進行防錯處理
    const sheetName = sanitizeName("Records", 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 將工作簿寫入二進位字串，並轉換為 Blob
    var excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    var blob = new Blob([s2ab(excelBinary)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return blob;
}

function getSequenceLog() {
    convertRecordToSequence();
    var contentString = sequenceResult.join(', ');
    var blobContent = new Blob([contentString], { type: 'text/plain' });
    // 建立檔案名稱，並進行防錯處理
    const rawFilename = document.getElementById("filename")?.value || new Date().toLocaleDateString();
    // 使用新的共用函式來處理檔名，確保沒有特殊字元且長度符合規範
    var fileName = `${moduleName[module]}_${sanitizeName(rawFilename, 200)}_SequenceLog.txt`;
    download(blobContent, fileName, 'text/plain');
}
function getRecordData() {
    // 呼叫新的處理函式來獲取 Blob
    const recordsBlob = recordDataProcess();
    // 建立檔案名稱，並進行防錯處理
    const rawFilename = document.getElementById("filename")?.value || new Date().toLocaleDateString();
    // 使用新的共用函式來處理檔名，確保沒有特殊字元且長度符合規範
    const fileName = `${moduleName[module]}_${sanitizeName(rawFilename, 200)}_Record.xlsx`;
    // 呼叫 download 函式來下載 Blob
    download(recordsBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function getVarData() {
    // 呼叫變異量分析處理函式來獲取 Blob
    const varAnalysisBlob = variableAnalysis();
    // 建立檔案名稱，並進行防錯處理
    const rawFilename = document.getElementById("filename")?.value || new Date().toLocaleDateString();
    // 使用新的共用函式來處理檔名，確保沒有特殊字元且長度符合規範
    const fileName = `${moduleName[module]}_${sanitizeName(rawFilename, 200)}_VariableAnalysis.xlsx`;
    // 呼叫 download 函式來下載 Blob
    download(varAnalysisBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function getFreqData() {
    // 呼叫頻率分析處理函式來獲取 Blob
    const freqAnalysisBlob = frequencyAnalysis();
    // 建立檔案名稱，並進行防錯處理
    const rawFilename = document.getElementById("filename")?.value || new Date().toLocaleDateString();
    const fileName = `${moduleName[module]}_${sanitizeName(rawFilename, 200)}_FrequencyAnalysis.xlsx`;
    // 呼叫 download 函式來下載 Blob
    download(freqAnalysisBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function getMatirxXLSX() {
    // 呼叫頻率分析處理函式來獲取 Blob
    const analysisMatrixBlob = exportMatrixXLSX();
    // 建立檔案名稱，並進行防錯處理

    const rawFilename = document.getElementById("filename")?.value || new Date().toLocaleDateString();
    const fileName = `${moduleName[module]}_${sanitizeName(rawFilename, 200)}_InteractionAnalysisMatrix.xlsx`;
    // 呼叫 download 函式來下載 Blob
    download(analysisMatrixBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function calculateRatio(num, den, counts) {
    const getSum = (input) => {
        // [新功能] 如果傳入的是單一數字 (例如 subArrSum 的結果)
        if (typeof input === 'number') return input;

        if (Array.isArray(input)) {
            return input.reduce((acc, item) => {
                // [新功能] 如果陣列裡裝的是數字 (例如 matrix[3][3]) -> 直接累加
                if (typeof item === 'number') {
                    return acc + item;
                }
                // [舊用法] 如果陣列裡裝的是座標陣列 [r, c] -> 查 counts 表
                else if (Array.isArray(item)) {
                    const [r, c] = item;
                    // 保留原本的邏輯：0 轉 10，並轉為 0-based index
                    const rowIdx = (r === 0 ? 10 : r) - 1;
                    const colIdx = (c === 0 ? 10 : c) - 1;
                    return acc + (counts[`${rowIdx}-${colIdx}`] || 0);
                }
                return acc;
            }, 0);
        }
        return 0;
    };

    const numSum = getSum(num);
    const denSum = getSum(den);

    if (denSum === 0) return "NaN";
    return Number(((numSum / denSum) * 100).toFixed(1));
}

function variableAnalysis() {
    var symbles = [
        ["TT", "PT", "SC", "TRR", "TQR", "TRR89", "TQR89", "PIR", "CCR", "SSR", "PSSR", (ticks >= 3000 ? "i/d" : "I/D"), "TPI"],//FIAS
        ["TT", "PT", "SC", "SSR", "TPI", "TRR", "PIR", "PSLR", "RAPS"],//TPI
        ["TT", "PT", "NNOB", "LA", "LB", "NT", "RTUL", "RPUL"],//LUBT
        ["TT", "PL", "NNOB", "PGLR", "PISR", "TPR", "TIR", "RPI"]//FLSRL
    ];
    var variables = [
        ["教師話語佔比", "學生話語佔比", "安靜或混亂的佔比", "教師回應比例", "教師提問比例", "教師即時回應比例", "教師即時提問比例", "學生開啟對話比例", "教師提問及講述比例", "行為持續佔比", "學生話語持續比例", "教師間接影響與直接影響的比率", "師生互動佔比"],//FIAS
        ["教師話語佔比", "學生話語佔比", "安靜或混亂的佔比", "行為持續佔比", "師生互動佔比", "教師回應比例", "學生開啟對話比例", "學生持續學習比例", "主動與被動風格比率"],//TPI
        ["教師話語佔比", "學生話語佔比", "非教與學及其他行為的佔比", "A語言佔比", "B語言佔比", "非語言教學佔比", "教師使用語言的比率", "學生使用語言的比率"],//LUBT
        ["教師導學佔比", "學生學習佔比", "非教與學及其他行為的佔比", "學生分組學習比例", "學生自學比例", "教師講述比例", "教師互動比例", "講述與互動的比率"]//FLSRL
    ];
    let results = [];
    let total = 0;
    switch (module.toString()) {
        case '0': // FIAS
            total = subArrSum(subTime, 1, 10);

            // TT: subArrSum(1, 7) / total
            results.push(calculateRatio(subArrSum(subTime, 1, 7), total, counts));

            // PT: subArrSum(8, 9) / total
            results.push(calculateRatio(subArrSum(subTime, 8, 9), total, counts));

            // SC: subTime[9] / total
            results.push(calculateRatio(subTime[9], total, counts));

            // TRR: subArrSum(1, 3) / (subArrSum(1, 3) + subArrSum(6, 7))
            results.push(calculateRatio(subArrSum(subTime, 1, 3), (subArrSum(subTime, 1, 3) + subArrSum(subTime, 6, 7)), counts));

            // TQR: subTime[3] / subArrSum(4, 5)
            results.push(calculateRatio(subTime[3], subArrSum(subTime, 4, 5), counts));

            // TRR89
            results.push(calculateRatio([[8, 1], [8, 2], [8, 3], [9, 1], [9, 2], [9, 3]], [[8, 1], [8, 2], [8, 3], [8, 6], [8, 7], [9, 1], [9, 2], [9, 3], [9, 6], [9, 7]], counts));

            // TQR89
            results.push(calculateRatio([[8, 4], [9, 4]], [[8, 4], [8, 5], [9, 4], [9, 5]], counts));

            // PIR: subTime[8] / subArrSum(8, 9)
            results.push(calculateRatio(subTime[8], subArrSum(subTime, 8, 9), counts));

            // CCR [(4,4)+(4,5)+(5,4)+(5,5)]/[C4+C5]
            results.push(calculateRatio([matrix[3][3], matrix[3][4], matrix[4][3], matrix[4][4]], subArrSum(subTime, 4, 5), counts));

            // SSR [(1,1)+(2,2)+(3,3)+(4,4)+(5,5)+(6,6)+(7,7)+(8,8)+(9,9)+(0,0)]/total
            results.push(calculateRatio([matrix[1][1], matrix[2][2], matrix[3][3], matrix[4][4], matrix[5][5], matrix[6][6], matrix[7][7], matrix[8][8], matrix[9][9], matrix[0][0]], total, counts));

            // PSSR
            results.push(calculateRatio([matrix[7][7], matrix[8][8]], subArrSum(subTime, 8, 9), counts));

            // i/d ratio (根據 ticks 判斷條件後計算比例)
            const idNum = ticks >= 3000 ? subArrSum(subTime, 1, 3) : subArrSum(subTime, 1, 4);
            const idDen = ticks >= 3000 ? subArrSum(subTime, 6, 7) : subArrSum(subTime, 5, 7);
            results.push(calculateRatio(idNum, idDen, counts));

            // TPI [(1,8)+(1,9)+(2,8)+(2,9)+(3,8)+(3,9)+(4,8)+(4,9)+(5,8)+(5,9)+(6,8)+(6,9)+(7,8)+(7,9)+(8,1)+(8,2)+(8,3)+(8,4)+(8,5)+(8,6)+(8,7)+(9,1)+(9,2)+(9,3)+(9,4)+(9,5)+(9,6)+(9,7)]/total
            results.push(calculateRatio([matrix[0][7], matrix[0][8], matrix[1][7], matrix[1][8], matrix[2][7], matrix[2][8], matrix[3][7], matrix[3][8], matrix[4][7], matrix[4][8], matrix[5][7], matrix[5][8], matrix[6][7], matrix[6][8], matrix[7][0], matrix[7][1], matrix[7][2], matrix[7][3], matrix[7][4], matrix[7][5], matrix[7][6], matrix[8][0], matrix[8][1], matrix[8][2], matrix[8][3], matrix[8][4], matrix[8][5], matrix[8][6]], total, counts));

            break;

        case '1': // TPI
            // 根據圖表，total 通常指分母總和，這裡依照您原程式碼邏輯定義 C1~C7 為主體
            total = subArrSum(subTime, 1, 7);

            // TT: 100 * [C1 + C2] / total
            results.push(calculateRatio(subArrSum(subTime, 1, 2), total, counts));

            // PT: 100 * [C3 + C4] / total
            results.push(calculateRatio(subArrSum(subTime, 3, 4), total, counts));

            // SC: 100 * [C5 + C6 + C7] / total
            results.push(calculateRatio(subArrSum(subTime, 5, 7), total, counts));

            // SSR: 100 * [(1,1)+(2,2)...+(9,9)] / total
            results.push(calculateRatio([matrix[1][1], matrix[2][2], matrix[3][3], matrix[4][4], matrix[5][5], matrix[6][6], matrix[0][0]], total, counts));

            // TPI: 100 * [(1,3)+(1,4)+(2,3)+(2,4)] / total
            results.push(calculateRatio([matrix[0][2], matrix[0][3], matrix[1][2], matrix[1][3]], total, counts));

            // TRR: 100 * [C2] / [C1 + C2]
            results.push(calculateRatio(subTime[1], subArrSum(subTime, 1, 2), counts));

            // PIR: 100 * [C3] / [C3 + C4]
            results.push(calculateRatio(subTime[2], subArrSum(subTime, 3, 4), counts));

            // PSLR: 100 * [(3,3)+(4,4)] / [C3 + C4]
            results.push(calculateRatio([matrix[3][3], matrix[4][4]], subArrSum(subTime, 3, 4), counts));

            // RAPS: 100 * [C1] / [C2]
            results.push(calculateRatio(subTime[0], subTime[1], counts));

            break;

        case '2':// LUBT
            // 根據 LUBT 結構，總共有 9 類行為 (C1~C9)，total 為所有欄位總和
            total = subArrSum(subTime, 1, 9);

            // TT: 100 * [C1 + C2] / total
            results.push(calculateRatio(subArrSum(subTime, 1, 2), total, counts));

            // PT: 100 * [C5 + C6] / total
            results.push(calculateRatio(subArrSum(subTime, 5, 6), total, counts));

            // NNOB: 100 * [C4 + C8 + C9] / total
            results.push(calculateRatio(subTime[3] + subTime[7] + subTime[8], total, counts));

            // LA: 100 * [C1 + C5] / total
            results.push(calculateRatio(subTime[0] + subTime[4], total, counts));

            // LB: 100 * [C2 + C6] / total
            results.push(calculateRatio(subTime[1] + subTime[5], total, counts));

            // NT: 100 * [C3 + C7] / total
            results.push(calculateRatio(subTime[2] + subTime[6], total, counts));

            // RTUL: 100 * [C1] / [C2]
            results.push(calculateRatio(subTime[0], subTime[1], counts));

            // RPUL: 100 * [C5] / [C6]
            results.push(calculateRatio(subTime[4], subTime[5], counts));
            break;

        case '3': // FLSRL
            total = subArrSum(subTime, 1, 9);

            // TT: 100 * [C1 + C2 + C3] / total
            results.push(calculateRatio(subArrSum(subTime, 1, 3), total, counts));

            // PL: 100 * [C5 + C6 + C7] / total
            results.push(calculateRatio(subArrSum(subTime, 5, 7), total, counts));

            // NNOB: 100 * [C4 + C8 + C9] / total
            results.push(calculateRatio(subTime[3] + subTime[7] + subTime[8], total, counts));

            // PGLR: 100 * [C5 + C6] / [C5 + C6 + C7]
            results.push(calculateRatio(subArrSum(subTime, 5, 6), subArrSum(subTime, 5, 7), counts));

            // PISR: 100 * [C7] / [C5 + C6 + C7]
            results.push(calculateRatio(subTime[6], subArrSum(subTime, 5, 7), counts));

            // TPR: 100 * [C1] / [C1 + C2 + C3]
            results.push(calculateRatio(subTime[0], subArrSum(subTime, 1, 3), counts));

            // TIR: 100 * [C2 + C3] / [C1 + C2 + C3]
            results.push(calculateRatio(subArrSum(subTime, 2, 3), subArrSum(subTime, 1, 3), counts));

            // RPI: 100 * [C1] / [C2 + C3]
            results.push(calculateRatio(subTime[0], subArrSum(subTime, 2, 3), counts));
            break;

    }
    vardata = [
        ["變異量(variable)", "縮寫記號(symbol)", "計算結果(%)"]
    ];

    for (var i = 0; i < symbles[module].length; i++) {
        let resultValue = results[i];

        // 判斷結果是否為 Infinity, -Infinity 或 NaN
        if (!Number.isFinite(resultValue)) {
            // 如果是，將其轉換為 Excel 可以接受的字串
            resultValue = 'devide by zero';
        }

        vardata.push([`${i + 1}.${variables[module][i]}`, symbles[module][i], resultValue]);
    }

    // 使用 XLSX 函式庫建立工作表和工作簿
    var ws = XLSX.utils.aoa_to_sheet(vardata);
    var wb = XLSX.utils.book_new();

    // 設置分頁名稱，並進行防錯處理
    const sheetName = sanitizeName("VariableAnalysis", 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 將工作簿寫入二進位字串，並轉換為 Blob
    var excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    return new Blob([s2ab(excelBinary)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function frequencyAnalysis() {
    var actCombination = [
        ["學生被動發言後接納學生的情感", "學生被動發言後稱讚或鼓勵", "學生被動發言後接受或利用學生的想法", "學生被動發言後問問題", "學生被動發言後講述", "學生被動發言後指示", "學生被動發言後批評學生或維護權威", "學生被動發言後安靜或混亂", "學生主動發言後接納學生的情感", "學生主動發言後稱讚或鼓勵", "學生主動發言後接受或利用學生的想法", "學生主動發言後問問題", "學生主動發言後講述", "學生主動發言後指示", "學生主動發言後批評學生或維護權威", "學生主動發言後安靜或混亂", "教師問問題後講述", "教師問問題後學生被動發言", "教師問問題後安靜或混亂"],
        [''],
        ['教師A語言發言後學生A語言發言', '教師A語言發言後學生B語言發言', '教師A語言發言後學生非語言學習行為', '教師A語言發言後學生非學習行為', '教師B語言發言後學生A語言發言', '教師B語言發言後學生B語言發言', '教師B語言發言後學生非語言學習行為', '教師B語言發言後學生非學習行為', '學生A語言發言後教師A語言發言', '學生A語言發言後教師B語言發言', '學生A語言發言後教師非語言教學行為', '學生A語言發言後教師非教學行為', '學生B語言發言後教師A語言發言', '學生B語言發言後教師B語言發言', '學生B語言發言後教師非語言教學行為', '學生B語言發言後教師非教學行為'],
        ['教師導學—講述+組內共學', '教師導學—講述+組間互學', '教師導學—講述+學生自學', '教師導學—講述+學生非學習行為', '教師導學—提問+組內共學', '教師導學—提問+組間互學', '教師導學—提問+學生自學', '教師導學—提問+學生非學習行為', '教師導學—回饋或檢視+組內共學', '教師導學—回饋或檢視+組間互學', '教師導學—回饋或檢視+學生自學', '教師導學—回饋或檢視+學生非學習行為', '教師非教學行為+組內互學', '教師非教學行為+組間互學', '教師非教學行為+學生自學', '教師非教學行為+學生非學習行為']
    ];
    var numCombination = [
        ['8->1', '8->2', '8->3', '8->4', '8->5', '8->6', '8->7', '8->0', '9->1', '9->2', '9->3', '9->4', '9->5', '9->6', '9->7', '9->0', '4->5', '4->8', '4->0'],
        [''],
        ['1->5', '1->6', '1->7', '1->8', '2->5', '2->6', '2->7', '2->8', '5->1', '5->2', '5->3', '5->4', '6->1', '6->2', '6->3', '6->4'],
        ['1+5', '1+6', '1+7', '1+8', '2+5', '2+6', '2+7', '2+8', '3+5', '3+6', '3+7', '3+8', '4+5', '4+6', '4+7', '4+8']
    ];

    var freqdata = [
        ["行為組合", "按鈕組合", "次數"]
    ];
    var idx = 0;
    for (let k in counts) {
        freqdata.push([`${idx + 1}.${actCombination[module][idx]}`, numCombination[module][idx], counts[k]]);
        idx++;
    }

    // 使用 XLSX 函式庫建立工作表和工作簿
    var ws = XLSX.utils.aoa_to_sheet(freqdata);
    var wb = XLSX.utils.book_new();

    // 設置分頁名稱，並進行防錯處理
    const sheetName = sanitizeName("FrequencyAnalysis", 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 將工作簿寫入二進位字串，並轉換為 Blob
    var excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    return new Blob([s2ab(excelBinary)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function download(content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';

    if (navigator.msSaveBlob) { // IE10
        // `content` 現在已是 Blob，直接傳入即可
        navigator.msSaveBlob(content, fileName);
    } else if (URL && 'download' in a) { // HTML5 A[download]
        // `content` 現在已是 Blob，直接從 Blob 建立 URL
        a.href = URL.createObjectURL(content);
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            // 釋放 URL 資源以避免記憶體洩漏
            URL.revokeObjectURL(a.href);
        }, 100);
    } else {
        // Fallback 方法，需要將 Blob 讀取為 Data URL
        // 這裡需要使用 FileReader 來處理 Blob
        console.warn("瀏覽器不支援 Blob 下載，嘗試使用 FileReader。");
        const reader = new FileReader();
        reader.onload = function (e) {
            location.href = e.target.result;
        };
        reader.readAsDataURL(content);
    }
}

async function downloadZipFile() {
    // 檢查必要的函式庫是否已載入
    if (typeof JSZip === 'undefined') {
        console.error("JSZip 庫未載入。");
        alert("壓縮檔案功能需要 JSZip 庫，請檢查網絡或 HTML 文件。");
        return;
    }

    if (typeof XLSX === 'undefined') {
        console.error("XLSX 庫未載入。");
        alert("壓縮檔案功能需要XLSX 庫，請檢查網絡或 HTML 文件。");
        return;
    }

    const zip = new JSZip();

    // 取得並淨化使用者輸入的檔案名稱
    const rawFilename = document.getElementById("filename")?.value || new Date().toLocaleDateString();
    // 使用新的共用函式來處理檔名，確保沒有特殊字元且長度符合規範
    const filenameValue = sanitizeName(rawFilename, 200);
    const zipFilename = `MTC_${filenameValue}_AllFileZip.zip`;

    if (module <= 1) {//FIAS, TPI獨有
        // 1.1 添加 sequence log
        if (module <= 1) {
            try {
                convertRecordToSequence();
                var contentString = sequenceResult.join(', ');
                var sequenceLogBlob = new Blob([contentString], { type: 'text/plain' });
                zip.file(`${moduleName[module]}_${filenameValue}_SequenceLog.txt`, sequenceLogBlob);
                console.log("SequenceLog TXT 添加到 Zip。");

            } catch (error) {
                console.warn("生成 SequenceLog TXT 失敗，將跳過此檔案:", error);
            }
        }

        //添加 InteractionAnalysisMatrix 圖檔
        let matrixCanvas = document.getElementById("matrixCanvas");
        if (!matrixCanvas) {
            generateMatrixImage();
            matrixCanvas = document.getElementById("matrixCanvas");
        }
        if (matrixCanvas) {
            try {
                const matrixBlob = await new Promise(resolve => matrixCanvas.toBlob(resolve, 'image/png'));
                zip.file(`${moduleName[module]}_${filenameValue}_InteractionAnalysisMatrix.png`, matrixBlob);
                console.log("matrix PNG 添加到 Zip。");
            } catch (error) {
                console.warn("獲取 matrix Canvas 失敗，將跳過此檔案:", error);
            }
        } else {
            console.warn("matrix Canvas (ID: 'canvas') 未找到，將跳過此檔案。");
        }

        //添加 InteractionAnalysisMatrix XLSX 檔案
        try {
            // **重點變更：直接呼叫 exportMatrixXLSX() 獲取 Blob**
            const recordsBlob = exportMatrixXLSX();
            zip.file(`${moduleName[module]}_${filenameValue}_InteractionAnalysisMatrix.xlsx`, recordsBlob);
            console.log("InteractionAnalysisMatrix XLSX 添加到 Zip。");
        } catch (error) {
            console.warn("生成 InteractionAnalysisMatrix XLSX 失敗，將跳過此檔案:", error);
        }
    }

    // 1. 添加 Records XLSX
    try {
        // **重點變更：直接呼叫 recordDataProcess() 獲取 Blob**
        const recordsBlob = recordDataProcess();
        zip.file(`${moduleName[module]}_${filenameValue}_Record.xlsx`, recordsBlob);
        console.log("Records XLSX 添加到 Zip。");
    } catch (error) {
        console.warn("生成 Records XLSX 失敗，將跳過此檔案:", error);
    }

    // 2. 添加 Timeline PNG (此部分不變)
    let timelineCanvas = document.getElementById("timeLineCanvas");
    if (!timelineCanvas) {
        createTimeline();
        timelineCanvas = document.getElementById("timeLineCanvas");
    }
    if (timelineCanvas) {
        try {
            const timelineBlob = await new Promise(resolve => timelineCanvas.toBlob(resolve, 'image/png'));
            zip.file(`${moduleName[module]}_${filenameValue}_Timeline.png`, timelineBlob);
            console.log("Timeline PNG 添加到 Zip。");
        } catch (error) {
            console.warn("獲取 Timeline Canvas 失敗，將跳過此檔案:", error);
        }
    } else {
        console.warn("Timeline Canvas (ID: 'canvas') 未找到，將跳過此檔案。");
    }

    // 3. 添加 VariableAnalysis XLSX
    try {
        // **重點變更：直接呼叫 variableAnalysis() 獲取 Blob**
        const varAnalysisBlob = variableAnalysis();
        zip.file(`${moduleName[module]}_${filenameValue}_VariableAnalysis.xlsx`, varAnalysisBlob);
        console.log("VariableAnalysis XLSX 添加到 Zip。");
    } catch (error) {
        console.warn("生成 VariableAnalysis XLSX 失敗，將跳過此檔案:", error);
    }

    // 4. 添加 FrequencyAnalysis XLSX
    if (module !== 1) { // TPI (module 1) does not have frequency analysis
        try {
            // **重點變更：直接呼叫 frequencyAnalysis() 獲取 Blob**
            const freqAnalysisBlob = frequencyAnalysis();
            zip.file(`${moduleName[module]}_${filenameValue}_FrequencyAnalysis.xlsx`, freqAnalysisBlob);
            console.log("FrequencyAnalysis XLSX 添加到 Zip。");
        } catch (error) {
            console.warn("生成 FrequencyAnalysis XLSX 失敗，將跳過此檔案:", error);
        }
    }



    // 生成並下載 ZIP 文件
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // 使用 FileSaver.js 進行下載
            if (typeof saveAs === 'function') {
                saveAs(content, zipFilename);
                console.log("所有文件壓縮並下載成功！");
            } else {
                console.error("FileSaver.js 庫未載入。請確認您的 HTML 文件中是否正確引入了 FileSaver.js。");
                alert("下載 ZIP 檔案需要 FileSaver.js 庫。");
            }
        })
        .catch(function (error) {
            console.error("生成 ZIP 文件失敗:", error);
            alert("壓縮並下載檔案失敗！");
        });
}


document.addEventListener("DOMContentLoaded", () => {
    const {el, all, obj, num, str, list, clock} = ObservationRecovery;
    const modules = id => id < 2 ? MODULES[id] : MODULES[id].flat();
    el("filename").addEventListener("input", () => {
        filename = sanitizeName(el("filename").value || new Date().toLocaleDateString(), 200);
    });
    ObservationRecovery.install("MTC", {
        config: () => ({module: Number(el("module").value)}),
        validConfig: c => obj(c) && num(c.module) && c.module < MODULES.length,
        apply(c) { el("module").value = c.module; btnGen(); },
        capture: () => getTime || masterEnd ? {phase: masterEnd ? "stopped" : "active",
            data: {data, vardata, ticks, subTime, startTime, counts, lastNumber, group_1, group_2, sequenceResult, matrix, preIdx}} : null,
        validState(s,c,phase) {
            const count = modules(c.module).length;
            const numericId = v => v === null || ((num(v) || str(v) && /^\d+$/.test(v)) && Number(v) < count);
            return obj(s) && num(s.ticks) && str(s.startTime) &&
                list(s.data, row => Array.isArray(row) && str(row[0]) && row.slice(1).every(num), count * 2, count * 2) &&
                list(s.subTime, num, count, count) && obj(s.counts) && Object.values(s.counts).every(num) &&
                list(s.preIdx, value => value === -1 || phase === "active" && value !== null && numericId(value), 3, 3) &&
                [s.lastNumber, s.group_1, s.group_2].every(numericId) &&
                Array.isArray(s.vardata) && Array.isArray(s.sequenceResult) && Array.isArray(s.matrix);
        },
        reset() { ticker.stop(); flowReset(); },
        restore(s, phase) {
            flowStart();
            ({data, vardata, ticks, subTime, startTime, counts, lastNumber, group_1, group_2, sequenceResult, matrix, preIdx} = s);
            el("MasterTime").textContent = clock(ticks);
            all("#divButtons input").forEach(input => { input.checked = preIdx.some(id => String(id) === input.id); });
            masterRunning = false;
            masterEnd = phase === "stopped";
            $("#divButtons label").addClass("disabled");
            $("#flowStrPas").text(masterEnd ? "Start" : "Resume").toggleClass("disabled", masterEnd);
            if (masterEnd) {
                $("#flowStpRst").removeClass("btn-warning").addClass("btn-danger").text("Reset");
                $("#divOperate button").removeClass("disabled");
                $("#btnSequenceLog, #btnMatrixImg, #btnMatrixXLSX").toggleClass("d-none", module >= 2);
            }
        },
        resume: () => flowResume()
    });
});
