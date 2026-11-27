var filename = new Date().toLocaleDateString();
document.getElementById("filename").value = filename;

var maxLength = 0;
var createResult = false;


function clearTimeline() {
    if (document.getElementById("canvas") == null) { return; }
    node = document.getElementById("divtimeline");
    removed = document.getElementById("canvas");
    node.removeChild(removed);
}

//get now time String in hh:mm:ss
function getNowTimeString() {
    var time = new Date();
    var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
    var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
    var s = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
    return h + ":" + m + ":" + s;
}
function getMyTimeString(time) {
    var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
    var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
    var s = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
    return h + ":" + m + ":" + s;
}

function getCsvdata() {
    if (data.length == 0) {
        alert('There is no data!');
        return;
    }
    var head_line_1 = ",";
    var head_line_2 = "對象,";
    var content = [];
    var csvContent = '';
    //for (i = 0; i < constOBnum; i++)content[i] = (i + 1) + ",";//Serial number
    obNames.forEach(function (obn, i) { content[i] = obn + ","; });

    data.forEach(function (obData, ob) {
        var lgth = obData.length;
        if (lgth / 2 > maxLength) {
            maxLength = lgth / 2;
        }
        var tmpTime = new Date(startTime);
        for (i = 0; i < obData.length; i += 2) {
            content[ob] += beNames[obData[i][0]] + ",";
            tmpTime = new Date(startTime);
            tmpTime.setSeconds(tmpTime.getSeconds() + obData[i][1]);
            content[ob] += getMyTimeString(tmpTime) + ",";

            tmpTime = new Date(startTime);
            tmpTime.setSeconds(tmpTime.getSeconds() + obData[i + 1][1]);
            content[ob] += getMyTimeString(tmpTime) + ",";
        }
    });

    for (i = 0; i < maxLength; i++) {
        head_line_1 += "第" + (i + 1) + "次,,,";
        head_line_2 += "項目,";
        head_line_2 += "開始時間,";
        head_line_2 += "結束時間,";
    }

    csvContent = head_line_1 + "\n" + head_line_2 + "\n";
    for (i = 0; i < obNames.length; i++) {
        csvContent += content[i] + "\n";
    }

    filename = "TTC_" + document.getElementById("filename").value + "_records" + '.csv';
    download(csvContent, filename, 'text/csv;encoding:utf-8');
}
function getStatisticsCSV() {
    if (data.length == 0) {
        alert('There is no data!');
        return;
    }
    var content = [];
    var line = [];
    data.forEach(function (obData, ob) {
        line[0] = new Array();
        line[0].push(obNames[ob]);
        for (var j = 0; j < beNames.length; j++) {
            line[0].push(beNames[j]);
        }
        line[0].push("小計");

        line[1] = new Array();
        line[2] = new Array();
        line[3] = new Array();
        line[4] = new Array();
        line[5] = new Array();

        line[1].push("次數");
        line[2].push("次數百分比");
        line[3].push("行為時間");
        line[4].push("行為時間百分比");
        line[5].push("課堂時間百分比");

        var subTotalTime = [];
        var totalTime = 0;
        var subFrequency = [];
        var totalFrequency = 0;
        for (var i = 0; i < beNames.length; i++) {
            subTotalTime.push(0);
            subFrequency.push(0);
        }

        for (var i = 0; i < obData.length; i += 2) {
            var subTime = obData[i + 1][1] - obData[i][1];
            subTotalTime[obData[i][0]] += subTime;
            totalTime += subTime;
            subFrequency[obData[i][0]]++;
            totalFrequency++;
        }
        for (var i = 0; i < beNames.length; i++) {
            line[1].push(subFrequency[i]);
            line[2].push(Math.round(subFrequency[i] / totalFrequency * 1000) / 10 + "%");
            line[3].push(secToTimeString(subTotalTime[i]));
            line[4].push(Math.round(subTotalTime[i] / totalTime * 1000) / 10 + "%");
            line[5].push(Math.round(subTotalTime[i] / ticks * 1000) / 10 + "%");
        }
        line[1].push(totalFrequency);
        line[2].push("100%");
        line[3].push(secToTimeString(totalTime));
        line[4].push("100%");
        line[5].push(Math.round(totalTime / ticks * 1000) / 10 + "%");

        content += line[0].join(",") + "\n" +
            line[1].join(",") + "\n" +
            line[2].join(",") + "\n" +
            line[3].join(",") + "\n" +
            line[4].join(",") + "\n" +
            line[5].join(",") + "\n\n";
    });
    filename = "TTC_" + document.getElementById("filename").value + "_statisticsTable" + '.csv';
    download(content, filename, 'text/csv;encoding:utf-8');
}

// ===== 工作表名稱檢測與修正 =====
function sanitizeSheetName(name) {
    // Excel 工作表名稱限制：
    // 1. 最大長度 31 字元
    // 2. 不能包含：\ / ? * [ ] :
    // 3. 不能以單引號開頭或結尾
    
    var sanitized = name
        .replace(/[\\\/\?\*\[\]:]/g, '_')  // 替換非法字元為底線
        .replace(/^'|'$/g, '')              // 移除開頭和結尾的單引號
        .substring(0, 31);                  // 限制長度為 31 字元
    
    // 確保名稱不是空的
    if (sanitized.length === 0) {
        sanitized = 'Sheet1';
    }
    
    return sanitized;
}

// ===== 檔案名稱檢測與修正 =====
function sanitizeFileName(name) {
    // 檔案名稱限制（Windows 最嚴格）：
    // 1. 最大長度 255 字元（包含副檔名）
    // 2. 不能包含：< > : " / \ | ? *
    // 3. 不能以空格或點結尾
    
    var sanitized = name
        .replace(/[<>:"\/\\|?*]/g, '_')     // 替換非法字元為底線
        .replace(/\s+$/g, '')               // 移除結尾空格
        .replace(/\.+$/g, '');              // 移除結尾的點
    
    // 限制長度（保留副檔名空間，假設副檔名最長 10 字元）
    if (sanitized.length > 245) {
        sanitized = sanitized.substring(0, 245);
    }
    
    // 確保名稱不是空的
    if (sanitized.length === 0) {
        sanitized = 'file';
    }
    
    return sanitized;
}

// ===== 共用函數：準備記錄資料 =====
function prepareRecordsData() {
    if (data.length == 0) {
        return null;
    }
    
    var wsData = [];
    var head_line_1 = [""];
    var head_line_2 = ["對象"];
    var content = [];
    
    obNames.forEach(function (obn, i) { 
        content[i] = [obn]; 
    });

    data.forEach(function (obData, ob) {
        var lgth = obData.length;
        if (lgth / 2 > maxLength) {
            maxLength = lgth / 2;
        }
        var tmpTime = new Date(startTime);
        for (i = 0; i < obData.length; i += 2) {
            content[ob].push(beNames[obData[i][0]]);
            
            tmpTime = new Date(startTime);
            tmpTime.setSeconds(tmpTime.getSeconds() + obData[i][1]);
            content[ob].push(getMyTimeString(tmpTime));

            tmpTime = new Date(startTime);
            tmpTime.setSeconds(tmpTime.getSeconds() + obData[i + 1][1]);
            content[ob].push(getMyTimeString(tmpTime));
        }
    });

    for (i = 0; i < maxLength; i++) {
        head_line_1.push("第" + (i + 1) + "次", "", "");
        head_line_2.push("項目", "開始時間", "結束時間");
    }

    wsData.push(head_line_1);
    wsData.push(head_line_2);
    content.forEach(function(row) {
        wsData.push(row);
    });
    
    return wsData;
}

// ===== 共用函數：準備統計資料 =====
function prepareStatisticsData() {
    if (data.length == 0) {
        return null;
    }
    
    var wsData = [];
    var line = [];

    data.forEach(function (obData, ob) {
        line[0] = new Array();
        line[0].push(obNames[ob]);
        for (var j = 0; j < beNames.length; j++) {
            line[0].push(beNames[j]);
        }
        line[0].push("小計");

        line[1] = new Array();
        line[2] = new Array();
        line[3] = new Array();
        line[4] = new Array();
        line[5] = new Array();

        line[1].push("次數");
        line[2].push("次數百分比");
        line[3].push("行為時間");
        line[4].push("行為時間百分比");
        line[5].push("課堂時間百分比");

        var subTotalTime = [];
        var totalTime = 0;
        var subFrequency = [];
        var totalFrequency = 0;
        for (var i = 0; i < beNames.length; i++) {
            subTotalTime.push(0);
            subFrequency.push(0);
        }

        for (var i = 0; i < obData.length; i += 2) {
            var subTime = obData[i + 1][1] - obData[i][1];
            subTotalTime[obData[i][0]] += subTime;
            totalTime += subTime;
            subFrequency[obData[i][0]]++;
            totalFrequency++;
        }
        
        for (var i = 0; i < beNames.length; i++) {
            line[1].push(subFrequency[i]);
            line[2].push(Math.round(subFrequency[i] / totalFrequency * 1000) / 10 + "%");
            line[3].push(secToTimeString(subTotalTime[i]));
            line[4].push(Math.round(subTotalTime[i] / totalTime * 1000) / 10 + "%");
            line[5].push(Math.round(subTotalTime[i] / ticks * 1000) / 10 + "%");
        }
        
        line[1].push(totalFrequency);
        line[2].push("100%");
        line[3].push(secToTimeString(totalTime));
        line[4].push("100%");
        line[5].push(Math.round(totalTime / ticks * 1000) / 10 + "%");

        wsData.push(line[0]);
        wsData.push(line[1]);
        wsData.push(line[2]);
        wsData.push(line[3]);
        wsData.push(line[4]);
        wsData.push(line[5]);
        wsData.push([]);
    });
    
    return wsData;
}

// ===== 共用函數：建立 XLSX 工作簿 =====
function createWorkbook(wsData, sheetName) {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var safeName = sanitizeSheetName(sheetName);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
    return wb;
}

// ===== 下載記錄 XLSX 檔案 =====
function downloadRecordsXlsx() {
    var wsData = prepareRecordsData();
    if (!wsData) {
        alert('There is no data!');
        return;
    }
    
    var wb = createWorkbook(wsData, "Records");
    var baseFilename = "TTC_" + document.getElementById("filename").value + "_records";
    var safeFilename = sanitizeFileName(baseFilename) + ".xlsx";
    XLSX.writeFile(wb, safeFilename);
}

// ===== 下載統計表 XLSX 檔案 =====
function downloadStatisticsXlsx() {
    var wsData = prepareStatisticsData();
    if (!wsData) {
        alert('There is no data!');
        return;
    }
    
    var wb = createWorkbook(wsData, "Statistics");
    var baseFilename = "TTC_" + document.getElementById("filename").value + "_statisticsTable";
    var safeFilename = sanitizeFileName(baseFilename) + ".xlsx";
    XLSX.writeFile(wb, safeFilename);
}

// ===== 下載 ZIP 壓縮檔（包含所有檔案）=====
function downloadZipFile() {
    var zip = new JSZip();
    var userFilename = document.getElementById("filename").value;
    var baseFilename = sanitizeFileName("TTC_" + userFilename);
    
    // Timeline image
    if (!document.getElementById("canvasTimeline")) {
        createTimeline();
    }
    var img = document.getElementById("canvasTimeline").toDataURL("image/png");
    img = img.split('base64,')[1];
    zip.file(baseFilename + "_timeline.png", img, { base64: true, createFolders: false });

    // PieChart images
    if (!document.getElementById("pieChartCanvas_0")) {
        createPieChart();
    }
    for (var i = 0; i < obNames.length; i++) {
        var img = document.getElementById("pieChartCanvas_" + i).toDataURL("image/png");
        img = img.split('base64,')[1];
        zip.file(baseFilename + "_pieChart_" + i + ".png", img, { base64: true, createFolders: false });
    }

    // 記錄 XLSX 檔案
    var wsData_records = prepareRecordsData();
    if (wsData_records) {
        var wb_records = createWorkbook(wsData_records, "Records");
        var xlsxData_records = XLSX.write(wb_records, {bookType: 'xlsx', type: 'array'});
        zip.file(baseFilename + '_records.xlsx', xlsxData_records, { createFolders: false });
    }

    // 統計表 XLSX 檔案
    var wsData_stats = prepareStatisticsData();
    if (wsData_stats) {
        var wb_stats = createWorkbook(wsData_stats, "Statistics");
        var xlsxData_stats = XLSX.write(wb_stats, {bookType: 'xlsx', type: 'array'});
        zip.file(baseFilename + '_statisticsTable.xlsx', xlsxData_stats, { createFolders: false });
    }

    // 產生並下載 ZIP 檔案
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            saveAs(content, baseFilename + "_all_files.zip");
        });
}

function showResult() {
    var dataNum = 0;
    data.forEach(ob => dataNum += ob.length);
    if (dataNum == 0) {
        alert('There is no data!');
        return;
    }

    if (!document.getElementById("canvasTimeline")) {
        createTimeline();
    }

    if (!document.getElementById("pieChartCanvas_0")) {
        createPieChart();
    }
}
function createTimeline() {
    if (document.getElementById("canvasTimeline")) {
        return
    }
    var labels = [];
    var canvas = document.createElement("canvas");
    canvas.setAttribute("class", "img-fluid");
    var ctx = canvas.getContext("2d");
    ctx.font = '12px sans-serif';
    canvas.id = "canvasTimeline";
    document.getElementById("divtimeline").appendChild(canvas);

    var plotWidth; // this from lenght of time
    plotWidth = Math.ceil(ticks / 60) * 20; //20 pixel per min(60sec)

    beNames.forEach(ben => {
        var iconLength = ctx.measureText(":" + ben).width;
        if (iconLength + 5 + 16 > plotWidth) {
            plotWidth = iconLength + 5 + 16;
        }
    });
    var textLength = 0;
    obNames.forEach(function (obn) {
        labels.push(obn);
        var labelLength = ctx.measureText(obn).width;
        if (labelLength > textLength) {
            textLength = labelLength;
        }
    });

    var canvasWidth = plotWidth + textLength + 100;	// add room for totals and then some
    canvas.width = canvasWidth;

    // canvas height
    var topMargin = 45;
    var plotHeight = 80 * obNames.length;
    var iconHeight = 24;
    var canvasHeight = plotHeight + topMargin + 30 + iconHeight * beNames.length;	// add margin and space for ticks
    canvas.height = canvasHeight;

    var plotStart = textLength + 50; // where the plot starts (x), labels to the left

    //postion for labels
    var height = 50; // height of the horizontal bars
    var pos = [];
    for (var pp = 0; pp < obNames.length; pp++) {
        //var step = 20;
        pos.push(pp * plotHeight / data.length + height * 0.5 + topMargin);
    }

    // draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // axes
    ctx.fillStyle = "black"; // drawcolor back to black
    ctx.moveTo(plotStart, plotHeight + topMargin);
    ctx.lineTo(plotStart + plotWidth, plotHeight + topMargin);
    ctx.stroke();

    ctx.moveTo(plotStart, plotHeight + topMargin);
    ctx.lineTo(plotStart, topMargin);
    ctx.stroke();

    // Y-ticks and labels
    for (var ii = 0; ii < data.length; ii++) {
        ctx.font = '12px sans-serif';
        ctx.fillText(labels[ii], plotStart - (ctx.measureText(labels[ii]).width + 10), pos[ii] + height / 2 + 5);
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        // Draw a tick mark 12px long (-6 to 6)
        ctx.moveTo(plotStart - 6, pos[ii] + height / 2);
        ctx.lineTo(plotStart + 6, pos[ii] + height / 2);
        ctx.stroke();
    }

    // axes labels
    ctx.font = '12px sans-serif';
    ctx.fillText('Objects', textLength, topMargin - 10);
    ctx.fillText(document.getElementById("MasterTime").innerHTML, plotStart + plotWidth + ctx.measureText("00").width, plotHeight + topMargin + 25);

    // X-ticks and labels
    ctx.fillText(getMyTimeString(startTime), plotStart - ctx.measureText("00:00:00").width, plotHeight + topMargin + 25);
    for (var ii = 0; ii <= plotWidth / 20; ii++) {//every 1 min, x-ticks mark
        ctx.beginPath(); //?
        ctx.lineWidth = 1;
        // Draw a tick mark 6px long (-3 to 3)
        ctx.setLineDash([]);
        ctx.strokeStyle = "#000000";
        ctx.moveTo(plotStart + 20 * ii, plotHeight + topMargin);
        ctx.lineTo(plotStart + 20 * ii, plotHeight + topMargin + 10);
        ctx.stroke();
        // Draw gridlines
        if (ii > 0 && ii % 5 == 0) {//every 5 min, solid gridlines
            ctx.beginPath();
            ctx.strokeStyle = "#8c8c8c";
            ctx.moveTo(plotStart + 20 * ii, plotHeight + topMargin - 2);
            ctx.lineTo(plotStart + 20 * ii, topMargin);
            ctx.stroke();
            ctx.font = '12px sans-serif';
            ctx.fillText(ii, plotStart + 20 * ii - 5, plotHeight + topMargin + 25);
        }
        else if (ii > 0) {//every 1 min, dashlines
            ctx.beginPath();
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = "#cccccc";
            ctx.moveTo(plotStart + 20 * ii, plotHeight + topMargin - 2);
            ctx.lineTo(plotStart + 20 * ii, topMargin);
            ctx.stroke();
        }
    }

    //barchart bar rect
    var start, len;
    data.forEach(function (bedt, i) {
        var secs = 0;
        for (j = 0; j < bedt.length; j += 2) {
            start = bedt[j][1];
            len = bedt[j + 1][1] - bedt[j][1];
            secs += len;
            ctx.fillStyle = timelineColors[bedt[j][0]];
            ctx.fillRect(plotStart + start / 3, pos[i], len / 3, height);
        }

        ctx.fillStyle = "black";
        ctx.textBaseline = "middle";
        ctx.fillText(secToTimeString(secs), plotStart + plotWidth + 5, pos[i] + height / 2);

    });

    //instra icon
    var iconX = plotStart + 5;
    var iconY = topMargin + plotHeight + 30;

    beNames.forEach(function (ben, i) {
        ctx.fillStyle = timelineColors[i];
        ctx.fillRect(iconX, iconY, 14, 14);
        ctx.fillStyle = "black";
        ctx.textBaseline = "middle";
        ctx.fillText(":" + ben, iconX += 16, iconY + 8);

        iconY += 8 + 16;
        iconX = plotStart + 5;
    });

    ctx.textBaseline = "alphabetic";

    //logo icon
    var imgObject = document.getElementById("logo");
    ctx.drawImage(imgObject, canvasWidth - 50, 0, 50, 18);


    //file name mark
    var filenametxt = "TTC_" + document.getElementById("filename").value + "_timeline";
    ctx.fillStyle = "black";
    ctx.fillText(filenametxt, 0, 10);

    /* canvas.addEventListener('click', function () {
        window.open().document.write('<img style="max-width: 100%;" src="' + canvas.toDataURL() + '" />');
    }, false); */

}

function createPieChart() {
    var piechartDiv = document.getElementById("divPieChart");
    while (piechartDiv.firstChild) {
        piechartDiv.removeChild(piechartDiv.lastChild);
    }
    data.forEach(function (obData, ob) {
        singlePieDiv = document.createElement("div");
        singlePieDiv.setAttribute("class", "d-flex justify-content-center mb2 d-none");
        singlePieDiv.id = "divpc_" + ob;

        var canvas = document.createElement("canvas");
        canvas.setAttribute("class", "img-fluid");
        singlePieDiv.appendChild(canvas);

        var ctx = canvas.getContext("2d");
        var btnAllNames = beNames;
        var totalTime = 0;
        var subTotalTime = [];
        var subTime = 0;
        for (var i = 0; i < beNames.length; i++) { subTotalTime.push(0); }
        for (var i = 0; i < obData.length; i += 2) {
            subTime = obData[i + 1][1] - obData[i][1];
            subTotalTime[obData[i][0]] += subTime;
            totalTime += subTime;
        }

        //get the totalTime of all items(for the rate)
        /* allItemSum.forEach(sums => totalTime += sums); */

        //calculate width and height of canvas
        //draw the icon info
        var progress = -0.5;//start angle of pieChart
        var singleSideWidth = 0, bottomHeight = 0;//for the room of icon info
        var itemCount = 0;//left side reverse icon info
        ctx.font = '16px sans-serif';
        subTotalTime.forEach((sums, i) => {
            if (sums != 0) {
                itemCount++;
                var arcScale = sums / totalTime;
                var pos = progress + arcScale;
                if (pos > 0.167 && pos <= 0.833) {//bottomHeight
                    bottomHeight++;
                } else {//width
                    var txt = (beNames[i] + ", " + secToTimeString(sums) + ", " + Math.round(arcScale * 1000) / 10 + "%");
                    if (ctx.measureText(txt).width > singleSideWidth) {
                        singleSideWidth = ctx.measureText(txt).width;
                    };
                }
                progress += 2 * arcScale;
            }
        });
        bottomHeight *= 25;//text height of font style:16px sans-serif is 17

        var sideMargin = 50;
        var w = 300 + singleSideWidth * 2 + sideMargin * 2;
        var topMargin = 50;
        var botMargin = 75;
        var h = 300 + topMargin + bottomHeight + botMargin;
        var r = 150;
        var center_x = w / 2;
        var center_y = topMargin + r;

        canvas.id = "pieChartCanvas_" + ob;
        canvas.width = w;
        canvas.height = h;
        piechartDiv.appendChild(singlePieDiv);
        console.log("w:" + w + ", h:" + h);

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, w, h);

        //logo
        var imgObject;
        imgObject = document.getElementById("logo");
        ctx.drawImage(imgObject, w - 75, 10, 75, 27);
        //file name
        ctx.fillStyle = "Black"
        ctx.font = '12px sans-serif';

        var filenametxt = "TTC_" + document.getElementById("filename").value + "_pieChart";
        ctx.fillText(filenametxt, 0, 10);

        ctx.font = '24px ssna-serif';
        ctx.fillText("Object:" + obNames[ob], 5, 50);

        ctx.font = '20px ssna-serif';
        ctx.fillText("Total time:" + secToTimeString(totalTime), w / 2 + r - 30, topMargin + r * 2 - 25);

        progress = -0.5;//reset start angle of pieChart
        var left = right = bot = 0, x, y;//for calculating icon info position

        subTotalTime.forEach((sums, i) => {
            if (sums != 0) {
                ctx.beginPath();
                ctx.strokeStyle = "white";
                ctx.lineWidth = 1.5;
                ctx.moveTo(center_x, center_y);
                var arcScale = sums / totalTime;
                var textPos = progress + arcScale;
                ctx.arc(center_x, center_y, r, progress * Math.PI, (progress + 2 * arcScale) * Math.PI);
                ctx.closePath();
                ctx.stroke();

                ctx.fillStyle = timelineColors[i];
                ctx.fill();

                if (textPos > -0.5 && textPos <= 0.167) {
                    x = w / 2 + r + 10;
                    y = topMargin + 75 + 25 * right;
                    right++;
                } else if (textPos > 0.167 && textPos <= 0.833) {
                    x = w / 2 - 75;
                    y = topMargin + r * 2 + 20 + 25 * bot;
                    bot++;
                } else if (textPos > 0.833 && textPos <= 1.5) {
                    x = 30;
                    y = topMargin + 75 + (itemCount - right - bot - 1) * 25 - 25 * left;
                    left++;
                }

                ctx.beginPath();
                ctx.rect(x, y - 8.5, 15, 15);
                ctx.fill();

                ctx.textAlign = "left";//水平位置
                ctx.textBaseline = "middle";//垂直位置

                ctx.font = '16px sans-serif';
                ctx.fillStyle = "black";
                var text = (btnAllNames[i] + ", " + secToTimeString(sums) + ", " + Math.round(arcScale * 1000) / 10 + "%");

                ctx.fillText(text, x + 20, y);

                progress += 2 * arcScale;
            }
        });
        /* canvas.addEventListener('click', function () {
            window.open().document.write('<img style="max-width: 100%;" src="' + canvas.toDataURL() + '" />');
        }, false); */
    });
}
function saveTimeline() {
    if (!document.getElementById("canvasTimeline")) {
        createTimeline();
    }

    var link = document.createElement("a");
    link.setAttribute('download', "TTC_" + document.getElementById("filename").value + "_timeline");
    link.href = document.getElementById("canvasTimeline").toDataURL("image/png");
    document.body.appendChild(link);

    link.click();
    link.remove();
}
function savePieChart() {
    var zip = new JSZip();
    if (!document.getElementById("pieChartCanvas_0")) {
        createPieChart();
    }
    for (var i = 0; i < obNames.length; i++) {
        var img = document.getElementById("pieChartCanvas_" + i).toDataURL("image/png");
        img = img.split('base64,')[1];
        zip.file(("TTC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^\_])/g, '_') + "_pieChart_" + i + ".png"), img, { base64: true, createFolders: false });
    }
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // see FileSaver.js
            saveAs(content, "TTC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^\_])/g, '_') + "_all_pieCharts.zip");
        });
}

function showResultSwitch(divId) {
    if (!createResult) {
        createTimeline();
        createPieChart();
        createResult = true;
    }

    if (divId == "showall") {
        for (var i = 0; i < obNames.length; i++) {
            if (!$("#pc_" + i).hasClass("active")) {
                $("#divpc_" + i).removeClass("d-none");
                $("#pc_" + i).addClass("active");
            }
        }
        if (!$("#divtimeline").hasClass("active")) {
            $("#divtimeline").removeClass("d-none");
            $("#timeline").addClass("active");
        }

    } else if (divId == "pc_showall") {
        console.log("pc_showall");
        for (var i = 0; i < obNames.length; i++) {
            if (!$("#pc_" + i).hasClass("active")) {
                $("#divpc_" + i).removeClass("d-none");
                $("#pc_" + i).addClass("active");
            }
        }
    } else {
        $("#" + divId).toggleClass("active");
        $("#div" + divId).toggleClass("d-none");
    }
}