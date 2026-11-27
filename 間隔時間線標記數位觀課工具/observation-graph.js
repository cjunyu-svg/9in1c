var timelineColors = ["#15bef0", "#e5053a", "#fcd116", "#5bbf21", "#3a75c4", "#e63375", "#eda075", "#00b08c", "#9258c8", "#8c0032", "#fca311", "#009e60"];
var maxItemCount;
var totalItemNum = 0;

function clearTimeline() {
	if (document.getElementById("canvas") == null) { return; }
	node = document.getElementById("divTimeline");
	removed = document.getElementById("canvas");
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

function showResult() {
	if (masterRunning) {
		if (!confirm('Are you sure? Stop timer and create data.')) return;
		ticker.stop();
		masterRunning = false;
		stopAll();
		rstStpBtn.innerHTML = "Reset";
	}
	else if (document.getElementById("canvas") != null) { if (!confirm('Create new timeline?')) return; }

	if (data.length == 0) {
		alert('There is no data!');
		return;
	} else if (data[0].isEmpty()) {
		alert('There is no data!');
		return;
	}

	createTable();
	createPieChart();
	createTimeline();
}

function createTimeline() {
	var timelineDiv = document.getElementById("divTimeline");
	while (timelineDiv.firstChild) {
		timelineDiv.removeChild(timelineDiv.lastChild);
	}

	var setting = new barChartSetting();
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	canvas.id = "canvas";
	timelineDiv.appendChild(canvas);
	// Draw grid, 20px for 1 minute, --> plotWidth + labels and totals

	//settings
	var btnAllNames = [defaultValue];
	Array.prototype.push.apply(btnAllNames, btnNames);

	var topMargin = 50;
	var bottomMargin = 100;
	var leftMargin = 50;
	var rightMargin = 50;

	var legendGraphWidth = 10;


	// canvas width
	ctx.font = '16px sans-serif';
	var textLength = legendGraphWidth + setting.legendLabelLeftGap + ctx.measureText(btnAllNames[0]).width;

	for (var ii = 1; ii <= constItemNum; ii++) {
		//var txt = document.getElementById("b" + ii).textContent;
		textLength += setting.legendGap + legendGraphWidth + setting.legendLabelLeftGap + ctx.measureText(btnAllNames[ii]).width;
	}
	var plotWidth = setting.plotWidth(); //depend on rounds
	plotWidth = (plotWidth > textLength) ? plotWidth : textLength;

	var canvasWidth = plotWidth + leftMargin + rightMargin;	// add room for totals and then some
	canvas.width = canvasWidth;

	// canvas height
	var plotHeight = setting.plotHeight();
	var canvasHeight = plotHeight + topMargin + bottomMargin;	// add margin and space for ticks
	canvas.height = canvasHeight;

	var plotStart = leftMargin; // where the plot starts (x), labels to the left

	// draw white background
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);


	// axes
	ctx.fillStyle = "black";
	//
	ctx.beginPath();
	ctx.moveTo(plotStart, plotHeight + topMargin);
	ctx.lineTo(plotStart + plotWidth, plotHeight + topMargin);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(plotStart, plotHeight + topMargin);
	ctx.lineTo(plotStart, topMargin);
	ctx.stroke();

	// Y-ticks and labels
	for (var ii = 0; ii < plotHeight; ii++) {
		//var txt = document.getElementById("b" + ii).textContent;
		if (ii % (setting.unitHeight * 2) == 0) {
			ctx.font = '12px sans-serif';
			ctx.fillStyle = "black";
			ctx.fillText(ii / setting.unitHeight, plotStart - 7 - 10, canvas.height - bottomMargin - ii);

			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000000";
			ctx.beginPath();
			ctx.moveTo(plotStart - 3, canvas.height - (ii + bottomMargin));
			ctx.lineTo(plotStart + 3, canvas.height - (ii + bottomMargin));
			ctx.stroke();
		}
	}

	// postion for legend labels
	var labelStart = canvas.width / 2 - textLength / 2; // height of the horizontal bars
	//legend pos
	var pos = [];
	var labelXPos = pos[0] = labelStart;
	for (var pp = 0; pp < btnAllNames.length - 1; pp++) {
		ctx.font = '16px sans-serif';
		labelXPos += (setting.legendGap + legendGraphWidth + setting.legendLabelLeftGap + ctx.measureText(btnAllNames[pp]).width);
		pos.push(labelXPos);
	}
	//legend draw
	var tmpHeight = topMargin + plotHeight + setting.barGrupLabelTopOffset + setting.legendTopOffset - legendGraphWidth / 2;
	ctx.font = '16px sans-serif';
	for (i = 0; i < btnAllNames.length; i++) {
		ctx.fillStyle = timelineColors[i];
		ctx.fillRect(pos[i], tmpHeight, legendGraphWidth, legendGraphWidth);

		ctx.fillStyle = "black";
		ctx.fillText(btnAllNames[i], pos[i] + legendGraphWidth + setting.legendLabelLeftGap, tmpHeight + legendGraphWidth / 2 + setting.txtHeight / 2);
	}

	ctx.fillText('次數', plotStart - ctx.measureText('次數').width / 2, topMargin - 15);

	for (var ii = 0; ii < setting.rnds; ii++) {//every 1 min, x-ticks mark
		var txt = "第" + (ii + 1) + "輪";
		ctx.fillText(txt, plotStart + setting.barGraphLeftOffset + setting.barGroupWidth / 2 - ctx.measureText(txt).width / 2 + (setting.barGroupWidth + setting.barGroupGap) * ii, plotHeight + topMargin + setting.barGrupLabelTopOffset);
	}
	//draw logo 
	//logo:https://drive.google.com/file/d/1UIrZLRstP3Tq708Uf50uX1YAlOCN9QdW/view?usp=share_link
	var imgObject;
	imgObject = document.getElementById("logo");
	ctx.drawImage(imgObject, canvasWidth - 130, 10, 75, 27);

	//filename
	ctx.fillStyle = "Black"
	ctx.font = '12px sans-serif';
	var filenametxt = "ITC_" + document.getElementById("filename").value + "_barChart";
	ctx.fillText(filenametxt, canvasWidth - 140 - ctx.measureText(filenametxt).width, 23);

	data.forEach((rnd, i) => {
		if (!rnd.isEmpty()) {
			rnd.itemSum.forEach((item, j) => {
				ctx.fillStyle = timelineColors[j];
				var x = plotStart + setting.barGraphLeftOffset + (setting.barWidth + setting.barGap) * j + (setting.barGroupWidth + setting.barGroupGap) * i;
				var width = setting.barWidth;
				var height = parseInt(item) * setting.unitHeight;
				var y = topMargin + plotHeight - height;
				ctx.fillRect(x, y, width, height);
				ctx.font = '11px sans-serif';
				ctx.fillStyle = "black";
				ctx.fillText(item, x + (setting.barWidth / 2 - ctx.measureText(item).width / 2), y - setting.barLabelBottomOffset);
			});
		}
	});

	// make clickable
	canvas.addEventListener('click', function () {
		//var canvasDataUrl = canvas.toDataURL("image/png");

		window.open().document.write('<img style="max-width: 100%;" src="' + canvas.toDataURL() + '" />');

		//window.open(canvasDataUrl, '_blank');
	}, false);

	// autoscroll to the bottom of the page to show the timeline
	window.scrollTo(0, document.body.scrollHeight);
}

function saveTimeline(item) {
	if (masterRunning) {
		if (!confirm('Are you sure? Stop timer and create data.')) return;
		ticker.stop();
		masterRunning = false;
		stopAll();
		rstStpBtn.innerHTML = "Reset";
	}
	// check if canvas exists and if not create it
	if (data.length == 0) {
		alert('There is no data!');
		return;
	} else if (data[0].isEmpty()) {
		alert('There is no data!');
		return;
	}
	var link = document.createElement("a");

	if (item == 0) {
		if (!document.getElementById("canvas")) {
			createTimeline();
		}
		link.setAttribute('download', "ITC_" + document.getElementById("filename").value + "_barChart");
		link.href = canvas.toDataURL("image/png");
		document.body.appendChild(link);
		link.click();
		link.remove();
	}

	if (item == 1) {
		if (!document.getElementById("pieChartCanvas")) {
			createPieChart();
		}
		link.setAttribute('download',"ITC_" +  document.getElementById("filename").value + "_pieChart");
		link.href = pieChartCanvas.toDataURL("image/png");
		document.body.appendChild(link);
		link.click();
		link.remove();
	}
}

function barChartSetting() {
	//bar
	this.barWidth = 10;
	this.barGap = 1;
	this.barGroupGap = 30;
	this.barGraphLeftOffset = 3;
	this.barLabelBottomOffset = 5;
	this.unitHeight = 20;
	this.rnds = data.length - (data[data.length - 1].isEmpty() ? 1 : 0);
	this.barGroupWidth = this.barWidth + (this.barWidth + this.barGap) * (constItemNum - 1);
	this.txtHeight = 12;

	//group label
	this.barGrupLabelTopOffset = 20;

	//legend graph 
	this.legendTopOffset = 20;
	this.legendGap = 10;
	this.legendLabelLeftGap = 3;

	this.plotWidth = function () {
		return this.barGraphLeftOffset + (this.barGroupWidth) + (this.barGroupGap + this.barGroupWidth) * (this.rnds - 1);
	}

	this.plotHeight = function () {
		var maxClick = 0;
		data.forEach((dt) => {
			if (dt.maxClick > maxClick) maxClick = dt.maxClick;
		})
		return this.unitHeight * Math.ceil(maxClick / 3) * 3 + this.barLabelBottomOffset;
	}

}
function createTable() {
	var tableDiv = document.getElementById("divTable");
	while (tableDiv.firstChild) {
		tableDiv.removeChild(tableDiv.lastChild);
	}

	var content = '';

	content += "<table class = 'table table-bordered table-striped'>" +
		"<tr class='text-center'>" +
		"<td class = 'align-middle'>類別統計</td>" +
		"<td colspan=2 class = 'align-middle'>" + pattenGen(allItemSum) + "</td></tr>" +
		"<tr class='text-center'><td rowspan=" + data.length + "  class = 'align-middle'>時間統計	</td>";
	data.forEach((rnd, i) => {
		if (i != 0) content += "<tr class='text-center'>";
		if (!rnd.isEmpty()) {
			content += "<td  class = 'align-middle'>第" + (i + 1) + "輪觀察時間：" +
				rnd.data[0][0] + "~" + rnd.data[rnd.data.length - 1][0] + "</td><td  class = 'align-middle'>" + pattenGen(rnd.itemSum) + "</td>";
		}
		if (i == 0) content += "</tr>";
	});
	content += "</tr></table>";

	tableDiv.innerHTML = content;
}

function downloadTables(text, filename) {
	var divTB = document.getElementById("divTable");
	if (divTB.innerHTML.length == 0) {
		createTable();
	}
	text = document.getElementById("divTable").outerHTML;
	text = "<!DOCTYPE html><html xml:lang=\"en\" lang=\"en\"><head><meta http-equiv=\"content-type\" content=\"text/html;charset=utf-8\" /><meta name=\"viewport\" content=\"width=device-width\"><meta name=\"generator\" content=\"Geany 1.32\" /><!-- Bootstrap CSS --><link href=\"./vendor/cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css\" rel=\"stylesheet\"integrity=\"sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU\" crossorigin=\"anonymous\"></head><body>" + text + "</body></html";
	var blob = new Blob([text], { type: "'text/html" });
	var url = window.URL.createObjectURL(blob);
	var a = document.createElement("a");
	a.href = url;
	a.download = "ITC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^\_])/g, '_') + "_statistics_table.html";
	a.click();
	a.remove();
}

function pattenGen(ary) {
	var content = '';
	var btnAllNames = [defaultValue];
	Array.prototype.push.apply(btnAllNames, btnNames);

	ary.forEach((item, index) => {

		if (index % 2 == 1) {
			content += "&emsp;&emsp;";
		}
		content += "(" + (index + 1) + ")「" + ObservationRecovery.escape(btnAllNames[index]) + "」共 " + item + " 人次(/節)";
		if (index % 2 == 1) {
			content += "<br>";
		}
	});
	return content;
}
function createPieChart() {
	var piechartDiv = document.getElementById("divPieChart");
	while (piechartDiv.firstChild) {
		piechartDiv.removeChild(piechartDiv.lastChild);
	}
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");
	var btnAllNames = [defaultValue];
	Array.prototype.push.apply(btnAllNames, btnNames);
	var sum = 0;

	//get the sum of all items(for the rate)
	allItemSum.forEach(sums => sum += sums);

	//calculate width and height of canvas
	//draw the icon info
	var progress = -0.5;//start angle of pieChart
	var singleSideWidth = 0, bottomHeight = 0;//for the room of icon info
	var itemCount = 0;//left side reverse icon info
	ctx.font = '16px sans-serif';
	allItemSum.forEach((sums, i) => {
		if (sums != 0) {
			itemCount++;
			var arcScale = sums / sum;
			var pos = progress + arcScale;
			if (pos > 0.167 && pos <= 0.833) {//bottomHeight
				bottomHeight++;
			} else {//width
				var txt = (btnAllNames[i] + ", " + sums + "人次, " + Math.round(arcScale * 100) + "%");
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

	canvas.id = "pieChartCanvas";
	canvas.width = w;
	canvas.height = h;
	piechartDiv.appendChild(canvas);

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, w, h);

	//logo
	var imgObject;
	imgObject = document.getElementById("logo");
	ctx.drawImage(imgObject, w - 75, 10, 75, 27);
	//file name
	ctx.fillStyle = "Black"
	ctx.font = '12px sans-serif';
	var filenametxt ="ITC_" +  document.getElementById("filename").value + "_pieChart";
	ctx.fillText(filenametxt, w - 85 - ctx.measureText(filenametxt).width, 23);

	progress = -0.5;//reset start angle of pieChart
	var left = right = bot = 0, x, y;//for calculating icon info position

	allItemSum.forEach((sums, i) => {
		if (sums != 0) {
			ctx.beginPath();
			ctx.strokeStyle = "white";
			ctx.lineWidth = 1.5;
			ctx.moveTo(center_x, center_y);
			var arcScale = sums / sum;
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
			var text = (btnAllNames[i] + ", " + sums + "人次, " + Math.round(arcScale * 100) + "%");

			ctx.fillText(text, x + 20, y);

			progress += 2 * arcScale;
		}
	});
	canvas.addEventListener('click', function () {
		window.open().document.write('<img style="max-width: 100%;" src="' + canvas.toDataURL() + '" />');
	}, false);

}
// ===== 工作表名稱檢測與修正 =====
function sanitizeSheetName(name) {
    var sanitized = name
        .replace(/[\\\/\?\*\[\]:]/g, '_')
        .replace(/^'|'$/g, '')
        .substring(0, 31);
    
    if (sanitized.length === 0) {
        sanitized = 'Sheet1';
    }
    
    return sanitized;
}

// ===== 檔案名稱檢測與修正 =====
function sanitizeFileName(name) {
    var sanitized = name
        .replace(/[<>:"\/\\|?*]/g, '_')
        .replace(/\s+$/g, '')
        .replace(/\.+$/g, '');
    
    if (sanitized.length > 245) {
        sanitized = sanitized.substring(0, 245);
    }
    
    if (sanitized.length === 0) {
        sanitized = 'file';
    }
    
    return sanitized;
}

// ===== 共用函數：準備 ITC 資料 =====
function prepareITCData() {
    if (data.length == 0 || data[0].isEmpty()) {
        return null;
    }
    
    var btnAllNames = [defaultValue];
    Array.prototype.push.apply(btnAllNames, btnNames);
    
    var wsData = [];
    var head_line_1 = ["輪次"];
    var head_line_2 = ["對象"];
    var content = [];
    
    // 初始化每個對象的內容
    for (i = 0; i < constOBnum; i++) {
        content[i] = [i + 1]; // 序號
    }
    
    // 處理每一輪的資料
    data.forEach(function (rnd, i) {
        if (!rnd.isEmpty()) {
            head_line_1.push("第" + (i + 1) + "輪", "第" + (i + 1) + "輪");
            head_line_2.push("時間點", "項目");
            
            rnd.data.forEach(function (data, j) {
                content[j].push(data[0]);
                content[j].push(btnAllNames[parseInt(data[1])]);
            });
        }
    });
    
    // 組合工作表資料
    wsData.push(head_line_1);
    wsData.push(head_line_2);
    content.forEach(function(row) {
        wsData.push(row);
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

// ===== 下載 ITC 資料 XLSX 檔案 =====
function getXlsxdata() {
    if (masterRunning) {
        if (!confirm('Are you sure? Stop timer and create data.')) return;
        ticker.stop();
        masterRunning = false;
        stopAll();
        rstStpBtn.innerHTML = "Reset";
    }
    
    var wsData = prepareITCData();
    if (!wsData) {
        alert('There is no data!');
        return;
    }
    
    var wb = createWorkbook(wsData, "ITC_Data");
    var baseFilename = "ITC_" + document.getElementById("filename").value;
    var safeFilename = sanitizeFileName(baseFilename) + "_records.xlsx";
    XLSX.writeFile(wb, safeFilename);
}

// ===== 下載 ZIP 壓縮檔（包含所有檔案）=====
function downloadZipFile() {
    var zip = new JSZip();
    var userFilename = document.getElementById("filename").value;
    var baseFilename = sanitizeFileName("ITC_" + userFilename);
    
    // 統計表 HTML
    var divTB = document.getElementById("divTable");
    if (divTB.innerHTML.length == 0) {
        createTable();
    }
    var text = document.getElementById("divTable").outerHTML;
    text = "<!DOCTYPE html><html xml:lang=\"en\" lang=\"en\"><head><meta http-equiv=\"content-type\" content=\"text/html;charset=utf-8\" /><meta name=\"viewport\" content=\"width=device-width\"><meta name=\"generator\" content=\"Geany 1.32\" /><!-- Bootstrap CSS --><link href=\"./vendor/cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css\" rel=\"stylesheet\"integrity=\"sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU\" crossorigin=\"anonymous\"></head><body>" + text + "</body></html>";
    zip.file(baseFilename + "_statistics_table.html", text);
    
    // Timeline 圖片
    if (!document.getElementById("canvas")) {
        createTimeline();
    }
    var img = document.getElementById("canvas").toDataURL("image/png");
    img = img.split('base64,')[1];
    zip.file(baseFilename + "_barChart.png", img, { base64: true, createFolders: false });
    
    // PieChart 圖片
    if (!document.getElementById("pieChartCanvas")) {
        createPieChart();
    }
    var img2 = document.getElementById("pieChartCanvas").toDataURL("image/png");
    img2 = img2.split('base64,')[1];
    zip.file(baseFilename + "_pieChart.png", img2, { base64: true, createFolders: false });
    
    // ITC 資料 XLSX 檔案
    var wsData = prepareITCData();
    if (wsData) {
        var wb = createWorkbook(wsData, "ITC_Data");
        var xlsxData = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
        zip.file(baseFilename + '_records.xlsx', xlsxData, { createFolders: false });
    }
    
    // 產生並下載 ZIP 檔案
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            saveAs(content, sanitizeFileName(userFilename) + "_all_files.zip");
        });
}

// download() 函數可以刪除，不再需要