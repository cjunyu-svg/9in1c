var UTC_PRESETS_KEY = "dtcButtonPresetsV1";

function readPresets() {
    var raw = localStorage.getItem(UTC_PRESETS_KEY);
    var items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) throw new Error("設定格式無法讀取");
    return items;
}

function presetMessage(message) {
    document.getElementById("presetStatus").textContent = message;
}

function refreshPresets(selectedId) {
    try {
        var presets = readPresets();
        var select = document.getElementById("presetSelect");
        select.replaceChildren(new Option("請選擇設定", ""));
        presets.forEach(function (preset) {
            select.add(new Option(preset.name, preset.id));
        });
        if (selectedId) select.value = selectedId;
    } catch (error) {
        presetMessage("無法讀取儲存的設定：" + error.message);
    }
}

function currentButtonNames() {
    var inputs = document.querySelectorAll("#divButtons input");
    if (inputs.length) return Array.from(inputs).map(function (input, index) {
        return input.value.trim() || String(index + 1);
    });
    return Array.from(document.querySelectorAll("#divButtons button")).map(function (button) {
        return button.textContent;
    });
}

function savePreset() {
    try {
        var names = currentButtonNames();
        if (!names.length) return presetMessage("目前沒有可儲存的按鈕。");
        var presets = readPresets();
        var now = new Date();
        var dateName = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0");
        var sequence = presets.reduce(function (max, item) {
            return item.createdDate === dateName ? Math.max(max, Number(item.sequence) || 0) : max;
        }, -1) + 1;
        var name = sequence === 0 ? dateName : dateName + "-" + sequence;
        while (presets.some(function (item) { return item.name === name; })) {
            sequence++;
            name = dateName + "-" + sequence;
        }
        var id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
        presets.push({ id: id, name: name, buttons: names, createdDate: dateName, sequence: sequence });
        localStorage.setItem(UTC_PRESETS_KEY, JSON.stringify(presets));
        refreshPresets(id);
        presetMessage("已儲存設定：「" + name + "」。");
    } catch (error) {
        presetMessage("無法儲存設定，請確認瀏覽器允許本機儲存。");
    }
}

function selectedPreset(presets) {
    var id = document.getElementById("presetSelect").value;
    return presets.find(function (item) { return item.id === id; });
}

var presetRenameId = null;

function renamePreset() {
    try {
        var presets = readPresets();
        var preset = selectedPreset(presets);
        if (!preset) return presetMessage("請先選擇要重新命名的設定。");
        presetRenameId = preset.id;
        var input = document.getElementById("presetNewName");
        input.value = preset.name;
        document.getElementById("renameControls").hidden = false;
        presetMessage("請輸入新名稱，再按「儲存名稱」。");
        input.focus();
        input.select();
    } catch (error) {
        presetMessage("無法讀取設定，請確認瀏覽器允許本機儲存。");
    }
}

function cancelPresetRename() {
    presetRenameId = null;
    document.getElementById("renameControls").hidden = true;
    presetMessage("已取消重新命名。");
}

function confirmPresetRename() {
    try {
        var presets = readPresets();
        var preset = presets.find(function (item) { return item.id === presetRenameId; });
        if (!preset) return presetMessage("找不到這筆設定，請重新選擇。");
        var name = document.getElementById("presetNewName").value.trim();
        if (!name) return presetMessage("設定名稱不能空白。");
        if (presets.some(function (item) { return item.id !== preset.id && item.name === name; })) {
            return presetMessage("這個名稱已存在，請使用其他名稱。");
        }
        preset.name = name;
        localStorage.setItem(UTC_PRESETS_KEY, JSON.stringify(presets));
        refreshPresets(preset.id);
        presetRenameId = null;
        document.getElementById("renameControls").hidden = true;
        presetMessage("已重新命名為「" + name + "」。");
    } catch (error) {
        presetMessage("無法重新命名設定，請確認瀏覽器允許本機儲存。");
    }
}

function applyPreset() {
    try {
        var preset = selectedPreset(readPresets());
        if (!preset || !Array.isArray(preset.buttons) || !preset.buttons.length) return presetMessage("請先選擇有效的設定。");
        if (getTime || data.length || textData.length || ticks > 0) {
            if (!confirm("目前有觀課或文字記錄。套用設定會捨棄這些記錄，確定要繼續嗎？")) return;
        }
        localStorage.setItem("dtcButtonNames", JSON.stringify(preset.buttons));
        ticker.stop();
        masterRunning = false;
        getTime = false;
        clearData();
        ticks = 0;
        running = [];
        clearTimeline();
        document.getElementById("MasterTime").textContent = "00:00";
        $bm.html("Start").removeClass("disabled btn-warning btn-success").addClass("btn-primary");
        $rsmStp.html("Reset");
        $("#divOperate button").addClass("disabled");
        $("#infoDiv").removeClass("d-none");
        $("#divText").find("input, button").prop("disabled", true);
        document.getElementById("recordText").value = "";
        inptGen();
        presetMessage("已套用「" + preset.name + "」，可再修改按鈕名稱後開始。");
    } catch (error) {
        console.error(error);
        presetMessage("無法套用設定，請確認瀏覽器允許本機儲存。");
    }
}