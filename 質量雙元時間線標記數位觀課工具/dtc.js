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
    btn.innerHTML = name;
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
            data.push(['start ' + btn.innerHTML]);
            data.push(['stop ' + btn.innerHTML]);
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
}

function resetStop() {
    if (getTime) {//to stop
        ticker.stop();
        $bm.addClass("disabled");
        $("#divButtons button").addClass("disabled");

        $rsmStp.html("Reset");
        stopAll();

        $("#divOperate button").removeClass("disabled");
    } else {// to reset
        if (ismobile) {
            $("#reminder").removeClass("d-none");
        }
        document.getElementById("MasterTime").innerHTML = "00:00";
        clearData();
        clearTimeline();
        inptGen();
        ticks = 0;

        $bm.html("Start");
        $bm.removeClass("disabled btn-warning btn-success");
        $bm.addClass("btn-primary");

        $("#divOperate button").addClass("disabled");
        $("#infoDiv").removeClass('d-none');
    }
    getTime = false;
    masterRunning = false;
    $("#divText").find('input, button').prop('disabled', true);
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
}

function transpose(inputArray) {
    // 找出最長的子陣列長度，確保所有子陣列等長（填補 null）
    var len = Math.max(...inputArray.map(arr => arr.length));
    inputArray.forEach(arr => {
        while (arr.length < len) arr.push(null);
    });

    // 對原始資料進行轉置：
    // inputArray[0] 是第一列，用它來決定有幾個欄位（c）
    // 對於每個欄位索引 c，從每一列中取出該欄位的值，形成新的一列
    return inputArray[0].map((_, c) => inputArray.map(row => row[c]));
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

function saveButtons() {
    var buttonNames = [];
    buttons = document.getElementById("divButtons");
    var numOfButtons = buttons.childElementCount;
    // for-looppi kaikille napeille
    for (i = 0; i < numOfButtons; i++) {
        var tmpId = "input" + (parseInt(i) + 1);
        var tmpButton = document.getElementById(tmpId);
        buttonNames.push(tmpButton.value);
    }
    localStorage.dtcButtonNames = JSON.stringify(buttonNames);
}

function delLocal() {
    localStorage.clear();
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
    clearButtonDiv(); // clear current buttons before creating new buttons

    if (typeof (Storage) !== "undefined") {
        if (localStorage.dtcButtonNames) {
            var storedNames = JSON.parse(localStorage.dtcButtonNames);
            for (var i = 0; i < storedNames.length; i++) {
                addInput(storedNames[i]);
            }
        } else {
            for (var i = 0; i < 6; i++) {
                addInput(i + 1);
            }
        }
    } else {
        console.log("Sorry, your browser does not support web storage...");
    }
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
    clearButtonDiv(); // clear current buttons before creating new buttons

    if (typeof (Storage) !== "undefined") {
        if (localStorage.dtcButtonNames) {
            var storedNames = JSON.parse(localStorage.dtcButtonNames);
            for (var ii = 0; ii < storedNames.length; ii++) {
                addButton(storedNames[ii]);
            }
        } else {
            for (var ii = 0; ii < 6; ii++) {
                addButton(ii);
            }
        }
    } else {
        console.log("Sorry, your browser does not support web storage...");
    }
}

function sendText() {
    var text = document.getElementById("recordText").value;
    if (text != "") {
        textData.push([ticks, text]);
        document.getElementById("recordText").value = "";
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