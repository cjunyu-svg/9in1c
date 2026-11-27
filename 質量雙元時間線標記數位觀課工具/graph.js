// Timeline: width 75*60=4500/6=750 eli skaalaa kaikki kuudella tai ainakin len

var timelineColors = ["#D65F5B", "#F0A500", "#F6E58D", "#A8D8B9", "#3EB489", "#8BC34A", "#A2DFF7", "#6BB3F0", "#3F51B5", "#5C6BC0", "#A76B9A", "#9C27B0", "#E91E63"];

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

function createTimeline() {
    if (masterRunning) {
        if (!confirm('Are you sure? Stop timer and create timeline.')) return;
        ticker.stop();
        document.getElementById("bM").style.background = "#0d6efd";
        document.getElementById("bM").innerHTML = "Start";
        masterRunning = false;
        stopAll();
    }
    else if (document.getElementById("canvas") != null) { if (!confirm('Create new timeline?')) return; }
    else if (ticks == 0) { alert('There is no data!'); return; }

    clearTimeline();

    var numOfButtons = document.getElementById("divButtons").childElementCount; // get the number of buttons

    var labels = [];
    for (var ii = 0; ii < numOfButtons; ii++) {
        labels.push(document.getElementById("b" + ii).textContent);
    }

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.id = "canvas";
    document.getElementById("divTimeline").appendChild(canvas);
    // Draw grid, 20px for 1 minute, --> plotWidth + labels and totals
    // canvas width


    var textLength = 0;
    for (var ii = 0; ii < numOfButtons; ii++) {
        var txt = document.getElementById("b" + ii).textContent;
        if (ctx.measureText(txt).width > textLength) {
            textLength = ctx.measureText(txt).width;
        }
    }
    if (ctx.measureText("文字記錄").width > textLength) {
        textLength = ctx.measureText("文字記錄").width;
    }

    var plotWidth; // this from lenght of time
    plotWidth = Math.ceil(ticks / 60) * 20; //20 pixel per min(60sec)
    var canvasWidth = plotWidth + textLength * 2 + 100;	// add room for totals and then some
    canvas.width = canvasWidth;

    // canvas height
    var topMargin = 50;
    var plotHeight = 80 * (numOfButtons + 1);
    var canvasHeight = plotHeight + 2 * topMargin;	// add margin and space for ticks
    canvas.height = canvasHeight;

    var plotStart = textLength + 50; // where the plot starts (x), labels to the left

    // postion for labels
    var height = 50; // height of the horizontal bars
    var pos = [];
    for (var pp = 0; pp <= numOfButtons; pp++) {
        //var step = 20;
        pos.push(pp * plotHeight / (numOfButtons + 1) + height * 0.5 + topMargin);
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
    for (var ii = 0; ii < numOfButtons; ii++) {
        var txt = document.getElementById("b" + ii).textContent;
        ctx.font = '12px sans-serif';
        ctx.fillText(txt, plotStart - (ctx.measureText(txt).width + 10), pos[ii] + height / 2 + 5);
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        // Draw a tick mark 12px long (-6 to 6)
        ctx.moveTo(plotStart - 6, pos[ii] + height / 2);
        ctx.lineTo(plotStart + 6, pos[ii] + height / 2);
        ctx.stroke();
    }

    ctx.fillText("文字記錄", plotStart - (ctx.measureText("文字記錄").width + 10), pos[numOfButtons] + height / 2 + 5);
    ctx.beginPath();/* 
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000"; */
    // Draw a tick mark 12px long (-6 to 6)
    ctx.moveTo(plotStart - 6, pos[numOfButtons] + height / 2);
    ctx.lineTo(plotStart + 6, pos[numOfButtons] + height / 2);
    ctx.stroke();

    // axes labels
    ctx.font = '12px sans-serif';
    ctx.fillText('Items Name', textLength, topMargin - 10);
    ctx.font = '12px sans-serif';
    ctx.fillText('Mins', plotStart + plotWidth, plotHeight + topMargin + 25);


    // X-ticks and labels
    ctx.font = '12px sans-serif';
    ctx.fillText(startTime, plotStart - 15, plotHeight + topMargin + 25);
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
    //draw logo 
    //logo:https://drive.google.com/file/d/1UIrZLRstP3Tq708Uf50uX1YAlOCN9QdW/view?usp=share_link
    var imgObject;
    imgObject = document.getElementById("logo");
    //imgObject.src = "";//‪original wxh: 454 x 164‬
    //imgObject.crossOrigin = 'anonymous';
    ctx.drawImage(imgObject, canvasWidth - 50, 5, 50, 18);


    // Clear canvas!
    //canvas.style.visibility = "visible";
    var totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var start, stop, len;
    for (var ii = 0; ii < numOfButtons; ii++) {
        for (var jj = 1; jj < data[ii * 2].length; jj++) {
            start = data[ii * 2][jj];
            stop = data[ii * 2 + 1][jj];
            len = stop - start;
            totals[ii] += len;
            ctx.fillStyle = timelineColors[ii];
            ctx.fillRect(plotStart + start / 3, pos[ii], len / 3, height); // /3 to scale 20px for 1 minute
        }
        ctx.fillStyle = "Black"
        ctx.font = '12px sans-serif';
        ctx.fillText(sec2time(totals[ii]), plotStart + plotWidth + 20, pos[ii] + height / 2 + 2.5);
    }
    //Text record dots
    for (var i = 0; i < textData.length; i++) {
        ctx.fillStyle = timelineColors[timelineColors.length - 1];
        ctx.beginPath();
        ctx.arc(plotStart + Math.ceil(textData[i][0] * 20 / 60), pos[pos.length - 1] + height / 2, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    // make clickable
    canvas.addEventListener('click', function () {
        //var canvasDataUrl = canvas.toDataURL("image/png");

        window.open().document.write('<img style="max-width: 100%;" src="' + canvas.toDataURL() + '" />');

        //window.open(canvasDataUrl, '_blank');
    }, false);

    // autoscroll to the bottom of the page to show the timeline
    window.scrollTo(0, document.body.scrollHeight);
}

function saveTimeline() {
    // check if canvas exists and if not create it
    if (!document.getElementById("canvas")) {
        createTimeline();
    }

    var link = document.createElement("a");
    link.setAttribute('download', "DTC_" + document.getElementById("filename").value.replace(/([^0-9A-z\u4e00-\u9fa5]|[\^_])/g, '_') + "_timeline.png");
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
}