// initialize data-array
var data = [];
var UTC_SESSION_KEY = "utcSessionV1";

function setSessionStatus(message) {
    var status = document.getElementById("sessionStatus");
    if (status) status.textContent = message;
}

function saveSession() {
    if (!getTime) return false;

    var buttonNames = Array.from(document.querySelectorAll("#divButtons button"))
        .map(function (button) { return button.textContent; });
    var filenameInput = document.getElementById("filename");
    var session = {
        version: 1,
        data: data,
        ticks: ticks,
        running: running.slice(0, buttonNames.length),
        startTime: startTime,
        filename: filenameInput ? filenameInput.value : filename,
        buttonNames: buttonNames,
        savedAt: Date.now()
    };

    try {
        localStorage.setItem(UTC_SESSION_KEY, JSON.stringify(session));
        setSessionStatus("記錄已自動暫存於此瀏覽器");
        return true;
    } catch (error) {
        console.error("Could not save the current UTC session:", error);
        setSessionStatus("自動暫存失敗，請立即下載 XLSX 備份");
        return false;
    }
}

function restoreSession() {
    try {
        var rawSession = localStorage.getItem(UTC_SESSION_KEY);
        if (!rawSession) return false;

        var session = JSON.parse(rawSession);
        if (!session || session.version !== 1 || !Array.isArray(session.data) ||
            !Array.isArray(session.buttonNames) || session.data.length === 0) {
            return false;
        }

        var buttonNames = session.buttonNames.slice(0, 12);
        if (buttonNames.length === 0) return false;

        localStorage.setItem("buttonNames", JSON.stringify(buttonNames));
        data = session.data;
        ticks = Math.max(0, Number(session.ticks) || 0);
        startTime = session.startTime || "";
        filename = typeof session.filename === "string" ? session.filename : filename;
        getTime = true;
        masterRunning = false;

        running = [];
        inptGen();
        createButtons();
        running = buttonNames.map(function (_, index) {
            return Array.isArray(session.running) && session.running[index] === true;
        });

        var elapsedMinutes = Math.floor(ticks / 60);
        var elapsedSeconds = ticks - (60 * elapsedMinutes);
        document.getElementById("MasterTime").textContent =
            (elapsedMinutes < 10 ? "0" : "") + elapsedMinutes + ":" +
            (elapsedSeconds < 10 ? "0" : "") + elapsedSeconds;
        document.getElementById("filename").value = filename;

        var masterButton = document.getElementById("bM");
        masterButton.textContent = "Start";
        masterButton.classList.remove("btn-success");
        masterButton.classList.add("btn-primary");
        document.getElementById("infoDiv").classList.add("d-none");

        document.querySelectorAll("#divButtons button").forEach(function (button, index) {
            button.classList.remove("disabled");
            if (running[index]) button.style.border = "0.6rem solid #3ddc97";
        });
        document.querySelectorAll("#divOperate button").forEach(function (button) {
            button.classList.remove("disabled");
        });

        setSessionStatus("已復原上次記錄；計時已暫停。按 Start 繼續，按 Reset 清除。");
        return true;
    } catch (error) {
        console.error("Could not restore the saved UTC session:", error);
        setSessionStatus("暫存紀錄無法讀取，原始暫存仍保留");
        return false;
    }
}

function preventPullToRefresh() {
    var touchStartY = null;

    document.addEventListener("touchstart", function (event) {
        if (event.touches.length !== 1) {
            touchStartY = null;
            return;
        }

        var target = event.target;
        if (target.closest && target.closest("input, textarea, select, [contenteditable='true']")) {
            touchStartY = null;
            return;
        }

        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchmove", function (event) {
        if (touchStartY === null || event.touches.length !== 1 || window.scrollY > 0) return;

        var pullDistance = event.touches[0].clientY - touchStartY;
        if (pullDistance > 12) event.preventDefault();
    }, { passive: false });

    document.addEventListener("touchend", function () {
        touchStartY = null;
    }, { passive: true });
    document.addEventListener("touchcancel", function () {
        touchStartY = null;
    }, { passive: true });
}

function clearData() {
    data = [];
    try {
        localStorage.removeItem(UTC_SESSION_KEY);
    } catch (error) {
        console.error("Could not clear the saved UTC session:", error);
    }
    setSessionStatus("已清除暫存紀錄");
}
//console.log(data);		

var tmp;
var ticks = 0;
var masterRunning = false;
var running = []; // as many as buttons
var startTime;
var getTime = false;
var rename = false;


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
    btn.className = "btn btn-primary fs-4 mb-2";
    btn.setAttribute("onclick", functionName);
    btn.innerHTML = name;
    inptdiv.appendChild(btn);
    document.getElementById("divButtons").appendChild(inptdiv);

    /* data.push(['start' + parseInt(numOfButtons)]);
    data.push(['stop' + parseInt(numOfButtons)]); */
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
        stopAll();
    }

    this.clear = function () {
        if (!confirm('Are you sure? Clear data and reset timer.')) return;
        ticker.stop();
        //document.getElementById("bM").style.background = "#0d6efd";
        document.getElementById("bM").innerHTML = "Start";
        if ($("#bM").hasClass("btn-success")) {
            $("#bM").toggleClass("btn-primary");
            $("#bM").toggleClass("btn-success");
        }
        masterRunning = false;
        stopAll();
        ticks = 0;
        document.getElementById("MasterTime").innerHTML = "00:00";
        clearData();
        clearTimeline();
        inptGen();
        getTime = false;
        $("#infoDiv").removeClass('d-none');
        if(!$("#divOperate button").hasClass("disabled")){
            $("#divOperate button").toggleClass("disabled");
        }
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
    console.log(++ticks); // time goes up
    var minutes = Math.floor(ticks / 60);
    var seconds = ticks - (60 * minutes);
    if (seconds.toString().length < 2) { seconds = '0' + seconds.toString() }
    if (minutes.toString().length < 2) { minutes = '0' + minutes.toString() }
    document.getElementById("MasterTime").innerHTML = minutes + ':' + seconds;
    saveSession();
};

// Define what to do if something goes wrong
var doError = function () {
    console.warn('The drift exceeded the interval.');
};

// (The third argument is optional)
var ticker = new AdjustingInterval(doWork, 1000, doError);

// MY functions

function masterStartStop() {
    if (!getTime) {
        saveButtons();
        createButtons();
        $("#infoDiv").addClass('d-none');
        var time = new Date();
        var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
        var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
        startTime = h + ":" + m;
        getTime = true;
        /* document.getElementById('divButtons').childNodes.forEach(function (btn) {
            data.push(['start ' + btn.innerHTML]);
            data.push(['stop ' + btn.innerHTML]);
        }); */
        $("#divButtons button").get().forEach(function (btn) {
            data.push(['start ' + btn.innerHTML]);
            data.push(['stop ' + btn.innerHTML]);
        });
        
    }

    var elem = document.getElementById("bM");
    if (masterRunning == false) {
        ticker.start();
        elem.classList.toggle("btn-primary");
        elem.classList.toggle("btn-success");
        elem.innerHTML = "Pause";
        masterRunning = true;
        if ($("#divButtons button").hasClass("disabled")) {
            $("#divButtons button").toggleClass("disabled");
            $("#divOperate button").toggleClass("disabled");
        }
    } else {
        ticker.stop();
        elem.classList.toggle("btn-primary");
        elem.classList.toggle("btn-success");
        elem.innerHTML = "Start";
        masterRunning = false;
        $("#divButtons button").toggleClass("disabled");
        $("#divOperate button").toggleClass("disabled");
    }
    saveSession();
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
        //document.getElementById("b" + input).style.background = "#3ddc97";
        document.getElementById("b" + input).style.border = "0.6rem solid #3ddc97";
        running[idx] = true;
    }
    else {
        tmp = 'stop' + input;
        data[idx * 2 + 1].push(ticks);
        /* document.getElementById("b" + input).style.background = "#0d6efd"; */
        document.getElementById("b" + input).style.border = "";
        running[idx] = false;
    }
    saveSession();
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
        console.log(diff);
        if (diff > 0) {
            for (jj = 0; jj < diff; jj++) { inputArray[ii].push(null) }
        }
    }
    // return transposed array
    return inputArray[0].map((col, c) => inputArray.map((row, r) => inputArray[r][c]));
}

// Saving data as csv-file, default filename is current date 
var filename = new Date().toLocaleDateString();
document.getElementById("filename").value = filename;
/* 
getData = function () {
    dataT = transpose(data);
    // Building the CSV from the Data two-dimensional array
    // Each column is separated by "," and new line "\n" for next row
    var csvContent = '';
    dataT.forEach(function (infoArray, index) {
        dataString = infoArray.join(',');
        csvContent += index < dataT.length ? dataString + '\n' : dataString;
    });
    download("\uFEFF" + csvContent, "UTC_" + filename + '.csv', 'text/csv;encoding:utf-8');
} */

/**
 * 將二維陣列資料轉置並匯出為 .xlsx 檔案
 */
function getData() {
    try {
        if (!data || data.length === 0) {
            console.error("No data provided for export.");
            return;
        }

        // 資料轉置
        var mydata = data[0].map((_, colIndex) => data.map(row => row[colIndex]));

        // 建立工作簿與工作表 (需引入 SheetJS)
        var workbook = XLSX.utils.book_new();
        var worksheet = XLSX.utils.aoa_to_sheet(mydata);

        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, "UTC_" + filename.replace(/[\\/:*?"<>|]/g, '_') + ".xlsx");

    } catch (error) {
        console.error("Export failed:", error);
    }
}
// Original function for downloading csv by Arne H. Bitubekk @
// https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
// The download function takes a CSV string, the filename and mimeType as parameters
/* var download = function (content, fileName, mimeType) {
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
} */


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
    localStorage.buttonNames = JSON.stringify(buttonNames);
}

function delLocal() {
    localStorage.clear();
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
        if (localStorage.buttonNames) {
            var storedNames = JSON.parse(localStorage.buttonNames);
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
        if (localStorage.buttonNames) {
            var storedNames = JSON.parse(localStorage.buttonNames);
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

window.addEventListener("online", function (event) {
    event.stopPropagation();
    console.log("網路已重新連線，但不會自動刷新頁面");
});

window.addEventListener("pagehide", saveSession);
document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") saveSession();
});
preventPullToRefresh();
