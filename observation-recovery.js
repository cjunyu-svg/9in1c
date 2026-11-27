
const ObservationRecovery = (() => {
    const el = id => document.getElementById(id);
    const all = selector => Array.from(document.querySelectorAll(selector));
    const values = selector => all(selector).map(field => field.value);
    const copy = value => JSON.parse(JSON.stringify(value));
    const str = value => typeof value === "string";
    const num = value => Number.isSafeInteger(value) && value >= 0;
    const bool = value => typeof value === "boolean";
    const obj = value => value !== null && typeof value === "object" && !Array.isArray(value);
    const list = (value, check, min = 0, max = Infinity) => Array.isArray(value) &&
        value.length >= min && value.length <= max && value.every(check);
    const clock = seconds => [Math.floor(seconds / 60), seconds % 60].map(n => String(n).padStart(2, "0")).join(":");
    const escape = value => String(value).replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);

    function get(key) {
        try { return window.localStorage.getItem(key); }
        catch (error) { return null; }
    }

    function preferences(tool) {
        const memory = Object.create(null);
        const prefix = "observation." + tool + ".preference.";
        return new Proxy(memory, {
            get(target, key) {
                if (key === "removeItem") return name => {
                    memory[name] = undefined;
                    try { window.localStorage.setItem(prefix + name, ""); } catch (error) {}
                };
                if (Object.hasOwn(target, key)) return target[key];
                return (get(prefix + key) ?? get(key)) || undefined;
            },
            set(target, key, value) {
                target[key] = value;
                try { window.localStorage.setItem(prefix + key, value); } catch (error) {}
                return true;
            }
        });
    }

    function protectScroll() {
        let first;
        document.addEventListener("touchstart", event => {
            first = window.scrollY <= 0 && event.touches.length === 1 &&
                !event.target.closest?.("input, textarea, select, [contenteditable]") ? event.touches[0] : null;
            for (let node = event.target; first && node && node !== document.body; node = node.parentElement) {
                if (node.scrollTop > 0) first = null;
            }
        }, {passive: true});
        document.addEventListener("touchmove", event => {
            if (!first || window.scrollY > 0 || event.touches.length !== 1 || !event.cancelable) return;
            const touch = event.touches[0];
            const dy = touch.clientY - first.clientY;
            if (dy > 4 && dy > Math.abs(touch.clientX - first.clientX)) event.preventDefault();
        }, {passive: false});
        const end = () => { first = null; };
        document.addEventListener("touchend", end, {passive: true});
        document.addEventListener("touchcancel", end, {passive: true});
    }

    function install(tool, adapter) {
        const prefix = "observation." + tool + ".";
        const sessionKey = prefix + "session.v1";
        const presetsKey = prefix + "presets.v1";
        const activeKey = prefix + "active-config.v1";
        const status = el("obs-status");
        const notice = el("obs-notice");
        const select = el("obs-selected");
        const edit = el("obs-rename");
        const nameField = el("obs-name");
        const download = el("obs-download");
        const upload = el("obs-file");
        const resume = el("obs-resume");
        const original = el("obs-original");
        let lastSession = null;
        let paused = false;
        let pending = false;
        let renaming = "";
        const message = text => { notice.textContent = text; };
        const setStatus = text => { if (status.textContent !== text) status.textContent = text; };
        function readPresets() {
            const items = JSON.parse(get(presetsKey) || "[]");
            if (!list(items, item => obj(item) && str(item.id) && str(item.name) &&
                str(item.date) && num(item.index) && adapter.validConfig(item.config))) throw Error("invalid settings");
            return items;
        }
        function refresh(id) {
            select.replaceChildren(new Option("請選擇設定", ""));
            readPresets().forEach(item => select.add(new Option(item.name, item.id)));
            if (id) select.value = id;
        }
        function unlock() {
            original.inert = false;
            paused = false;
            resume.hidden = true;
        }
        function session() {
            const state = adapter.capture();
            if (!state) return null;
            return {format: "digital-observation", version: 1, tool, phase: state.phase,
                config: adapter.config(), filename: el("filename")?.value || "", state: state.data};
        }
        function parse(raw) {
            const saved = JSON.parse(raw);
            if (!obj(saved) || saved.format !== "digital-observation" || saved.version !== 1 ||
                saved.tool !== tool || !["active", "stopped"].includes(saved.phase) || !str(saved.filename) ||
                !adapter.validConfig(saved.config) || !adapter.validState(saved.state, saved.config, saved.phase)) {
                throw Error("invalid backup");
            }
            return saved;
        }
        function save() {
            const current = session();
            download.disabled = !current;
            if (!current && lastSession === null) return;
            if (paused && current) return;
            try {
                if (!current) {
                    window.localStorage.removeItem(sessionKey);
                    lastSession = null;
                    setStatus("開始觀課後會自動暫存。");
                    return;
                }
                const raw = JSON.stringify(current);
                if (raw === lastSession) return;
                window.localStorage.setItem(sessionKey, raw);
                lastSession = raw;
                setStatus("記錄已自動暫存於此瀏覽器。");
            } catch (error) {
                if (current) lastSession ??= "";
                setStatus(current ? "無法自動暫存，請下載觀課備份。" : "無法清除先前的暫存。");
            }
        }

        function restore(saved, imported) {
            unlock();
            adapter.reset();
            adapter.apply(saved.config);
            adapter.restore(saved.state, saved.phase, saved.config);
            const field = el("filename");
            if (field) {
                field.value = saved.filename;
                field.dispatchEvent(new Event("input", {bubbles: true}));
            }
            if (imported) save();
            if (saved.phase === "active") {
                paused = true;
                original.inert = true;
                resume.hidden = false;
                if (!imported || lastSession) setStatus("已復原記錄，計時暫停。");
            } else if (!imported || lastSession) {
                setStatus("已復原已停止的記錄，可以下載結果。");
            }
            download.disabled = false;
        }

        function confirmed(text) { return !adapter.capture() || window.confirm(text); }

        el("obs-save").onclick = () => {
            try {
                const config = adapter.config();
                if (!adapter.validConfig(config)) return message("請先完成設定欄位。");
                const items = readPresets();
                const now = new Date();
                const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
                    .map(n => String(n).padStart(2, "0")).join("");
                let index = 1 + Math.max(-1, ...items.filter(item => item.date === date).map(item => item.index));
                let name;
                do { name = index ? date + "-" + index : date; index++; }
                while (items.some(item => item.name === name));
                const id = String(Date.now()) + "-" + String(Math.random()).slice(2);
                items.push({id, date, name, index: index - 1, config});
                window.localStorage.setItem(presetsKey, JSON.stringify(items));
                refresh(id);
                message("已儲存「" + name + "」。");
            } catch (error) { message("無法寫入按鈕設定。請確認瀏覽器允許本機儲存。"); }
        };
        el("obs-apply").onclick = () => {
            try {
                const item = readPresets().find(entry => entry.id === select.value);
                if (!item) return message("請先選擇設定。");
                if (!confirmed("套用這份設定會捨棄目前的觀課記錄。確定要繼續嗎？")) return;
                window.localStorage.setItem(activeKey, JSON.stringify(item.config));
                unlock();
                adapter.reset();
                adapter.apply(item.config);
                save();
                message("已套用「" + item.name + "」。");
            } catch (error) { message("無法套用設定。"); }
        };
        el("obs-edit").onclick = () => {
            try {
                const item = readPresets().find(entry => entry.id === select.value);
                if (!item) return message("請先選擇設定。");
                renaming = item.id;
                nameField.value = item.name;
                edit.hidden = false;
                nameField.focus();
                nameField.select();
            } catch (error) { message("無法讀取設定。"); }
        };
        el("obs-cancel").onclick = () => { edit.hidden = true; };
        edit.onsubmit = event => {
            event.preventDefault();
            try {
                const items = readPresets();
                const item = items.find(entry => entry.id === renaming);
                const name = nameField.value.trim();
                if (!item || !name || items.some(entry => entry !== item && entry.name === name)) {
                    return message("請輸入有效且不重複的名稱。");
                }
                item.name = name;
                window.localStorage.setItem(presetsKey, JSON.stringify(items));
                refresh(item.id);
                edit.hidden = true;
                message("已重新命名。");
            } catch (error) { message("無法儲存設定名稱。"); }
        };

        resume.onclick = () => {
            unlock();
            adapter.resume();
            setStatus("已繼續計時。");
            save();
        };
        download.onclick = () => {
            const current = session();
            if (!current) return;
            const name = current.filename.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, "-") || "觀課";
            const url = URL.createObjectURL(new Blob([JSON.stringify(current, null, 2)], {type: "application/json"}));
            const link = document.createElement("a");
            link.href = url;
            link.download = tool + "_" + name + "_觀課備份.json";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 30000);
        };
        el("obs-import").onclick = () => upload.click();
        upload.onchange = async () => {
            const file = upload.files[0];
            upload.value = "";
            if (!file) return;
            try {
                const saved = parse(await file.text());
                if (!confirmed("匯回備份會取代目前的觀課記錄。確定要繼續嗎？")) return;
                restore(saved, true);
            } catch (error) {
                setStatus("匯回失敗，請選擇這個工具匯出的 JSON 備份。");
                console.error(error);
            }
        };

        function saveSoon() {
            if (pending) return;
            pending = true;
            setTimeout(() => { pending = false; save(); }, 0);
        }
        document.addEventListener("click", saveSoon, true);
        document.addEventListener("change", saveSoon, true);
        document.addEventListener("input", saveSoon, true);
        window.addEventListener("pagehide", save);
        document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
        setInterval(save, 1000);
        protectScroll();

        try { refresh(); } catch (error) { message("無法讀取按鈕設定。"); }
        try {
            const raw = get(sessionKey);
            if (raw) {
                restore(parse(raw), false);
                lastSession = raw;
            } else {
                const config = JSON.parse(get(activeKey) || "null");
                if (adapter.validConfig(config)) adapter.apply(config);
            }
        } catch (error) {
            setStatus("無法讀取暫存。若有手動備份，可用「匯回觀課備份」。");
            console.error(error);
        }
    }

    return {el, all, values, str, num, bool, obj, list, clock, copy, escape, preferences, install};
})();
