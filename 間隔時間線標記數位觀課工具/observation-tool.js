const obsPreferences = ObservationRecovery.preferences("ITC");


/* 
*	initialize
*/

//data
var data = [];
var defaultValue = "No record";
var allItemSum = [];

//flow control
var masterRunning = false;
var pausing = false;
var stepStop = false;

//setting
var strstpBtn = document.getElementById("bM");
var btninptDiv = document.getElementById("divButtons");
var btnNames = ["Initiative in task", "Passive in task", "Help", "Unable to judge", "Off-task", "Disruptive behavior"];
var rstStpBtn = document.getElementById("resetStop");
var constOBnum;
var constPeriod;
var constItemNum;

//for info show
var masterTimeInfoEle = document.getElementById("MasterTime");;
var objectInfoEle;
var roundInfoEle = document.getElementById("roundNum");//for showing the round which is going

//variable for cycle event
var timer;
var countStep;
var objectCounter = 0;
var roundCounter = 0;
var ticker;

//div visiable control
var runningInfoDiv = document.getElementById("runningInfo");
var settingDiv = document.getElementById("parameterSetting");

clearData();

function isMobile() {
    try {
        document.createEvent("TouchEvent"); 
		return true;
    } catch (e) {
        return false;
    }
}
/* 
 *	flow control 
 */

//Start button event
function masterStartStop() {
	//var elem = document.getElementById("bM");//start/pause button
	if (masterRunning == false) {
		//get the quantity of Objects
		constOBnum = parseInt(document.getElementById("OBnum").value);

		//check OBnum values is valid
		if (!Number.isSafeInteger(constOBnum) || constOBnum < 1) {
			alert("please enter the number of Objects");
			return;
		}

		//get setting value
		constPeriod = parseInt(document.getElementById("OBperiod").value);
		constItemNum = document.querySelectorAll("#divButtons input").length + 1;
		console.log("constItemNum 62:" + constItemNum);
		objectInfoEle = document.getElementById("OBobject");//for showing the object which is going

		objectInfoEle.innerHTML = "Object: 1/" + constOBnum;

		allItemSum.length = 0;
		for (var i = 0; i < constItemNum; i++) {
			allItemSum.push(0);
		}

		//decide the action by observation period value
		if (constPeriod == 0) {//manual control
			ticker = new AdjustingInterval(timerInfoUpdate, 1000, doError);
			countStep = 1;
			timer = 0;
			$("#manualBtn").removeClass("d-none");
		} else {//auto control
			ticker = new AdjustingInterval(periodRecord, 1000, doError);
			countStep = -1;
			timer = constPeriod;
			masterTimeInfoEle.innerHTML = secToMmSs(constPeriod);
		}

		//div area display control
		$("#parameterSetting").addClass("d-none");
		$("#runningInfo").removeClass("d-none");

		//flow control
		rstStpBtn.innerHTML = "Stop";

		strstpBtn.classList.remove("btn-primary");
		strstpBtn.classList.add("btn-warning");
		strstpBtn.innerHTML = "Pause";
		masterRunning = true;
		pausing = false;

		saveButtons();
		createButtons();

		data.push(new RoundRecord());//first round data
		ticker.start();

	} else {//pause event
		if (constPeriod == 0) {//manual control
			if (pausing) {
				ticker.start();
				strstpBtn.classList.remove("btn-info");
				strstpBtn.classList.add("btn-warning");
				strstpBtn.innerHTML = "Pause";
				pausing = false;

				$("#divButtons label").removeClass("disabled");
				$("#manualBtn button").removeClass("disabled");
			} else {
				ticker.pause();
				strstpBtn.classList.remove("btn-warning");
				strstpBtn.classList.add("btn-info");
				strstpBtn.innerHTML = "Resume";
				pausing = true;

				$("#divButtons label").addClass("disabled");
				$("#manualBtn button").addClass("disabled");
			}
		} else {//auto control
			if (pausing) {
				strstpBtn.classList.remove("btn-info");
				strstpBtn.classList.add("btn-warning");
				strstpBtn.innerHTML = "Pause";
				ticker.start();
				pausing = false; //button switch
				$("#divButtons label").removeClass("disabled");
			} else {
				strstpBtn.classList.remove("btn-warning");
				strstpBtn.classList.add("btn-info");
				strstpBtn.innerHTML = "Resume";
				$("#bM").addClass("disabled");
				pausing = true;//button switch
			}
		}
	}
}

//reset/stop button
function resetStop() {
	if (masterRunning) {//stop
		ticker.stop();
		masterRunning = false;
		stopAll();
		rstStpBtn.innerHTML = "Reset";
		$("#divGetDate button").removeClass("disabled");

	} else if (rstStpBtn.innerHTML == "Reset") {//reset
		if (!data.length || confirm("清除目前的觀課記錄？")) resetAll();
	}

}
/* 
 *	cycle events setting
 */
//Record the item of observated object
function itcRecord() {
	data[roundCounter].record();
	document.getElementById("b0").checked = true;
	objectCounter++;

	if (data[roundCounter].isFull()) {
		roundCounter++;
		data.push(new RoundRecord());
		objectCounter = 0;
		roundInfoEle.innerHTML = "Rounds: " + (roundCounter + 1);
		if (pausing) {
			stepStop = true;
		}
	}
	objectInfoEle.innerHTML = "Object: " + (objectCounter + 1) + "/" + constOBnum;
}

function periodRecord() {
	timerInfoUpdate();
	if (timer == constPeriod) {
		itcRecord();
		if (constPeriod != 3) {
			if (masterTimeInfoEle.classList.contains("blink-alert")) {
				masterTimeInfoEle.classList.remove("blink-alert");
			}
		}
	} else if (timer == 3) {
		if (!masterTimeInfoEle.classList.contains("blink-alert")) {
			masterTimeInfoEle.classList.add("blink-alert");
		}
	}
}

function timerInfoUpdate() {
	timer += countStep;
	if (timer <= 0) timer = constPeriod;
	masterTimeInfoEle.innerHTML = secToMmSs(timer);
};

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

	this.pause = function () {
		clearTimeout(timeout);
	}

	this.stop = function () {
		clearTimeout(timeout);
		stopAll();
	}

	this.clear = function () {
		if (!confirm('Are you sure? Clear data and reset timer.')) return;
		this.stop();
		//document.getElementById("bM").style.background = "#009bff";
		//document.getElementById("bM").innerHTML = "Start";
		//masterRunning = false;
		stopAll();
		document.getElementById("MasterTime").innerHTML = "00:00";
		clearData();
		//clearTimeline();
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

		if (stepStop) {
			clearTimeout(timeout);
			$("#divButtons label").addClass("disabled");
			$("#bM").removeClass("disabled");
			stepStop = false;
		}
	}
}

// Define the work to be done

// Define what to do if something goes wrong
function doError() {
	console.warn('The drift exceeded the interval.');
};

function stopAll() {
	$("#divButtons label").addClass("disabled");
	$("#bM").addClass("disabled");
	$("#manualBtn button").addClass("disabled");

	/* document.querySelectorAll("#divButtons button").forEach(btn => btn.disabled = true);
	strstpBtn.disabled = true;
	document.querySelector("#manualBtn button").disabled = true; */
}

function resetAll() {
	//button reset
	$("#bM").attr("class", "btn btn-primary btn-lg px-4 fs-2");
	strstpBtn.innerHTML = "Start";

	rstStpBtn.innerHTML = "Reset";

	//div display
	$("#parameterSetting").attr("class", "d-flex flex-wrap justify-content-center mb-3");
	$("#runningInfo").attr("class", "d-flex justify-content-center d-none");
	$("#manualBtn").attr("class", "d-flex justify-content-center d-none");
	$("#manualBtn button").removeClass("disabled");
	$("#divGetDate button").attr("class", "btn btn-secondary fs-4 m-1 disabled");
	$("#download").attr("class", "btn btn-secondary m-1 fs-4 dropdown-toggle disabled");


	//div clear
	var timelineDiv = document.getElementById("divTimeline");
	while (timelineDiv.firstChild) {
		timelineDiv.removeChild(timelineDiv.lastChild);
	}
	var timelineDiv = document.getElementById("divTable");
	while (timelineDiv.firstChild) {
		timelineDiv.removeChild(timelineDiv.lastChild);
	}
	var timelineDiv = document.getElementById("divPieChart");
	while (timelineDiv.firstChild) {
		timelineDiv.removeChild(timelineDiv.lastChild);
	}

	//flow control
	masterRunning = false;
	pausing = false;
	stepStop = false;

	//data 
	btnNames = ["Initiative in task", "Passive in task", "Help", "Unable to judge", "Off-task", "Disruptive behavior"];
	data.length = 0;
	masterTimeInfoEle.innerHTML = '00:00';
	if (masterTimeInfoEle.classList.contains("blink-alert")) {
		masterTimeInfoEle.classList.remove("blink-alert");
	}
	roundInfoEle.innerHTML = "Rounds: 1";
	inptGen();
	roundCounter = 0;
	objectCounter = 0;
	filename = new Date().toLocaleDateString();
	document.getElementById("filename").value = filename;
}
/* 
 *	main button operation
 */

// Add button
function addButton(name) {
	btnNum = document.querySelectorAll("input[name=item]").length;
	var inpt = document.createElement("input");
	var lbl = document.createElement("label");

	var id = "b" + btnNum;

	inpt.type = "radio";
	inpt.className = "btn-check";
	inpt.name = "item";
	inpt.id = id;
	inpt.value = btnNum;
	inpt.autocomplete = "off";

	//btn.setAttribute("onclick", functionName);
	lbl.className = "btn btn-lg fs-3 py-lg-4 py-md-3 py-2 btn-outline-primary col-10 col-sm-10 col-md-5" + (isMobile() ? " mobile-device" : "");;
	lbl.setAttribute("for", id);
	//btn.type = "button";

	if (name == undefined) {
		lbl.innerHTML = btnNum;
		btninptDiv.appendChild(inpt);
		btninptDiv.appendChild(lbl);
		saveButtons();
	}
	else {
		lbl.textContent = name;
		btninptDiv.appendChild(inpt);
		btninptDiv.appendChild(lbl);
	}
}

// Remove input
function removeInput() {
	buttons = document.getElementById("divButtons")
	var numOfButtons = buttons.childElementCount;
	if (numOfButtons > 1) {
		buttons.removeChild(buttons.lastChild);
	}
	else { alert("Timer has to have atleast one buttons!"); }
}

//save button names to local storage
function saveButtons() {
	//btnNames.push("defaultValue");
	btnNames = [];
	document.querySelectorAll("#divButtons input").forEach(ipt => btnNames.push(ipt.value.trim() || String(btnNames.length + 1)));
	obsPreferences.buttonNames = JSON.stringify(btnNames);
}

//clear button div area in document 
function clearButtonDiv() {
	btninptDiv = document.getElementById("divButtons");
	while (btninptDiv.firstChild) {
		btninptDiv.removeChild(btninptDiv.lastChild);
	}
}

function inptGen() {
	clearButtonDiv(); // clear current buttons before creating new buttons
	if (typeof (Storage) !== "undefined") {
		if (obsPreferences.buttonNames) {
			var storedNames = JSON.parse(obsPreferences.buttonNames);
			for (var i = 0; i < storedNames.length; i++) {
				addInput(storedNames[i]);
			}
		} else {
			for (var i = 0; i < 6; i++) {
				addInput(btnNames[i]);
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
		//running.push(false);
	} else {
		alert("There are 12 buttons at most.");
	}
}

//buttons generation on doc load
function createButtons() {
	clearButtonDiv(); // clear current buttons before creating new buttons
	var defaultInput = document.createElement("input");
	defaultInput.type = "radio";
	defaultInput.className = "btn-check";
	defaultInput.name = "item";
	defaultInput.id = "b0";
	defaultInput.value = "0";
	defaultInput.setAttribute("autocomplete", "off");
	defaultInput.checked = true;
	btninptDiv.appendChild(defaultInput);

	if (typeof (Storage) != "undefined") {
		if (obsPreferences.buttonNames) {
			var storedNames = JSON.parse(obsPreferences.buttonNames);
			for (var ii = 0; ii < storedNames.length; ii++) {
				addButton(storedNames[ii]);
			}
		} else {
			for (var ii = 0; ii < 6; ii++) {
				addButton(btnNames[ii]);
			}
		}
	} else {
		console.log("Sorry, your browser does not support web storage...");
	}
}

/* 
 *	data processing
 */
function clearData() {
	data.length = 0;
}

//seconds to stander time formate mm:ss
function secToMmSs(sec) {
	var m = Math.floor(sec / 60);
	var s = sec - (60 * m);
	return (m >= 10 ? m.toString() : "0" + m.toString()) + ":" + (s >= 10 ? s.toString() : "0" + s.toString());
}

// Saving data as csv-file, default filename is current date 
var filename = new Date().toLocaleDateString();
document.getElementById("filename").value = filename;

function delLocal() {
	obsPreferences.clear();
}

//get now time String in hh:mm:ss
function getTimeString() {
	var time = new Date();
	var h = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
	var m = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
	var s = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
	return h + ":" + m + ":" + s;

}

/* 
 *	info window control
 */

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

/* 
 *	other functions 
 */
//manual btn control
function manualBtn() {
	itcRecord();
	masterTimeInfoEle.innerHTML = '00:00';
	timer = 0;
	ticker.pause();
	ticker.start();
}


function RoundRecord() {
	this.data = [];
	this.itemSum = [];
	this.maxClick = 0;
	for (var i = 0; i < constItemNum; i++) {
		this.itemSum.push(0);
	}

	this.clean = function () {
		this.data.length = 0;
		this.itemSum.length = 0;
		for (var i = 0; i < constItemNum; i++) {
			this.itemSum.push(0);
		}
	}
	this.record = function () {
		if (this.isFull()) {
			console.log("this round is full");
			return;
		}
		var targetItem = document.querySelector('input[name="item"]:checked');
		var tmpdata = [getTimeString(), targetItem.value];
		this.data.push(tmpdata);
		if (this.maxClick < ++this.itemSum[parseInt(targetItem.value)]) {
			this.maxClick = this.itemSum[parseInt(targetItem.value)];
		}
		allItemSum[parseInt(targetItem.value)]++;
	}
	this.isFull = function () {
		return this.data.length == constOBnum;
	}
	this.isEmpty = function () {
		return this.data.length == 0;
	}
}

window.addEventListener("online", function (event) {
    event.stopPropagation();
    console.log("網路已重新連線，但不會自動刷新頁面");
});


document.addEventListener("DOMContentLoaded", () => {
    const {el, values, str, num, obj, list} = ObservationRecovery;
    function config() {
        return {names: masterRunning || data.length ? btnNames : values("#divButtons input"),
            objects: Number(el("OBnum").value), period: Number(el("OBperiod").value)};
    }
    el('filename').addEventListener('input', () => { filename = el('filename').value; });
    ObservationRecovery.install("ITC", {
        config,
        validConfig: c => obj(c) && list(c.names, str, 1, 12) && num(c.objects) && c.objects > 0 &&
            [0, 3, 5, 10, 15, 20, 30].includes(c.period),
        apply(c) {
            el("OBnum").value = c.objects;
            el("OBperiod").value = c.period;
            obsPreferences.buttonNames = JSON.stringify(c.names);
            inptGen();
        },
        capture: () => masterRunning || data.length ? {phase: masterRunning ? "active" : "stopped",
            data: {rounds: data, allItemSum, timer, objectCounter, roundCounter,
                selected: Number(document.querySelector('#divButtons input:checked')?.value || 0)}} : null,
        validState: (s, c) => obj(s) && num(s.timer) && num(s.objectCounter) && s.objectCounter < c.objects &&
            num(s.roundCounter) && num(s.selected) && s.selected <= c.names.length &&
            list(s.allItemSum, num, c.names.length + 1, c.names.length + 1) &&
            list(s.rounds, round => obj(round) && num(round.maxClick) &&
                list(round.itemSum, num, c.names.length + 1, c.names.length + 1) &&
                list(round.data, item => Array.isArray(item) && item.length === 2 &&
                    str(item[0]) && /^\d{1,}:\d{2}(:\d{2})?$/.test(item[0]) &&
                    /^[0-9]+$/.test(String(item[1])) && Number(item[1]) <= c.names.length, 0, c.objects), s.roundCounter + 1, s.roundCounter + 1),
        reset() { if (ticker) ticker.pause(); resetAll(); },
        restore(s, phase) {
            masterStartStop();
            ticker.pause();
            data = s.rounds.map(round => Object.assign(new RoundRecord(), round));
            ({allItemSum, timer, objectCounter, roundCounter} = s);
            const radio = el("b" + s.selected);
            if (radio) radio.checked = true;
            masterTimeInfoEle.textContent = secToMmSs(timer);
            objectInfoEle.textContent = "Object: " + (objectCounter + 1) + "/" + constOBnum;
            roundInfoEle.textContent = "Rounds: " + (roundCounter + 1);
            if (phase === "stopped") resetStop();
        },
        resume() { pausing = false; stepStop = false; ticker.start(); }
    });
});
