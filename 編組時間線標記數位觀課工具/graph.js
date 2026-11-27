let btn_total_time = [];
function exportToXlsx() {
    if (records.length === 0) {
        alert("沒有任何記錄可匯出！");
        return;
    }

    // 1. 先按群組排序（1~8 → Ungrouped）
    const sortedRecords = [...records].sort((a, b) => {
        const aGroup = a.group === 0 ? 9 : a.group;
        const bGroup = b.group === 0 ? 9 : b.group;
        return aGroup - bGroup;
    });

    // 2. 產生 title 列（每個唯一按鈕一對 start/stop）
    const titleRow = [];
    const buttonOrder = []; // 記錄每個按鈕的順序（用來對應資料行）

    buttonsData.forEach(item => {
        const groupLabel = item.groupNum === 0 ? 'Ungrouped' : `Group ${item.groupNum}`;
        titleRow.push(`start ${groupLabel}-${item.value}`);
        titleRow.push(`stop ${groupLabel}-${item.value}`);
        buttonOrder.push({ groupLabel: groupLabel, value: item.value });
    });

    // 3. 產生資料列（嚴格連續，不留任何空行）
    const dataRows = [new Array(titleRow.length).fill('')]; // 初始化空資料列

    // 對每個按鈕，逐筆記錄其所有 start/stop
    buttonOrder.forEach(({ groupLabel, value }) => {
        const buttonRecords = sortedRecords.filter(r =>
            (r.group === 0 ? 'Ungrouped' : `Group ${r.group}`) === groupLabel &&
            r.value === value
        );
        const startTitle = `start ${groupLabel}-${value}`;
        const stopTitle = `stop ${groupLabel}-${value}`;

        const startIndex = titleRow.indexOf(startTitle);
        const stopIndex = titleRow.indexOf(stopTitle);

        while (dataRows.length < buttonRecords.length) {
            dataRows.push(new Array(titleRow.length).fill(''));
        }

        buttonRecords.forEach((record, i) => {
            // 填入 start / stop 值（永遠連續，不留空）
            if (startIndex !== -1) dataRows[i][startIndex] = record.start ?? '';
            if (stopIndex !== -1) dataRows[i][stopIndex] = record.stop ?? '';
        });
    });

    // 5. 生成並下載 XLSX
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([titleRow, ...dataRows]);
    XLSX.utils.book_append_sheet(wb, ws, "Timer Records");

    XLSX.writeFile(wb, "STC_" + document.getElementById("filename").value.replace(/[\\/:*?"<>|]/g, '_') + "_records.xlsx");
}

function clearTimeline() {
    const canvas = document.getElementById("canvas");
    // 如果 canvas 存在，就執行移除
    if (canvas) {
        canvas.remove();
    }
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
    if (records.length === 0) {
        alert("沒有任何記錄可匯出！");
        return;
    }
    clearTimeline();

    var numOfButtons = buttonsData.length

    var labels = [];
    for (var ii = 0; ii < numOfButtons; ii++) {
        labels.push(buttonsData[ii].value);
    }

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.id = "canvas";
    document.getElementById("result_div").appendChild(canvas);
    // Draw grid, 20px for 1 minute, --> plotWidth + labels and totals
    // canvas width


    var textLength = 0;
    for (var i = 0; i < numOfButtons; i++) {
        if (ctx.measureText(labels[i]).width > textLength) {
            textLength = ctx.measureText(labels[i]).width;
        }
    }

    var plotWidth; // this from lenght of time
    plotWidth = Math.ceil(ticks / 60) * 20; //20 pixel per min(60sec)
    var canvasWidth = plotWidth + textLength * 2 + 100;	// add room for totals and then some
    canvas.width = canvasWidth;

    // canvas height
    var topMargin = 50;
    var plotHeight = 60 * numOfButtons;
    var canvasHeight = plotHeight + 2 * topMargin;	// add margin and space for ticks
    canvas.height = canvasHeight;

    var plotStart = textLength + 50; // where the plot starts (x), labels to the left

    // postion for labels
    var height = 40; // height of the horizontal bars
    var pos = [];
    for (var i = 0; i < numOfButtons; i++) {
        //var step = 20;
        pos.push(i * plotHeight / numOfButtons + height * 0.5 + topMargin);
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
    var labels = [];
    for (var i = 0; i < numOfButtons; i++) {
        var txt = buttonsData[i].value;
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
    var imgObject;
    imgObject = document.getElementById("logo");
    ctx.drawImage(imgObject, canvasWidth - 50, 5, 50, 18);

    // Clear canvas!
    //canvas.style.visibility = "visible";
    var totals = new Array(numOfButtons).fill(0);

    records.forEach(record => {
        let len = record.stop - record.start;
        let index = buttonsData.findIndex(item => item.groupNum === record.group && item.value === record.value);
        if (index === -1) {
            console.warn("No matching button found for record:", record);
            return; // skip if no matching button found
        }
        totals[index] += len;
        ctx.fillStyle = GROUP_COLORS[record.group];
        ctx.fillRect(plotStart + record.start / 3, pos[index], len / 3, height); // /3 to scale 20px for 1 minute
    });
    for (var i = 0; i < numOfButtons; i++) {
        ctx.fillStyle = "Black"
        ctx.font = '12px sans-serif';
        ctx.fillText(sec2time(totals[i]), plotStart + plotWidth + 20, pos[i] + height / 2 + 2.5);
    };

    // autoscroll to the bottom of the page to show the timeline
    window.scrollTo(0, document.body.scrollHeight);
}

function saveTimeline() {
    // check if canvas exists and if not create it
    if (!document.getElementById("canvas")) {
        createTimeline();
    }
    var link = document.createElement("a");
    link.setAttribute('download', 'STC_' + document.getElementById("filename").value.replace(/[\\/:*?"<>|]/g, '_') + '_timeline');
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
}
