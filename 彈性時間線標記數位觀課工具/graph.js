let timelineColors = ["#0d6efd", "#198754", "#dc3545"];
let pieChartColors = [["#70b3ff", "#1c58bb", "#5495e9", "#89c0ff", "#3876d2", "#003495"],["#90e190","#248724","#6cc36c","#b4ffb4","#48a548","#006900"],["#e15050","#871414","#c33c3c","#ff6464","#a52828","#690000"]];

var filename = new Date().toLocaleDateString().replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
document.getElementById("filename").value = filename;

function showResult() {
    // check if canvas exists and if not, create it
    createTimeline();
    createPieChart();
}

function createTimeline() {
    clearTimeline();

    const divTimeline = document.getElementById("divTimeline");
    if (!divTimeline) {
        console.error("divTimeline 元素未找到。");
        return;
    }

    const allButtons = [];
    for (let i = 0; i < workDivs.length; i++) {
        if (workDivs[i]) {
            allButtons.push(...getButtonsInWorkDiv(workDivs[i]));
        }
    }

    const labels = allButtons.map(btn => btn.textContent.trim());
    const numOfButtons = labels.length;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.id = "canvas";
    divTimeline.appendChild(canvas);

    let maxLabelWidth = 0;
    ctx.font = '12px sans-serif';
    for (const label of labels) {
        const currentWidth = ctx.measureText(label).width;
        if (currentWidth > maxLabelWidth) {
            maxLabelWidth = currentWidth;
        }
    }

    const PIXEL_PER_MINUTE = 20;
    const PLOT_MARGIN_LEFT = 50;
    const CANVAS_PADDING_RIGHT = 100;

    const plotWidth = Math.ceil(seconds / 60) * PIXEL_PER_MINUTE;
    const canvasWidth = plotWidth + maxLabelWidth + PLOT_MARGIN_LEFT + CANVAS_PADDING_RIGHT;
    canvas.width = canvasWidth;

    const TOP_MARGIN = 50;
    const BAR_HEIGHT = 30;
    // 新增：X軸上方預留的空間 (半個長條寬度)，確保最下方長條不被X軸覆蓋
    const Y_OFFSET_FROM_X_AXIS = 0;

    // 所有時間軸的總高度 (包含下方額外空間)
    // plotHeight 現在指的是從 TOP_MARGIN 到 X 軸的總高度
    const plotHeight = (numOfButtons * BAR_HEIGHT) + Y_OFFSET_FROM_X_AXIS;
    const canvasHeight = plotHeight + 2 * TOP_MARGIN; // 加上上下邊距
    canvas.height = canvasHeight;

    const plotStartX = maxLabelWidth + PLOT_MARGIN_LEFT;

    // 計算每條時間軸的垂直位置 (現在表示每個條的頂部Y座標)
    const buttonPositionsY = [];
    for (let i = 0; i < numOfButtons; i++) {
        // 每個條的頂部 Y 座標從 TOP_MARGIN 開始，向下遞增
        buttonPositionsY.push(TOP_MARGIN + i * BAR_HEIGHT);
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log(`Canvas dimensions: Width=${canvas.width}, Height=${canvas.height}`);
    ctx.fillStyle = "black";

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(plotStartX, plotHeight + TOP_MARGIN); // X 軸的 Y 座標
    ctx.lineTo(plotStartX + plotWidth, plotHeight + TOP_MARGIN); // X 軸的 Y 座標
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(plotStartX, plotHeight + TOP_MARGIN); // X 軸的 Y 座標
    ctx.lineTo(plotStartX, TOP_MARGIN);
    ctx.stroke();

    ctx.font = '12px sans-serif';
    const TICK_LENGTH_Y = 12;
    const LABEL_OFFSET_Y = 10;
    const FONT_OFFSET_Y = 5;

    for (let i = 0; i < numOfButtons; i++) {
        const txt = labels[i];
        // 文本Y座標：條的中心Y座標 + FONT_OFFSET_Y
        ctx.fillText(txt, plotStartX - (ctx.measureText(txt).width + LABEL_OFFSET_Y), buttonPositionsY[i] + BAR_HEIGHT / 2 + FONT_OFFSET_Y);

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        // 繪製 Y 軸刻度線：條的中心Y座標
        ctx.moveTo(plotStartX - TICK_LENGTH_Y / 2, buttonPositionsY[i] + BAR_HEIGHT / 2);
        ctx.lineTo(plotStartX + TICK_LENGTH_Y / 2, buttonPositionsY[i] + BAR_HEIGHT / 2);
        ctx.stroke();
    }

    ctx.font = '12px sans-serif';
    ctx.fillText('Category', maxLabelWidth, TOP_MARGIN - 5);
    // Mins 標籤位置也要調整到新的 X 軸位置
    ctx.fillText('Mins', plotStartX + plotWidth + 10, plotHeight + TOP_MARGIN + 25);
    ctx.fillText(startTime, plotStartX - 15, plotHeight + TOP_MARGIN + 25);

    const PIXEL_PER_SECOND = PIXEL_PER_MINUTE / 60;
    const TICK_LENGTH_X = 10;

    for (let i = 0; i <= plotWidth / PIXEL_PER_MINUTE; i++) {
        const xPos = plotStartX + PIXEL_PER_MINUTE * i;

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeStyle = "#000000";
        // 繪製 X 軸刻度線
        ctx.moveTo(xPos, plotHeight + TOP_MARGIN); // X 軸的 Y 座標
        ctx.lineTo(xPos, plotHeight + TOP_MARGIN + TICK_LENGTH_X); // X 軸的 Y 座標
        ctx.stroke();

        if (i > 0) {
            ctx.beginPath();
            if (i % 5 === 0) {
                ctx.strokeStyle = "#8c8c8c";
                ctx.setLineDash([]);
                ctx.font = '12px sans-serif';
                ctx.fillText(i, xPos - 5, plotHeight + TOP_MARGIN + 25); // 使用新的 plotHeight
            } else {
                ctx.strokeStyle = "#cccccc";
                ctx.setLineDash([2, 2]);
            }
            ctx.moveTo(xPos, plotHeight + TOP_MARGIN - 2); // 從X軸上方一點開始
            ctx.lineTo(xPos, TOP_MARGIN);
            ctx.stroke();
        }
    }
    ctx.setLineDash([]);

    const imgObject = document.getElementById("logo");
    if (imgObject) {
        const LOGO_WIDTH = 50;
        const LOGO_HEIGHT = 18;
        ctx.drawImage(imgObject, canvasWidth - LOGO_WIDTH - 5, 5, LOGO_WIDTH, LOGO_HEIGHT);
    } else {
        console.warn("Logo 元素 (id='logo') 未找到。");
    }

    ctx.fillStyle = "Black";
    ctx.font = '12px sans-serif';
    const filenameTxt = `FTC_${document.getElementById("filename")?.value || 'unknown'}_timeline`;
    ctx.fillText(filenameTxt, 10, 25);

    let posIndex = 0;
    for (let i = 0; i < 3; i++) {
        if (!allBtnStartEnd[i] || !ftcInputName[i] || allBtnStartEnd[i].length !== ftcInputName[i].length) {
            console.warn(`類別 ${i} 的 allBtnStartEnd 或 ftcInputName 數據不匹配或缺失，跳過此類別。`);
            if (ftcInputName[i]) {
                posIndex += ftcInputName[i].length;
            }
            continue;
        }

        for (let j = 0; j < allBtnStartEnd[i].length; j++) {
            const records = allBtnStartEnd[i][j];
            let totalDuration = 0;

            if (records && records.length > 0) {
                for (let k = 0; k < records.length; k += 2) {
                    const start = records[k];
                    const stop = records[k + 1];

                    if (typeof start === 'number' && typeof stop === 'number' && stop >= start) {
                        const duration = stop - start;
                        totalDuration += duration;

                        ctx.fillStyle = timelineColors[i];
                        // rect Y 座標使用 buttonPositionsY[posIndex] (條的頂部)
                        ctx.fillRect(plotStartX + start * PIXEL_PER_SECOND, buttonPositionsY[posIndex], duration * PIXEL_PER_SECOND, BAR_HEIGHT);
                    } else {
                        console.warn(`類別 ${i}, 按鈕 ${j}, 記錄 ${k}: 無效的開始/結束時間數據。`);
                    }
                }
            } else {
                console.info(`類別 ${i}, 按鈕 ${j}: 沒有時間記錄。`);
            }

            ctx.fillStyle = "Black";
            ctx.font = '12px sans-serif';
            // 文本Y座標：條的中心Y座標 + 微調
            ctx.fillText(sec2time(totalDuration), plotStartX + plotWidth + 20, buttonPositionsY[posIndex] + BAR_HEIGHT / 2 + 2.5);

            posIndex++;
        }
    }

    canvas.addEventListener('click', function () {
        window.open().document.write('<img style="max-width: 100%;" src="' + canvas.toDataURL() + '" />');
    }, false);

    window.scrollTo(0, document.body.scrollHeight);
}

function clearTimeline() {
    const canvasElement = document.getElementById("canvas");

    // 如果 canvas 不存在，直接返回，避免後續操作報錯
    if (!canvasElement) {
        return;
    }

    // canvasElement.parentNode 直接取得父節點，避免再次查詢 divTimeline
    canvasElement.parentNode.removeChild(canvasElement);
}

function createPieChart() {
    const piechartDiv = document.getElementById("divPieChart");
    if (!piechartDiv) {
        console.error("divPieChart 元素未找到。");
        return;
    }

    while (piechartDiv.firstChild) {
        piechartDiv.removeChild(piechartDiv.lastChild);
    }

    // 圓餅圖的繪圖設定常數
    const PIE_RADIUS = 150;
    const PIE_TOP_MARGIN = 60;
    const PIE_BOTTOM_MARGIN = 65; // 下方預留的基礎空間
    const INFO_TEXT_FONT_SIZE = 16;
    const INFO_TEXT_LINE_HEIGHT = 25; // 每行圖例文本的佔用高度
    const INFO_BOX_SIZE = 15;
    const INFO_BOX_TEXT_MARGIN = 8; // 色塊與文字之間的間距，可微調
    const LABEL_OFFSET_FROM_PIE = 15; // 圖例最靠近圓餅圖一側與圓餅圖外圍的距離 (縮小此值會更靠近)
    const LABEL_MAX_ITERATIONS = 100; // 最大調整次數，防止無限循環

    for (let i = 0; i < ftcCategoryName.length; i++) {
        const categoryDurations = allBtnDuration[i];
        const categoryNames = ftcInputName[i];

        if (!categoryDurations || !categoryNames || categoryDurations.length !== categoryNames.length) {
            console.warn(`類別 ${ftcCategoryName[i]} 的時長或名稱數據缺失或不匹配，跳過此圓餅圖。`);
            continue;
        }

        const totalCategoryTime = categoryDurations.reduce((sum, duration) => sum + duration, 0);

        if (totalCategoryTime === 0) {
            console.info(`類別 ${ftcCategoryName[i]} 的總時長為 0，不繪製圓餅圖。`);
            continue;
        }

        const singlePieDiv = document.createElement("div");
        singlePieDiv.className = "d-flex justify-content-center mb2 d-none";
        singlePieDiv.id = `divpc_${i}`;

        const canvas = document.createElement("canvas");
        canvas.className = "img-fluid";
        singlePieDiv.appendChild(canvas);

        const ctx = canvas.getContext("2d");

        // 計算最大文本寬度（用於動態調整 canvas 寬度及下方圖例排列）
        let maxLegendItemWidth = 0;

        ctx.font = `${INFO_TEXT_FONT_SIZE}px sans-serif`;

        const validPieSlices = [];
        let currentAngleForCalc = -0.5 * Math.PI; // 用於計算切片角度，幫助圖例分配
        categoryDurations.forEach((duration, index) => {
            if (duration > 0) {
                const arcScale = duration / totalCategoryTime;
                const legendText = `${categoryNames[index]}, ${sec2time(duration)}, ${Math.round(arcScale * 1000) / 10}%`;
                const textWidth = ctx.measureText(legendText).width;

                const currentItemWidth = INFO_BOX_SIZE + INFO_BOX_TEXT_MARGIN + textWidth;
                if (currentItemWidth > maxLegendItemWidth) {
                    maxLegendItemWidth = currentItemWidth;
                }

                // 計算切片中間角度，用於分配圖例位置
                const midAngle = currentAngleForCalc + (arcScale * Math.PI);

                validPieSlices.push({
                    duration: duration,
                    name: categoryNames[index],
                    arcScale: arcScale,
                    color: pieChartColors[i][index % pieChartColors[i].length],
                    legendText: legendText,
                    textWidth: textWidth,
                    midAngle: midAngle, // 儲存中間角度
                    originalX: 0,
                    originalY: 0,
                    finalX: 0,
                    finalY: 0,
                    minY: 0,
                    maxY: 0,
                    positionType: 'side' // 預設為側邊，之後會判斷是否為下方
                });
                currentAngleForCalc += (2 * arcScale * Math.PI); // 更新下一個切片的起始角度
            }
        });

        // 動態分配圖例到左右兩側或下方
        // 策略：如果切片橫跨或大部分位於圓餅圖底部（約 -0.25π 到 0.75π 或其他自定義範圍），則考慮放下方
        // 這個範圍是經驗值，可以根據實際圖形調整，目標是避免圖例與圓餅圖本身重疊
        const BOTTOM_ANGLE_START = 0.25 * Math.PI; // 大約 45 度
        const BOTTOM_ANGLE_END = 0.75 * Math.PI; // 大約 135 度

        let sideLegends = [];
        let bottomLegends = [];

        validPieSlices.forEach(slice => {
            // 將角度正規化到 0 到 2π 之間，方便判斷
            let normalizedAngle = slice.midAngle % (2 * Math.PI);
            if (normalizedAngle < 0) normalizedAngle += (2 * Math.PI);

            // 判斷是否適合放在下方：如果切片中心角度在底部範圍內
            if (normalizedAngle > BOTTOM_ANGLE_START && normalizedAngle < BOTTOM_ANGLE_END) {
                slice.positionType = 'bottom';
                bottomLegends.push(slice);
            } else {
                sideLegends.push(slice);
            }
        });

        // 計算下方圖例所需的行數和總高度
        const BOTTOM_LEGEND_COLUMNS = Math.floor(canvas.width / (maxLegendItemWidth + 20)); // 每行可以放幾列，預留20px間距
        const bottomLegendRows = Math.ceil(bottomLegends.length / Math.max(1, BOTTOM_LEGEND_COLUMNS));
        const bottomLegendsHeight = bottomLegendRows * INFO_TEXT_LINE_HEIGHT;

        // 動態計算 Canvas 寬度
        // 圓餅圖直徑 + 兩側圖例項目最大寬度 + 兩側圖例與邊緣的間距
        const canvasWidth = PIE_RADIUS * 2 + (maxLegendItemWidth + LABEL_OFFSET_FROM_PIE) * 2 + 50; // 額外多一點空間

        // 動態計算 Canvas 高度
        // 頂部邊距 + 圓餅圖直徑 + 總時長行高 + 下方圖例高度 + 底部預留空間
        const canvasHeight = PIE_TOP_MARGIN + PIE_RADIUS * 2 + INFO_TEXT_LINE_HEIGHT + bottomLegendsHeight + PIE_BOTTOM_MARGIN;

        canvas.id = `pieChartCanvas_${i}`;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        piechartDiv.appendChild(singlePieDiv);
        console.log(`圓餅圖 ${i} 尺寸: 寬=${canvasWidth}, 高=${canvasHeight}`);

        // 繪製背景
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 繪製 Logo
        const imgObject = document.getElementById("logo");
        if (imgObject) {
            const LOGO_WIDTH = 75;
            const LOGO_HEIGHT = 27;
            ctx.drawImage(imgObject, canvasWidth - LOGO_WIDTH - 10, 10, LOGO_WIDTH, LOGO_HEIGHT);
        } else {
            console.warn("Logo 元素 (id='logo') 未找到。");
        }

        // 繪製檔案名稱和類別標題
        ctx.fillStyle = "Black";
        ctx.font = '12px sans-serif';
        const filenameTxt = `FTC_${document.getElementById("filename")?.value || 'unknown'}_pieChart`;
        ctx.fillText(filenameTxt, 10, 25);

        ctx.textAlign = "center";
        ctx.font = '24px sans-serif';
        ctx.fillText(`類別: ${ftcCategoryName[i]}`, canvasWidth / 2, 40);

        const centerX = canvasWidth / 2;
        const centerY = PIE_TOP_MARGIN + PIE_RADIUS;

        // 繪製圓餅圖切片
        let currentPieSliceAngle = -0.5 * Math.PI;
        validPieSlices.forEach(slice => {
            const startAngle = currentPieSliceAngle;
            const endAngle = currentPieSliceAngle + (2 * slice.arcScale * Math.PI);

            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1.5;
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, PIE_RADIUS, startAngle, endAngle);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = slice.color;
            ctx.fill();
            currentPieSliceAngle = endAngle;
        });

        // --- 設定圖例的初始位置 ---
        // 先處理側邊圖例
        sideLegends.forEach(slice => {
            const angle = slice.midAngle; // 使用切片的中間角度

            // X 座標：確保圖例最靠近圓餅圖的一側與圓餅圖保持固定距離
            if (angle > -0.5 * Math.PI && angle < 0.5 * Math.PI) { // 右半圓
                slice.originalX = centerX + PIE_RADIUS + LABEL_OFFSET_FROM_PIE;
            } else { // 左半圓
                slice.originalX = centerX - PIE_RADIUS - LABEL_OFFSET_FROM_PIE - (INFO_BOX_SIZE + INFO_BOX_TEXT_MARGIN + slice.textWidth);
            }
            slice.finalX = slice.originalX;

            // Y 座標：基於切片中心角度，但要考慮重疊調整
            slice.originalY = centerY + (PIE_RADIUS + LABEL_OFFSET_FROM_PIE) * Math.sin(angle);
            slice.finalY = slice.originalY;
        });

        // 處理下方圖例的初始位置
        bottomLegends.forEach((slice, idx) => {
            const col = idx % Math.max(1, BOTTOM_LEGEND_COLUMNS);
            const row = Math.floor(idx / Math.max(1, BOTTOM_LEGEND_COLUMNS));

            // 下方圖例的起始X座標（居中排列）
            const startX = centerX - (BOTTOM_LEGEND_COLUMNS * (maxLegendItemWidth + 20) / 2) + (maxLegendItemWidth + 20) / 2;
            slice.originalX = startX + col * (maxLegendItemWidth + 20) - (slice.textWidth / 2) - INFO_BOX_SIZE - INFO_BOX_TEXT_MARGIN; // 微調使其居中
            slice.finalX = slice.originalX;

            // 下方圖例的Y座標
            slice.originalY = PIE_TOP_MARGIN + PIE_RADIUS * 2 + INFO_TEXT_LINE_HEIGHT + (row * INFO_TEXT_LINE_HEIGHT) + INFO_TEXT_LINE_HEIGHT / 2;
            slice.finalY = slice.originalY;
        });

        // 合併所有圖例以便進行重疊調整
        const allLegends = [...sideLegends, ...bottomLegends];

        // 圖例重疊檢測與調整
        let hasOverlap = true;
        let iteration = 0;

        while (hasOverlap && iteration < LABEL_MAX_ITERATIONS) {
            hasOverlap = false;
            // 按 Y 座標重新排序，從上到下處理
            allLegends.sort((a, b) => a.finalY - b.finalY);

            for (let k = 0; k < allLegends.length; k++) {
                const currentSlice = allLegends[k];
                currentSlice.minY = currentSlice.finalY - INFO_TEXT_LINE_HEIGHT / 2;
                currentSlice.maxY = currentSlice.finalY + INFO_TEXT_LINE_HEIGHT / 2;

                for (let l = k + 1; l < allLegends.length; l++) {
                    const nextSlice = allLegends[l];
                    nextSlice.minY = nextSlice.finalY - INFO_TEXT_LINE_HEIGHT / 2;
                    nextSlice.maxY = nextSlice.finalY + INFO_TEXT_LINE_HEIGHT / 2;

                    // 檢測垂直重疊
                    if (currentSlice.maxY > nextSlice.minY && currentSlice.minY < nextSlice.maxY) {
                        // 檢測水平重疊：判斷它們的 X 軸範圍是否有交集
                        const currentLeft = currentSlice.finalX;
                        const currentRight = currentSlice.finalX + INFO_BOX_SIZE + INFO_BOX_TEXT_MARGIN + currentSlice.textWidth;
                        const nextLeft = nextSlice.finalX;
                        const nextRight = nextSlice.finalX + INFO_BOX_SIZE + INFO_BOX_TEXT_MARGIN + nextSlice.textWidth;

                        // 只有當它們的水平範圍重疊時才處理垂直重疊
                        if (!(currentRight < nextLeft || nextRight < currentLeft)) {
                            // 解決重疊：將下一個項目向下推
                            nextSlice.finalY = currentSlice.maxY + 2; // 推開一點距離 (2像素緩衝)
                            hasOverlap = true; // 發生重疊，需要再次迭代
                        }
                    }
                }
            }
            iteration++;
        }

        // 最終繪製調整後的圖例
        allLegends.forEach(slice => {
            const boxX = slice.finalX;
            const boxY = slice.finalY - INFO_BOX_SIZE / 2;

            ctx.beginPath();
            ctx.rect(boxX, boxY, INFO_BOX_SIZE, INFO_BOX_SIZE);
            ctx.fillStyle = slice.color;
            ctx.fill();

            const textDrawX = boxX + INFO_BOX_SIZE + INFO_BOX_TEXT_MARGIN;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.font = `${INFO_TEXT_FONT_SIZE}px sans-serif`;
            ctx.fillStyle = "black"; // **確保文字顏色為黑色**
            ctx.fillText(slice.legendText, textDrawX, slice.finalY);
        });

        // 繪製總時長 (在所有圖例下方)
        ctx.textAlign = "center";
        ctx.font = '20px sans-serif';
        // 總時長位於所有圖例的最低點下方，並有額外間距
        const finalBottomY = allLegends.reduce((max, slice) => Math.max(max, slice.maxY), PIE_TOP_MARGIN + PIE_RADIUS * 2 + INFO_TEXT_LINE_HEIGHT);
        ctx.fillText(`總時長: ${sec2time(totalCategoryTime)}`, canvasWidth / 2, finalBottomY + PIE_BOTTOM_MARGIN / 2); // 留出 PIE_BOTTOM_MARGIN / 2 作為緩衝
        ctx.textAlign = "left"; // 重置為預設左對齊

        singlePieDiv.classList.remove("d-none");
    }

    piechartDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function clearPieChart() {
    const piechartDiv = document.getElementById("divPieChart");
    while (piechartDiv.firstChild) {
        piechartDiv.removeChild(piechartDiv.lastChild);
    }
}

// --- 原始的 generateStatisticsExcel 函式 (保留其直接下載行為) ---
function generateStatisticsExcel() {
    getStatisticsExcelBlob().then(blob => {
        const filenameValue = typeof filename !== 'undefined' ? filename : (document.getElementById("filename")?.value || new Date().toLocaleDateString()).replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
        downloadBlob(blob, `FTC_${filenameValue}_Statistics.xlsx`);
    }).catch(error => {
        console.error("生成 Statistics Excel 失敗:", error);
        alert("生成 Statistics Excel 失敗！請檢查控制台。");
    });
}

// --- 原始的 generateRecordExcel 函式 (保留其直接下載行為) ---
function generateRecordExcel() {
    getRecordExcelBlob().then(blob => {
        const filenameValue = typeof filename !== 'undefined' ? filename : (document.getElementById("filename")?.value || new Date().toLocaleDateString()).replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
        downloadBlob(blob, `FTC_${filenameValue}_Records.xlsx`);
    }).catch(error => {
        console.error("生成 Records Excel 失敗:", error);
        alert("生成 Records Excel 失敗！請檢查控制台。");
    });
}

function download(content, fileName, mimeType) {
    var a = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob(["\uFEFF" + content], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in a) { //html5 A[download]
        a.href = URL.createObjectURL(new Blob(["\uFEFF" + content], {
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

/**
 * 確保數字在個位數時前面補零。
 * @param {number} num 要處理的數字。
 * @returns {string|number} 補零後的字串或原始數字。
 */
function leading0(num) {
    // 使用 String.prototype.padStart() 方法，語義更清晰，且處理數字更直接
    // '00' 表示最小兩位數，用 '0' 填充
    return String(num).padStart(2, '0');
}

/**
 * 將秒數轉換為 'MM:SS' 格式的時間字串。
 * @param {number} totalSeconds 總秒數。
 * @returns {string} 格式化後的時間字串。
 */
function sec2time(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60; // 使用模運算符更簡潔地獲取餘數秒

    // 直接使用優化後的 leading0 函數
    return `${leading0(minutes)}:${leading0(seconds)}`; // 使用模板字串更簡潔
}

// graph.js (新增或更新的部分)

// --- 輔助函式：用於下載 Blob ---
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- 輔助函式：從 Canvas 獲取 Blob (Promise 版本) ---
function getCanvasBlob(canvasId, mimeType = 'image/png') {
    return new Promise((resolve, reject) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            reject(new Error(`Canvas with ID '${canvasId}' not found.`));
            return;
        }
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error(`Failed to get blob from canvas '${canvasId}'.`));
            }
        }, mimeType);
    });
}

// --- 新增：獲取 Statistics Excel Blob 的輔助函式 ---
// 精確複製 generateStatisticsExcel 的數據準備邏輯
async function getStatisticsExcelBlob() {
    const wb = XLSX.utils.book_new();

    if (!ftcInputName || ftcInputName.length === 0 || !ftcInputName[0] || ftcInputName[0].length === 0) {
        console.warn("ftcInputName[0] 為空，無法生成 Statistics Excel 內容。");
        const ws = XLSX.utils.aoa_to_sheet([["No data available."]]);
        XLSX.utils.book_append_sheet(wb, ws, "No Data");
    } else {
        for (let i = 0; i < ftcInputName[0].length; i++) {
            let sheetName = `${ftcCategoryName[0]}-${ftcInputName[0][i]}`.replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, ''); // 確保工作表名稱合法
            if (sheetName.length > 31) {
                console.warn(`工作表名稱 "${sheetName}" 過長，將被截斷。`);
                sheetName = sheetName.substring(0, 31);
                console.warn(`截斷後的工作表名稱為 "${sheetName}"。`);
            }
            const ws_data = [];
            ws_data.push([
                `${ftcCategoryName[0]}-${ftcInputName[0][i]}`,
                '按鍵組合',
                '次數',
                '時長'
            ]);

            for (let j = 0; j < ftcInputName[1].length; j++) {
                for (let k = 0; k < ftcInputName[2].length; k++) {
                    const rowLabel = `${ftcInputName[0][i]}-${ftcInputName[1][j]}-${ftcInputName[2][k]}`;
                    const combinationLabel = `${ftcInputName[1][j]} + ${ftcInputName[2][k]}`;
                    const value1 = threeDArray[i] && threeDArray[i][j] && threeDArray[i][j][k] !== undefined ? threeDArray[i][j][k] : '';
                    const value2 = combinationTimes[i] && combinationTimes[i][j] && combinationTimes[i][j][k] !== undefined ? combinationTimes[i][j][k] : '';

                    ws_data.push([rowLabel, combinationLabel, value1, value2]);
                }
            }
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    }

    if (typeof XLSX === 'undefined') {
        throw new Error("XLSX.js 庫未載入。無法生成 Excel Blob。");
    }
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// --- 新增：獲取 Record Excel Blob 的輔助函式 ---
// 精確複製 generateRecordExcel 的數據準備邏輯
async function getRecordExcelBlob() {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // --- 步驟 1: 構建 Header Row (第一列) ---
    const headerRow = [];
    if (!ftcInputName || ftcInputName.length === 0) {
        console.warn("ftcInputName 為空，無法生成 Record Excel 標題。");
        headerRow.push("No header data available.");
    } else {
        for (let i = 0; i < ftcInputName.length; i++) {
            const categoryButtons = ftcInputName[i];
            if (categoryButtons) {
                for (let j = 0; j < categoryButtons.length; j++) {
                    const buttonName = categoryButtons[j];
                    headerRow.push(`START ${buttonName}`);
                    headerRow.push(`STOP ${buttonName}`);
                }
            }
        }
    }
    ws_data.push(headerRow);

    // --- 步驟 2: 計算總共有多少行數據 (由所有按鈕的最大起迄對數決定) ---
    let maxRowsNeeded = 0;
    if (typeof allBtnStartEnd !== 'undefined' && allBtnStartEnd.length > 0) {
        for (let i = 0; i < allBtnStartEnd.length; i++) {
            if (allBtnStartEnd[i]) {
                for (let j = 0; j < allBtnStartEnd[i].length; j++) {
                    const records = allBtnStartEnd[i][j];
                    if (records && records.length > 0) {
                        const currentPairs = records.length / 2;
                        if (currentPairs > maxRowsNeeded) {
                            maxRowsNeeded = currentPairs;
                        }
                    }
                }
            }
        }
    }
    if (maxRowsNeeded === 0) {
        maxRowsNeeded = 1;
    }

    // --- 步驟 3: 構建 Data Rows (從第二列開始) ---
    if (typeof allBtnStartEnd === 'undefined' || allBtnStartEnd.length === 0) {
        console.warn("allBtnStartEnd 數據為空，Record Excel 將只包含標題。");
    } else {
        for (let p_idx = 0; p_idx < maxRowsNeeded; p_idx++) {
            const currentRowData = [];
            for (let i = 0; i < ftcInputName.length; i++) {
                const categoryButtons = ftcInputName[i];
                if (categoryButtons) {
                    for (let j = 0; j < categoryButtons.length; j++) {
                        const buttonRecords = (allBtnStartEnd[i] && allBtnStartEnd[i][j]) ? allBtnStartEnd[i][j] : [];

                        const startK = p_idx * 2;
                        const endK = p_idx * 2 + 1;

                        if (buttonRecords.length > endK) {
                            currentRowData.push(buttonRecords[startK]);
                            currentRowData.push(buttonRecords[endK]);
                        } else {
                            currentRowData.push('');
                            currentRowData.push('');
                        }
                    }
                }
            }
            ws_data.push(currentRowData);
        }
    }

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    const colWidths = headerRow.map(header => ({
        wch: header.length + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, '所有按鈕起迄記錄');

    if (typeof XLSX === 'undefined') {
        throw new Error("XLSX.js 庫未載入。無法生成 Excel Blob。");
    }
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// --- 1. 下載 TIMELINE 為 PNG 圖片 ---
async function downloadTimeline() {
    let timelineCanvas = document.getElementById("canvas");
    if (!timelineCanvas) {
        showResult();
        timelineCanvas = document.getElementById("canvas");
    }

    try {
        const filenameValue = typeof filename !== 'undefined' ? filename : (document.getElementById("filename")?.value || new Date().toLocaleDateString()).replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
        const blob = await getCanvasBlob("canvas", "image/png");
        downloadBlob(blob, `FTC_${filenameValue}_Timeline.png`);
        console.log("Timeline 下載成功！");
    } catch (error) {
        console.error("下載 Timeline 失敗:", error);
        alert("下載 Timeline 失敗！請檢查控制台。");
    }
}

// --- 2. 下載 PIECHART 為 PNG 圖片 (多個) ---
async function downloadPieChart() {
    if (typeof ftcCategoryName === 'undefined' || ftcCategoryName.length === 0) {
        alert("沒有可下載的 PieChart 圖表，ftcCategoryName 未定義或為空。");
        return;
    }

    const pieChartCount = ftcCategoryName.length;
    const piechartDiv = document.getElementById("divPieChart");
    if (piechartDiv && piechartDiv.childElementCount === 0) {
        showResult();
    }

    for (let i = 0; i < pieChartCount; i++) {
        const canvasId = `pieChartCanvas_${i}`;
        const pieChartCanvas = document.getElementById(canvasId);

        if (!pieChartCanvas) {
            console.warn(`PieChart canvas (ID: '${canvasId}') not found. Skipping.`);
            continue;
        }

        try {
            const filenameValue = typeof filename !== 'undefined' ? filename : (document.getElementById("filename")?.value || new Date().toLocaleDateString()).replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
            const categoryName = ftcCategoryName[i].replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
            const blob = await getCanvasBlob(canvasId, "image/png");
            downloadBlob(blob, `FTC_${filenameValue}_${categoryName}_PieChart.png`);
            console.log(`PieChart ${i} (${categoryName}) 下載成功！`);
        } catch (error) {
            console.error(`下載 PieChart ${i} (${ftcCategoryName[i]}) 失敗:`, error);
            alert(`下載 PieChart ${i} 失敗！請檢查控制台。`);
        }
    }
}

// --- 3. 下載所有檔案的 ZIP 壓縮包 ---
async function downloadZipFile() {
    // 確保已引入 JSZip 庫
    if (typeof JSZip === 'undefined') {
        console.error("JSZip 庫未載入。請確認您的 HTML 文件中是否正確引入了 JSZip。");
        alert("壓縮檔案功能需要 JSZip 庫，請檢查網絡或 HTML 文件。");
        return;
    }

    const zip = new JSZip();
    // 假設 filename 是全域變數，已在 graph.js 頂部初始化
    const filenameValue = typeof filename !== 'undefined' ? filename : (document.getElementById("filename")?.value || new Date().toLocaleDateString()).replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
    const zipFilename = `FTC_${filenameValue}_AllFileZip.zip`;

    // 1. 添加 Statistics Excel (使用輔助函式獲取 Blob)
    try {
        const statisticsBlob = await getStatisticsExcelBlob();
        zip.file(`FTC_${filenameValue}_Statistics.xlsx`, statisticsBlob);
        console.log("Statistics Excel (.xlsx) 添加到 Zip。");
    } catch (error) {
        console.warn("生成 Statistics Excel 失敗，將跳過此檔案:", error);
    }

    // 2. 添加 Record Excel (使用輔助函式獲取 Blob)
    try {
        const recordBlob = await getRecordExcelBlob();
        zip.file(`FTC_${filenameValue}_Records.xlsx`, recordBlob);
        console.log("Record Excel (.xlsx) 添加到 Zip。");
    } catch (error) {
        console.warn("生成 Records Excel 失敗，將跳過此檔案:", error);
    }

    // 3. 添加 Timeline (從 Canvas 獲取 Blob)
    let timelineCanvas = document.getElementById("canvas");
    if (!timelineCanvas) {
        showResult();
        timelineCanvas = document.getElementById("canvas");
    }
    if (timelineCanvas) {
        try {
            const timelineBlob = await getCanvasBlob("canvas", "image/png");
            zip.file(`FTC_${filenameValue}_Timeline.png`, timelineBlob);
            console.log("Timeline PNG 添加到 Zip。");
        } catch (error) {
            console.warn("獲取 Timeline Canvas 失敗，將跳過此檔案:", error);
        }
    } else {
        console.warn("Timeline Canvas (ID: 'canvas') 未找到，將跳過此檔案。");
    }

    // 4. 添加 PieCharts (遍歷所有 PieChart Canvas 並獲取 Blob)
    if (typeof ftcCategoryName !== 'undefined' && ftcCategoryName.length > 0) {
        const pieChartCount = ftcCategoryName.length;
        for (let i = 0; i < pieChartCount; i++) {
            const canvasId = `pieChartCanvas_${i}`;
            const pieChartCanvas = document.getElementById(canvasId);
            if (pieChartCanvas) {
                try {
                    const pieChartBlob = await getCanvasBlob(canvasId, "image/png");
                    const categoryName = ftcCategoryName[i].replace(/[^0-9A-Za-z\u4e00-\u9fa5-]/g, '_').replace(/\s/g, '');
                    zip.file(`FTC_${filenameValue}_${categoryName}_PieChart.png`, pieChartBlob);
                    console.log(`PieChart ${i} (${categoryName}) PNG 添加到 Zip。`);
                } catch (error) {
                    console.warn(`獲取 PieChart ${i} Canvas 失敗，將跳過此檔案:`, error);
                }
            } else {
                console.warn(`PieChart Canvas (ID: '${canvasId}') 未找到，將跳過此檔案。`);
            }
        }
    } else {
        console.warn("ftcCategoryName 未定義或為空，將跳過 PieChart 檔案。");
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