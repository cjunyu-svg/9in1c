var ticks = 0;
var data = [];
var masterRunning = false;
var running = []; // as many as buttons
var startTime;
var timelineColors = ["#3d8bfd", "#a370f7", "#479f76", "#997404", "#3a75c4", "#e63375", "#eda075", "#00b08c", "#9258c8", "#8c0032", "#fca311", "#009e60"];
function isMobile() {
  try {
    document.createEvent("TouchEvent"); return true;
  } catch (e) {
    return false;
  }
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
  * flow control
  */
var obNum;//min2 max6
var beNum;//min2(wihle obNum 1~3) max3(whie obNum 4~6)
var obNames = [];
var beNames = [];

function obIncrease(obname) {
  var obNamingDiv = document.getElementById("obNamingDiv");
  obNum = obNamingDiv.querySelectorAll("input").length;

  if (obNum >= 6) {
    return alert("The Max number of objects is 6.");
  } else {
    var obdiv = document.createElement("div");
    var inpt = document.createElement("input");
    var lbl = document.createElement("label");

    obdiv.setAttribute("class", "form-floating mb-2")

    inpt.id = "obName" + obNum;
    inpt.type = "text";
    inpt.value = obname;
    inpt.maxLength = "20";
    inpt.setAttribute("class", "form-control");
    inpt.setAttribute("placeholder", "Object " + obNum);
    lbl.innerHTML = "Object " + (obNum + 1);
    lbl.setAttribute("for", "obName" + beNum);

    obdiv.appendChild(inpt);
    obdiv.appendChild(lbl);
    obNamingDiv.appendChild(obdiv);
  }
}
function beIncrease(bename) {

  var beNamingDiv = document.getElementById("beNamingDiv");
  beNum = beNamingDiv.querySelectorAll("input").length;

  if (beNum >= 4) {
    return alert("The max number of behaviors is 4.");
  } else {
    var bediv = document.createElement("div");
    var inpt = document.createElement("input");
    var lbl = document.createElement("label");

    bediv.setAttribute("class", "form-floating mb-2")

    inpt.id = "beName" + beNum;
    inpt.type = "text";
    inpt.value = bename;
    inpt.maxLength = "20";
    inpt.setAttribute("class", "form-control");
    inpt.setAttribute("placeholder", "Object " + beNum);
    lbl.innerHTML = "Behavior " + (beNum + 1);
    lbl.setAttribute("for", "beName" + beNum);

    bediv.appendChild(inpt);
    bediv.appendChild(lbl);
    beNamingDiv.appendChild(bediv);
  }
}
function obReduse() {
  var obNamingDiv = document.getElementById("obNamingDiv");
  obNum = obNamingDiv.querySelectorAll("input").length;
  var beNamingDiv = document.getElementById("beNamingDiv");
  beNum = beNamingDiv.querySelectorAll("input").length;

  if (obNum <= 2) {
    return alert("Min number of behaviors is 2");
  } else {
    obNamingDiv.removeChild(obNamingDiv.lastChild);
  }

}
function beReduse() {
  var obNamingDiv = document.getElementById("obNamingDiv");
  obNum = obNamingDiv.querySelectorAll("input").length;
  var beNamingDiv = document.getElementById("beNamingDiv");
  beNum = beNamingDiv.querySelectorAll("input").length;

  if (beNum <= 2) {
    return alert("Min number of behaviors is 2");
  } else {
    beNamingDiv.removeChild(beNamingDiv.lastChild);
  }

}

function inptGen() {
  clearInptDiv();
  if (typeof (Storage) !== "undefined") {
    if (localStorage.obInptNames && localStorage.beInptNames) {
      var ob = JSON.parse(localStorage.obInptNames);
      for (var i = 0; i < ob.length; i++) {
        obIncrease(ob[i]);
      }
      var be = JSON.parse(localStorage.beInptNames);
      for (var i = 0; i < be.length; i++) {
        beIncrease(be[i]);
      }
    }
    else {
      for (i = 0; i < 2; i++) {
        obIncrease('');
        beIncrease('');
      }
    }
  } else {
    console.log("Sorry, your browser does not support web storage...");
  }
}

function clearInptDiv() {
  var obNamingDiv = document.getElementById("obNamingDiv");
  var beNamingDiv = document.getElementById("beNamingDiv");
  while (obNamingDiv.firstChild) {
    obNamingDiv.removeChild(obNamingDiv.lastChild);
  }
  while (beNamingDiv.firstChild) {
    beNamingDiv.removeChild(beNamingDiv.lastChild);
  }
}
/*
* start stop flow
*/

function masterStartStop() {
  if (masterRunning == false) {
    obNames = [];
    beNames = [];
    var obNamingDiv = document.getElementById("obNamingDiv");
    var beNamingDiv = document.getElementById("beNamingDiv");
    var workDiv = document.getElementById("workDiv");

    //check all name are not empty
    var emptyExist = false;
    obNamingDiv.querySelectorAll("input").forEach(function (obName) {
      if (obName.value.trim() == "") {
        emptyExist = true;
      } else {
        obNames.push(obName.value);
      }
    });
    beNamingDiv.querySelectorAll("input").forEach(function (beName) {
      if (beName.value == "") {
        emptyExist = true;
      } else {
        beNames.push(beName.value);
      }
    });
    if (emptyExist) {
      alert("The name can not be empty.");
      return;
    } else {
      localStorage.obInptNames = JSON.stringify(obNames);
      localStorage.beInptNames = JSON.stringify(beNames);
    }

    startTime = new Date();

    //change masterbtn state
    var msbtn = document.getElementById("bM");
    msbtn.innerHTML = "Stop";
    msbtn.style.color = "white";
    msbtn.setAttribute("class", "btn btn-lg btn-warning fs-2 px-4");

    //hide setting div
    document.getElementById("setting").classList.add("d-none");

    //clean workDiv
    /* while (workDiv.firstChild) {
      workDiv.removeChild(workDiv.lastChild);
    } */

    //generate work element: label, button, ...etc
    data = new Array(obNames.length);
    for (i = 0; i < data.length; i++) {
      data[i] = new Array();
    }
    var btnClass = ['btn-outline-primary', 'btn-outline-success', 'btn-outline-info', 'btn-outline-warning'];

    var touchSupport = !("ontouchstart" in document.documentElement);

    obNames.forEach(function (obname, i) {
      //div
      var obdiv = document.createElement("div");
      var lbldiv = document.createElement("div");
      var btndiv = document.createElement("div");
      obdiv.setAttribute("class", "d-flex justify-content-center align-items-center");
      lbldiv.setAttribute("class", "d-flex justify-content-center col-lg-4 col-md-5 col-4 text-break");
      btndiv.setAttribute("class", "d-flex justify-content-evenly flex-wrap");

      //label for obName
      var oblabel = document.createElement("label");
      oblabel.setAttribute("class", "p-2 col-form-label fs-5 fw-bold text-break");
      oblabel.innerHTML = obname;
      document.getElementById("pc_" + i).innerHTML = obname;
      $("#pc_" + i).removeClass("d-none");

      lbldiv.appendChild(oblabel);

      //radio input and label(btn)
      beNames.forEach(function (bename, j) {
        var btn = document.createElement("label");
        var inpt = document.createElement("input");
        inpt.id = i + "-" + j;
        inpt.type = "radio";
        inpt.name = i;
        inpt.setAttribute("class", "btn-check");
        inpt.setAttribute("autocomplete", "off");
        btn.setAttribute("onclick", "timeStamp(" + i + "," + j + ")");
        btn.setAttribute("class", "btn my-2 mx-1 fs-5 fw-bold " + (touchSupport ? "myhover" : ""));// + btnClass[j]);
        //btn.style.backgroundColor = timelineColors[j];
        //btn.style.color = "white";
        btn.setAttribute("for", inpt.id);
        btn.innerHTML = bename;

        btndiv.appendChild(inpt);
        btndiv.appendChild(btn);
      });
      obdiv.appendChild(lbldiv);
      obdiv.appendChild(btndiv);
      workDiv.appendChild(obdiv);
    });
    ticker.start();
    masterRunning = true;
    $('#workDiv label').click(function (e) {
      e.preventDefault();
      var radio = $(this).prev();
      if (radio.is(':checked')) {
        radio.prop('checked', false);
      } else {
        radio.prop('checked', true);
      }
    });

  } else {
    stopAll();
    $("#showresult").removeClass("disabled");
    $("#download").removeClass("disabled");
  }
}

function stopAll() {
  ticker.stop();
  masterRunning = false;
  data.forEach(function (ob) {
    if (ob.length % 2 == 1) {
      ob.push(["", ticks]);
    }
  });

  $("#workDiv label").addClass("disabled");
  $("#bM").addClass("disabled btn-secondary");
  $("#bM").removeClass("btn-warning");
  $("#bM").html("Finish");
}
function resetAll() {
  document.querySelector("#MasterTime").innerHTML = "00:00";
  data = [];
  ticks = 0;
  masterRunning = false;
  showResult = false;
  createResult = false;

  var workDiv = document.getElementById("workDiv");
  var timelineDiv = document.getElementById("divtimeline");
  /* var freqDiv = document.getElementById("divFreqBarChart"); */
  var piechartDiv = document.getElementById("divPieChart");

  $("#showresult").removeClass("disabled");
  $("#download").removeClass("disabled");

  for (var i = 0; i < obNames.length; i++) {
    if ($("#pc_" + i).hasClass("active")) {
      $("#pc_" + i).removeClass("active");
    }
  }
  if (!$("#divtimeline").hasClass("active")) {
    $("#timeline").removeClass("active");
  }
  timelineDiv.className = "d-flex justify-content-center mb-5 d-none"

  inptGen();

  while (workDiv.firstChild) {
    workDiv.removeChild(workDiv.lastChild);
  }
  while (timelineDiv.firstChild) {
    timelineDiv.removeChild(timelineDiv.lastChild);
  }
  /* while (freqDiv.firstChild) {
    freqDiv.removeChild(freqDiv.lastChild);
  } */
  while (piechartDiv.firstChild) {
    piechartDiv.removeChild(piechartDiv.lastChild);
  }

  $("#workDiv label").removeClass("disabled");
  document.getElementById("bM").setAttribute("class", "btn btn-primary btn-lg px-4 fs-2");
  document.getElementById("showresult").setAttribute("class", "btn btn-secondary m-1 fs-4 dropdown-toggle disabled");
  document.getElementById("download").setAttribute("class", "btn btn-secondary m-1 fs-4 dropdown-toggle disabled");
  $("#bM").html("Start");
  $("#setting").removeClass("d-none");
}

function resetStop() {
  ticker.stop();
  resetAll();
}
/*
* button action
*/
function timeStamp(ob, be) {
  var item = document.getElementById(ob + "-" + be);
  if (item.checked) {
    /* setTimeout(function () {
      item.checked = false;
    }, 100); */
    data[ob].push([be, ticks]);
  } else if (data[ob].length % 2 != 0) {
    data[ob].push(["", ticks]);
    data[ob].push([be, ticks]);
  } else {
    data[ob].push([be, ticks]);
  }
}

/*
* timer
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
    //stopAll();
  }

  this.clear = function () {
    if (!confirm('Are you sure? Clear data and reset timer.')) return;
    ticker.stop();
    document.getElementById("bM").style.background = "#009bff";
    document.getElementById("bM").innerHTML = "Start";
    masterRunning = false;
    //stopAll();
    ticks = 0;
    document.getElementById("MasterTime").innerHTML = "0:00";
    clearData();
    clearTimeline();
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
var doWork = function () {
  console.log(++ticks); // time goes up
  var minutes = Math.floor(ticks / 60);
  if (minutes.toString().length < 2) { minutes = '0' + minutes.toString() }
  var seconds = ticks - (60 * minutes);
  if (seconds.toString().length < 2) { seconds = '0' + seconds.toString() }
  document.getElementById("MasterTime").innerHTML = minutes + ':' + seconds;
};

// Define what to do if something goes wrong
var doError = function () {
  console.warn('The drift exceeded the interval.');
};

var ticker = new AdjustingInterval(doWork, 1000, doError);

function secToTimeString(secs) {
  var minutes = Math.floor(secs / 60);
  if (minutes.toString().length < 2) { minutes = '0' + minutes.toString() }
  var seconds = secs - (60 * minutes);
  if (seconds.toString().length < 2) { seconds = '0' + seconds.toString() }
  return minutes + ':' + seconds;
}

window.addEventListener("online", function (event) {
  event.stopPropagation();
  console.log("網路已重新連線，但不會自動刷新頁面");
});