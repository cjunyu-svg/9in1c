// Timeline: width 75*60=4500/6=750 eli skaalaa kaikki kuudella tai ainakin len

var timelineColors = ["#15bef0", "#e5053a", "#fcd116", "#5bbf21", "#3a75c4", "#e63375", "#eda075", "#00b08c", "#9258c8", "#8c0032", "#fca311", "#009e60"];

function clearTimeline() {
    if (document.getElementById("timeLineCanvas") == null) { return; }
    node = document.getElementById("divTimeline");
    removed = document.getElementById("timeLineCanvas");
    node.removeChild(removed);
}

function leading0(tmp) {
    if (tmp < 10) { return "0" + parseInt(tmp); }
    else { return parseInt(tmp); }
}

function sec2time(tmp) {
    var mins = Math.floor(tmp / 60);
    var secs = tmp - 60 * mins;
    return leading0(mins) + ":" + leading0(secs);
}

function createTimeline() {
    if (document.getElementById("timeLineCanvas") != null) { if (!confirm('Create new timeline?')) return; }
    else if (ticks == 0) { alert('There is no data!'); return; }

    clearTimeline();

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.id = "timeLineCanvas";
    document.getElementById("divTimeline").appendChild(canvas);

    var labels = [];
    if (module <= 1) {
        labels = Array.from(MODULES[module]);
    } else {
        labels = [].concat.apply([], MODULES[module]);
    }
    // Draw grid, 20px for 1 minute, --> plotWidth + labels and totals
    // canvas width
    var numOfButtons = itemNum; // get the number of buttons
    var textLength = 0;
    ctx.font = '12px sans-serif';
    for (var i = 0; i < numOfButtons; i++) {
        var txt = labels[i];
        if (ctx.measureText(txt).width > textLength) {
            textLength = ctx.measureText(txt).width;
        }
    }

    var plotWidth; // this from lenght of time
    plotWidth = Math.ceil(ticks / 60) * 20; //20 pixel per min(60sec)
    var canvasWidth = plotWidth + textLength * 2 + 100;	// add room for totals and then some
    canvas.width = canvasWidth;

    // canvas height
    var topMargin = 70;
    var plotHeight = 80 * numOfButtons;
    var canvasHeight = plotHeight + 2 * topMargin;	// add margin and space for ticks
    canvas.height = canvasHeight;

    var plotStart = textLength + 50; // where the plot starts (x), labels to the left

    // postion for labels
    var height = 50; // height of the horizontal bars
    var pos = [];
    for (var pp = 0; pp < numOfButtons; pp++) {
        //var step = 20;
        pos.push(pp * plotHeight / numOfButtons + height * 0.5 + topMargin);
    }

    // draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black"; // drawcolor back to black

    //document.body.appendChild(canvas);

    // axes
    ctx.moveTo(plotStart, plotHeight + topMargin);
    ctx.lineTo(plotStart + plotWidth, plotHeight + topMargin);
    ctx.stroke();

    ctx.moveTo(plotStart, plotHeight + topMargin);
    ctx.lineTo(plotStart, topMargin);
    ctx.stroke();

    // Y-ticks and labels
    for (var i = 0; i < numOfButtons; i++) {
        var txt = labels[i];
        ctx.font = '12px sans-serif';
        ctx.fillText(txt, plotStart - (ctx.measureText(txt).width + 10), pos[i] + height / 2 + 5);
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        // Draw a tick mark 12px long (-6 to 6)
        ctx.moveTo(plotStart - 6, pos[i] + height / 2);
        ctx.lineTo(plotStart + 6, pos[i] + height / 2);
        ctx.stroke();
    }

    // axes labels
    ctx.font = '12px sans-serif';
    ctx.fillText('Items Name', textLength, topMargin - 10);
    ctx.font = '12px sans-serif';
    ctx.fillText('Mins', plotStart + plotWidth, plotHeight + topMargin + 25);


    // X-ticks and labels
    ctx.font = '12px sans-serif';
    ctx.fillText(startTime, plotStart - 15, plotHeight + topMargin + 25);
    for (var i = 0; i <= plotWidth / 20; i++) {//every 1 min, x-ticks mark
        ctx.beginPath(); //?
        ctx.lineWidth = 1;
        // Draw a tick mark 6px long (-3 to 3)
        ctx.setLineDash([]);
        ctx.strokeStyle = "#000000";
        ctx.moveTo(plotStart + 20 * i, plotHeight + topMargin);
        ctx.lineTo(plotStart + 20 * i, plotHeight + topMargin + 10);
        ctx.stroke();
        // Draw gridlines
        if (i > 0 && i % 5 == 0) {//every 5 min, solid gridlines
            ctx.beginPath();
            ctx.strokeStyle = "#8c8c8c";
            ctx.moveTo(plotStart + 20 * i, plotHeight + topMargin - 2);
            ctx.lineTo(plotStart + 20 * i, topMargin);
            ctx.stroke();
            ctx.font = '12px sans-serif';
            ctx.fillText(i, plotStart + 20 * i - 5, plotHeight + topMargin + 25);
        }
        else if (i > 0) {//every 1 min, dashlines
            ctx.beginPath();
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = "#cccccc";
            ctx.moveTo(plotStart + 20 * i, plotHeight + topMargin - 2);
            ctx.lineTo(plotStart + 20 * i, topMargin);
            ctx.stroke();
        }
    }
    //draw logo 
    /* var imgObject = document.getElementById("logo");
    ctx.drawImage(imgObject, canvasWidth - 50, 5, 50, 18); */

    const logoImg = document.getElementById("logo");
    if (logoImg && logoImg.complete) {
        const scale = 30 / logoImg.naturalHeight;
        ctx.drawImage(logoImg, canvasWidth - 5 - (logoImg.naturalWidth * scale), 5, logoImg.naturalWidth * scale, 30);
    }

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px "Microsoft JhengHei", Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${moduleName[module]}_${filename}_Timeline`, 5, 5);


    ctx.textBaseline = 'alphabetic';
    // draw stroke
    var totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var start, stop, len;
    for (var i = 0; i < numOfButtons; i++) {
        for (var j = 1; j < data[i * 2].length; j++) {
            start = data[i * 2][j];
            stop = data[i * 2 + 1][j];
            len = stop - start;
            totals[i] += len;
            ctx.fillStyle = timelineColors[i];
            ctx.fillRect(plotStart + start / 3, pos[i], len / 3, height); // /3 to scale 20px for 1 minute
        }
        ctx.fillStyle = "Black"
        ctx.font = '12px sans-serif';
        ctx.fillText(sec2time(totals[i]), plotStart + plotWidth + 20, pos[i] + height / 2 + 2.5);
    }

    // autoscroll to the bottom of the page to show the timeline
    window.scrollTo(0, document.body.scrollHeight);
}

function saveTimeline() {
    // check if canvas exists and if not create it
    var canvas = document.getElementById("timeLineCanvas");
    if (!canvas) {
        createTimeline();
        canvas = document.getElementById("timeLineCanvas");
    }
    if (!canvas) {
        console.error("錯誤：找不到 timeLineCanvas，請檢查 createTimeline 是否正確建立了 ID 為 timeLineCanvas 的元素。");
        return;
    }
    var link = document.createElement("a");
    link.setAttribute('download', moduleName[module] + "_" + filename + "_Timeline.png");
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

/**
 * 將起迄時間記錄轉換為逐秒序列 存至sequenceResult[]
 */
function convertRecordToSequence() {
    if (sequenceResult.length !== 0) return;
    const eventMap = {};

    // 1. 解析資料
    data.forEach(row => {
        const label = row[0];
        const times = row.slice(1);
        const match = label.match(/^(start|stop)\s+(\d+)\./);
        if (!match) return;

        const type = match[1];
        const code = parseInt(match[2], 10);

        if (!eventMap[code]) eventMap[code] = { starts: [], stops: [] };

        if (type === 'start') eventMap[code].starts.push(...times);
        else eventMap[code].stops.push(...times);
    });

    // 2. 配對與計算 (包含 Duration 修正)
    let segments = [];
    for (const code in eventMap) {
        const { starts, stops } = eventMap[code];
        const count = Math.min(starts.length, stops.length);

        for (let i = 0; i < count; i++) {
            const start = starts[i];
            const stop = stops[i];

            // 核心修正：確保同一秒的行為至少記錄 1 次
            // 只有當 stop < start (資料錯誤) 時才忽略
            if (stop >= start) {
                let duration = stop - start;
                // 如果是同一秒 (duration == 0)，強制視為 1 秒
                if (duration === 0) duration = 1;

                segments.push({
                    code: parseInt(code),
                    startTime: start,
                    duration: duration
                });
            }
        }
    }

    // 3. 排序
    segments.sort((a, b) => a.startTime - b.startTime);

    // 4. 展開
    sequenceResult.length = 0;
    segments.forEach(seg => {
        for (let t = 0; t < seg.duration; t++) {
            sequenceResult.push(seg.code);
        }
    });
}

/**
 * 生成互動分析矩陣 (Interaction Matrix)
 * @returns {Array<Array<number>>} - 統計完成的二維矩陣
 */
function generateInteractionMatrix() {
    // 1. 初始化 width * width 的二維矩陣，全部填入 0
    // Array.from({ length: width }) 建立外層
    // () => new Array(width).fill(0) 建立內層並填滿 0
    if (sequenceResult.length === 0) convertRecordToSequence();
    const dataArray = sequenceResult;
    const width = itemNum;
    matrix = Array.from({ length: width }, () => new Array(width).fill(0));

    // 2. 遍歷陣列，採用「前項」與「後項」配對
    for (let i = 0; i < dataArray.length - 1; i++) {
        const row = dataArray[i] == 0 ? 9 : dataArray[i] - 1;     // 前項 (Row)
        const col = dataArray[i + 1] == 0 ? 9 : dataArray[i + 1] - 1; // 後項 (Column)

        // 安全檢查：確保數字在矩陣範圍內 (0 ~ width-1)
        if (row >= 0 && row < width && col >= 0 && col < width) {
            matrix[row][col] += 1; // 對應位置計數 +1
        }
    }
}


/**
 * 產生互動分析矩陣圖
 */
function generateMatrixImage() {
    if (document.getElementById("matrixCanvas") != null) { if (!confirm('Create new timeline?')) return; }
    else if (ticks == 0) { alert('There is no data!'); return; }

    clearMatrix();
    const modules = MODULES[module];
    const mdlName = moduleName[module];
    const filename = sanitizeName(document.getElementById("filename").value);

    const width = 1600;
    const height = 1200;
    const canvas = document.createElement('canvas');
    canvas.id = "matrixCanvas";
    canvas.width = width;
    canvas.height = height;
    document.getElementById("divMatrix").appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // --- A. 數據預處理 ---
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = Array.from({ length: cols }, (_, c) => matrix.reduce((sum, row) => sum + row[c], 0));
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    const parseLabel = (text) => {
        const match = text.match(/^(\d+)\.(.+)$/);
        return match ? { index: match[1], label: match[2] } : { index: "", label: text };
    };

    // --- B. 自適應佈局 (修正 7x7 留白問題) ---
    ctx.font = 'bold 24px "Microsoft JhengHei"';
    let maxCharCount = 0;
    modules.forEach(m => {
        const label = parseLabel(m).label;
        if (label.length > maxCharCount) maxCharCount = label.length;
    });

    const labelFontSize = 24;
    const topTextHeight = (maxCharCount * 30) + 60;
    const topIndexHeight = 60;
    const fullTopHeight = topTextHeight + topIndexHeight;

    const leftTextWidth = maxCharCount * 25 + 30;
    const leftIndexWidth = 60;
    const fullLeftWidth = leftTextWidth + leftIndexWidth;

    const edgePadding = 20;
    const headerTitleHeight = 60;

    // 修正：更進取的邊距縮減，讓表格在畫面中更大
    const baseMargin = 60;
    const tableMargin = cols < 10 ? baseMargin + (10 - cols) * 35 : baseMargin;

    const displayCols = cols + 1;
    const displayRows = rows + 1;

    const gridStartX = tableMargin + fullLeftWidth;
    const gridStartY = tableMargin + headerTitleHeight + fullTopHeight;
    const availableWidth = width - gridStartX - tableMargin;
    const availableHeight = height - gridStartY - tableMargin;

    const cellW = availableWidth / displayCols;
    const cellH = availableHeight / displayRows;
    const dataFontSize = Math.min(cellW * 0.45, cellH * 0.5, 34);

    // --- C. 基礎繪製 ---
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px "Microsoft JhengHei", Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${mdlName}_${filename}_InteractionAnalysisMatrix`, edgePadding, edgePadding);

    const logoImg = document.getElementById("logo");
    if (logoImg && logoImg.complete) {
        const scale = 60 / logoImg.naturalHeight;
        ctx.drawImage(logoImg, width - edgePadding - (logoImg.naturalWidth * scale), edgePadding, logoImg.naturalWidth * scale, 60);
    }

    // --- D. 繪製矩陣格子 ---
    for (let r = 0; r < displayRows; r++) {
        const cy = gridStartY + r * cellH;
        const isDataRow = r < rows;
        const isTotalRow = r === rows;

        // 1. 左側欄位
        if (isTotalRow) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(tableMargin, cy, fullLeftWidth, cellH);
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 1;
            ctx.strokeRect(tableMargin, cy, fullLeftWidth, cellH);
            ctx.fillStyle = "#000";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${labelFontSize}px Arial`;
            ctx.fillText("total", tableMargin + fullLeftWidth / 2, cy + cellH / 2);
        } else {
            const item = parseLabel(modules[r]);
            ctx.strokeStyle = "#999";
            ctx.lineWidth = 1;
            ctx.strokeRect(tableMargin, cy, leftTextWidth, cellH);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${labelFontSize}px "Microsoft JhengHei"`;
            ctx.fillText(item.label, tableMargin + leftTextWidth - 15, cy + cellH / 2);

            ctx.fillStyle = '#f3e3c1';
            ctx.fillRect(tableMargin + leftTextWidth, cy, leftIndexWidth, cellH);
            ctx.strokeRect(tableMargin + leftTextWidth, cy, leftIndexWidth, cellH);
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.font = 'bold 22px Arial';
            ctx.fillText(item.index, tableMargin + leftTextWidth + leftIndexWidth / 2, cy + cellH / 2);
        }

        // 2. 數據格子
        for (let c = 0; c < displayCols; c++) {
            const cx = gridStartX + c * cellW;
            const isDataCol = c < cols;
            const isTotalCol = c === cols;

            if (r === 0) {
                const topTextY = gridStartY - fullTopHeight;
                ctx.strokeStyle = '#999';
                if (isTotalCol) {
                    ctx.strokeRect(cx, topTextY, cellW, fullTopHeight);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000';
                    ctx.font = `bold ${labelFontSize}px Arial`;
                    ctx.fillText("total", cx + cellW / 2, topTextY + fullTopHeight / 2);
                } else {
                    const hItem = parseLabel(modules[c]);
                    ctx.strokeRect(cx, topTextY, cellW, topTextHeight);
                    drawVerticalCharStack(ctx, hItem.label, cx + cellW / 2, topTextY + topTextHeight - 20, labelFontSize);
                    ctx.fillStyle = '#b0d2f5';
                    ctx.fillRect(cx, gridStartY - topIndexHeight, cellW, topIndexHeight);
                    ctx.strokeRect(cx, gridStartY - topIndexHeight, cellW, topIndexHeight);
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold 22px Arial';
                    ctx.fillText(hItem.index, cx + cellW / 2, gridStartY - topIndexHeight / 2);
                }
            }

            let val = "";
            let bg = "#FFF";
            if (isDataRow && isDataCol) {
                val = matrix[r][c];
                const flatSorted = [...matrix.flat()].sort((a, b) => b - a);
                if (val >= flatSorted[Math.ceil(flatSorted.length * 0.1) - 1] && val > 0) bg = "#d1e7dd";
            } else if (isDataRow && isTotalCol) val = rowTotals[r];
            else if (isTotalRow && isDataCol) val = colTotals[c];
            else if (isTotalRow && isTotalCol) val = grandTotal;

            ctx.fillStyle = bg;
            ctx.fillRect(cx, cy, cellW, cellH);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx, cy, cellW, cellH);

            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${dataFontSize}px Arial`;
            ctx.fillText(val, cx + cellW / 2, cy + cellH / 2);
        }
    }

    const cornerStartX = tableMargin;
    const cornerStartY = tableMargin + headerTitleHeight;

    // 1. 左上角模組名稱框
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
    ctx.strokeRect(cornerStartX, cornerStartY, leftTextWidth, topTextHeight);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px "Microsoft JhengHei"';
    ctx.fillText(moduleNameCHT[module], cornerStartX + leftTextWidth / 2, cornerStartY + topTextHeight / 2 - 20);
    ctx.fillText('(' + mdlName + ')', cornerStartX + leftTextWidth / 2, cornerStartY + topTextHeight / 2 + 20);

    // 2. R,C 交叉點
    ctx.strokeRect(cornerStartX + leftTextWidth, cornerStartY + topTextHeight, leftIndexWidth, topIndexHeight);
    ctx.font = 'bold 22px Arial';
    ctx.fillText("R, C", cornerStartX + leftTextWidth + leftIndexWidth / 2, cornerStartY + topTextHeight + topIndexHeight / 2);

    // 3.後項 C
    ctx.fillStyle = '#b0d2f5';
    ctx.fillRect(cornerStartX + leftTextWidth, cornerStartY, leftIndexWidth, topTextHeight);
    ctx.strokeStyle = '#999'; ctx.strokeRect(cornerStartX + leftTextWidth, cornerStartY, leftIndexWidth, topTextHeight);
    drawVerticalCharStack(ctx, "後項C", cornerStartX + leftTextWidth + leftIndexWidth / 2, cornerStartY + topTextHeight - 20, 20);

    // 4.前項 R
    ctx.fillStyle = '#f3e3c1';
    ctx.fillRect(cornerStartX, cornerStartY + topTextHeight, leftTextWidth, topIndexHeight);
    ctx.strokeStyle = '#999'; ctx.strokeRect(cornerStartX, cornerStartY + topTextHeight, leftTextWidth, topIndexHeight);
    ctx.fillStyle = '#000'; ctx.textAlign = 'right';
    ctx.font = 'bold 22px "Microsoft JhengHei"';
    ctx.fillText("前項 R", cornerStartX + leftTextWidth - 15, cornerStartY + topTextHeight + topIndexHeight / 2);

    // 5. 分隔線
    ctx.beginPath(); ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    ctx.moveTo(gridStartX + cols * cellW, gridStartY);
    ctx.lineTo(gridStartX + cols * cellW, gridStartY + displayRows * cellH);
    ctx.moveTo(gridStartX, gridStartY + rows * cellH);
    ctx.lineTo(gridStartX + displayCols * cellW, gridStartY + rows * cellH);
    ctx.stroke();

    // autoscroll to the bottom of the page to show the timeline
    window.scrollTo(0, document.body.scrollHeight);
}

function drawVerticalCharStack(ctx, text, x, bottomY, fontSize) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px "Microsoft JhengHei"`;
    ctx.fillStyle = '#000';
    const chars = text.split('');
    const spacing = fontSize + 6;
    const totalH = chars.length * spacing;
    const startY = bottomY - (totalH / 2) + (fontSize / 2);

    chars.forEach((char, i) => {
        ctx.fillText(char, x, (bottomY - totalH) + (i * spacing) + (spacing / 2));
    });
    ctx.restore();
}

function saveMatirxImg() {
    // check if canvas exists and if not create it
    var canvas = document.getElementById("matrixCanvas");
    if (!canvas) {
        generateMatrixImage();
        canvas = document.getElementById("matrixCanvas");
    }

    var link = document.createElement("a");
    link.setAttribute('download', moduleName[module] + "_" + sanitizeName(document.getElementById("filename").value, 20) + "_InteractionAnaylsisMatrix.png");
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function clearMatrix() {
    if (document.getElementById("matrixCanvas") == null) { return; }
    node = document.getElementById("divMatrix");
    removed = document.getElementById("matrixCanvas");
    node.removeChild(removed);
}

/**
 * 匯出互動分析矩陣為 Excel (V16 最終定色版)
 * 特色：位置完全鎖定 V15，僅修正底色邏輯
 * 依據：
 * - (後項C) + 橫向序數 = 淡藍
 * - (前項R) + 直向序數 = 淡黃
 */
function exportMatrixXLSX() {
    // --- 1. 從全域環境獲取資料 ---
    //const matrix = generateInteractionMatrix();
    if (!matrix || matrix.length === 0) {
        alert("目前沒有矩陣資料，請先進行計算。");
        return;
    }
    const currentLabels = MODULES[module].flat(Infinity);
    const mdlName = moduleName[module];
    const rawFilename = document.getElementById("filename").value || "Untittled";
    const filename = (typeof sanitizeName === 'function') ? sanitizeName(rawFilename) : rawFilename;

    // --- 2. 數據計算 ---
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = Array.from({ length: cols }, (_, c) => matrix.reduce((sum, row) => sum + row[c], 0));
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    const flattened = matrix.flat(Infinity);
    const sorted = [...flattened].sort((a, b) => b - a);
    const topCount = Math.ceil(sorted.length * 0.1);
    const threshold = sorted[topCount - 1] || 0;

    const parseLabel = (text) => {
        const match = text.match(/^(\d+)\.(.+)$/);
        return match ? { index: match[1], label: match[2] } : { index: "", label: text };
    };

    // --- 3. 建構 Excel 內容  ---
    var data = [];
    var merges = [];

    // [Row 1] 標題列 1
    // A1: Module Name, B1: (後項 C), C1...: Column Labels
    var row1 = [moduleNameCHT[module] + "\n" + '(' + mdlName + ')', "(後項 C)"];
    for (let c = 0; c < cols; c++) row1.push(parseLabel(currentLabels[c]).label);
    row1.push(""); // Last Col (Total Header Area)
    data.push(row1);

    // [Row 2] 標題列 2
    // A2: (前項 R), B2: R, C, C2...: Column Indices
    var row2 = ["(前項 R)", "R, C"];
    for (let c = 0; c < cols; c++) row2.push(parseLabel(currentLabels[c]).index);
    row2.push("total");
    data.push(row2);

    // [Data Rows] 數據區 (從 Row 3 開始)
    // A: Label, B: Index, C...: Data
    for (let r = 0; r < rows; r++) {
        const item = parseLabel(currentLabels[r]);
        var rowData = [];
        rowData.push(item.label);
        rowData.push(item.index);
        for (let c = 0; c < cols; c++) rowData.push(matrix[r][c]);
        rowData.push(rowTotals[r]); // Row Total
        data.push(rowData);
    }

    // [Footer] 底部 Total
    var footer = ["", "total"];
    colTotals.forEach(t => footer.push(t));
    footer.push(grandTotal);
    data.push(footer);

    // --- 4. 產生 Worksheet ---
    var ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;

    // 設定欄寬
    var wscols = [{ wch: 20 }, { wch: 6 }]; // A, B
    for (let i = 0; i <= cols; i++) wscols.push({ wch: 6 });
    ws['!cols'] = wscols;

    // --- 5. 樣式處理 (Style Logic) ---
    const styleCenter = { alignment: { horizontal: "center", vertical: "center", wrapText: true } };
    const styleBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };

    // 顏色定義
    const styleHeaderFill = { fgColor: { rgb: "F2F2F2" } }; // 灰 (一般標題)
    const styleGreenFill = { fgColor: { rgb: "D1E7DD" } };  // 熱點綠 (Top 10%)
    const styleBlueFill = { fgColor: { rgb: "E6F3FF" } };   // 淡藍 ((後項C) + 橫向序數)
    const styleYellowFill = { fgColor: { rgb: "FFFFE0" } }; // 淡黃 ((前項R) + 直向序數)

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[addr]) continue;

            if (!ws[addr].s) ws[addr].s = {};
            Object.assign(ws[addr].s, styleCenter);
            ws[addr].s.border = styleBorder;
            ws[addr].s.font = { name: "Arial", sz: 12 };

            // === 著色邏輯開始 ===

            // 1. (後項 C) - B1 (Row 0, Col 1) -> 淡藍
            if (R === 0 && C === 1) {
                ws[addr].s.fill = styleBlueFill;
                ws[addr].s.font.bold = true;
            }

            // 2. 橫列序數 - Row 2 (index 1), Col C ~ EndData -> 淡藍
            if (R === 1 && C >= 2 && C < 2 + cols) {
                ws[addr].s.fill = styleBlueFill;
                ws[addr].s.font.bold = true;
            }

            // 3. (前項 R) - A2 (Row 1, Col 0) -> 淡黃
            if (R === 1 && C === 0) {
                ws[addr].s.fill = styleYellowFill;
                ws[addr].s.font.bold = true;
            }

            // 4. 直行序數 - Col B (index 1), Row 3 ~ EndData -> 淡黃
            if (C === 1 && R >= 2 && R < 2 + rows) {
                ws[addr].s.fill = styleYellowFill;
                ws[addr].s.font.bold = true;
            }

            // 5. 其他標題區 (灰色)
            // A1 (Module Name), R,C (B2), Column Labels (Row 1, Col 2+), Row Labels (Col A, Row 3+)
            // Total Labels

            // A1
            if (R === 0 && C === 0) {
                ws[addr].s.fill = styleHeaderFill;
                ws[addr].s.font.bold = true;
                ws[addr].s.font.sz = 14;
            }
            // Column Labels (Row 0, C >= 2)
            if (R === 0 && C >= 2) ws[addr].s.fill = styleHeaderFill;

            // R, C (B2)
            if (R === 1 && C === 1) ws[addr].s.fill = styleHeaderFill;

            // Row Labels (Col A, R >= 2)
            if (C === 0 && R >= 2 && R < 2 + rows) ws[addr].s.fill = styleHeaderFill;

            // 6. 熱點數據 (Green Heatmap)
            // R >= 2, C >= 2, Not Footer, Not RightTotal
            if (R >= 2 && R < 2 + rows && C >= 2 && C < 2 + cols) {
                const val = ws[addr].v;
                if (typeof val === 'number' && val >= threshold && val > 0) {
                    ws[addr].s.fill = styleGreenFill;
                }
            }

            // 7. Total 區域 (Bold + Grey)
            if (R === 2 + rows || C === 2 + cols) {
                ws[addr].s.fill = styleHeaderFill;
                ws[addr].s.font.bold = true;
            }

            // 右上角 Total 標題 (Row 1, Last Col)
            if (R === 1 && C === 2 + cols) {
                ws[addr].s.fill = styleHeaderFill;
                ws[addr].s.font.bold = true;
            }
        }
    }

    // --- 6. 輸出 ---
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${mdlName}_InteractionAnalysisMatrix`);
    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    return new Blob([s2ab(wbout)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}