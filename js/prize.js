// 景品登録＋選択発表＋履歴
const MAX_PRIZES = 30;
const PRIZE_KEY = 'metalingo_prizes_v1';
const PRIZE_HIST_KEY = 'metalingo_prize_history_v1';

// 管理UI
const prizeCountBadge = document.getElementById('prizeCountBadge');
const prizeListEl = document.getElementById('prizeList');
const pzName = document.getElementById('pzName');
const pzDesc = document.getElementById('pzDesc');
const pzImgUrl = document.getElementById('pzImgUrl');
const pzImgFile = document.getElementById('pzImgFile');
const pzPreview = document.getElementById('pzPreview');
const pzRegBtn = document.getElementById('pzRegBtn');
const pzClearBtn = document.getElementById('pzClearBtn');
const pzExport = document.getElementById('pzExport');
const pzImportFile = document.getElementById('pzImportFile');

// モーダル＆発表
const prizePicker = document.getElementById('prizePicker');
const pickerGrid = document.getElementById('pickerGrid');
const pickerClose = document.getElementById('pickerClose');
const announceEl = document.getElementById('prizeAnnounce');
const announceImg = document.getElementById('announceImg');
const announceMsg = document.getElementById('announceMsg');
const announceName = document.getElementById('announceName');
const announceDesc = document.getElementById('announceDesc');

const winnerNameInput = document.getElementById('winnerName');
const winnerSaveBtn = document.getElementById('winnerSave');
const winnerStatus = document.getElementById('winnerStatus');

// 履歴UI
const historyGridPrize = document.getElementById('historyGridPrize');
const histClear = document.getElementById('histClear');

// util
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function fmtTime(ts) { const d = new Date(ts); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }

// ストレージ
function loadPrizes() { try { return JSON.parse(localStorage.getItem(PRIZE_KEY) || '[]'); } catch { return []; } }
function savePrizes(arr) { localStorage.setItem(PRIZE_KEY, JSON.stringify(arr)); }
function loadHist() { try { return JSON.parse(localStorage.getItem(PRIZE_HIST_KEY) || '[]'); } catch { return []; } }
function saveHist(arr) { localStorage.setItem(PRIZE_HIST_KEY, JSON.stringify(arr)); }

// 安全要素生成
function el(tag, props = {}, children = []) {
    const d = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (k === 'text') d.textContent = v;
        else if (k === 'src') d.setAttribute('src', v);
        else d.setAttribute(k, v);
    }
    children.forEach(c => d.appendChild(c));
    return d;
}

function cardForPrizeList(p) {
    const img = p.img ? el('img', { src: p.img, alt: '' }) : null;
    if (img) img.onerror = () => img.remove();
    const name = el('div', { class: 'name', text: p.name });
    const desc = el('div', { class: 'desc', text: p.desc || '' });
    const del = el('button', { class: 'btn' }, []); del.textContent = '削除';
    del.addEventListener('click', () => { savePrizes(loadPrizes().filter(x => x.id !== p.id)); renderPrizeList(); });
    const row = el('div', { class: 'row' }, [del]);
    const body = el('div', { class: 'body' }, [name, desc, row]);
    const card = el('div', { class: 'prize-card' }, []);
    if (img) card.appendChild(img);
    card.appendChild(body);
    return card;
}

function renderPrizeList() {
    const normalized = loadPrizes().map(p => ({ revealed: false, ...p }));
    savePrizes(normalized);

    const prizes = normalized;
    prizeListEl.innerHTML = '';
    prizes.forEach(p => prizeListEl.appendChild(cardForPrizeList(p)));
    if (prizeCountBadge) prizeCountBadge.textContent = `${prizes.length}/${MAX_PRIZES}`;
    pzRegBtn.disabled = prizes.length >= MAX_PRIZES;
}

function updatePreview() {
    const url = pzImgUrl.value.trim();
    const file = pzImgFile.files && pzImgFile.files[0];
    if (file) {
        const r = new FileReader();
        r.onload = e => pzPreview.src = e.target.result;
        r.readAsDataURL(file);
    } else if (url) {
        pzPreview.src = url;
    } else {
        pzPreview.removeAttribute('src');
    }
}
pzImgUrl.addEventListener('input', updatePreview);
pzImgFile.addEventListener('change', updatePreview);
pzExport.addEventListener('click', () => {
    console.log("a")
    const prizes = loadPrizes();

    if (!prizes.length) {
        alert("景品がありません");
        return;
    }
    console.log("a")

    const blob = new Blob([JSON.stringify(prizes, null, 2)],
        { type: 'application/json' }
    );

    console.log("a")
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `metalingo${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
});

pzImportFile.addEventListener('change', () => {
    const file = pzImportFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const raw = JSON.parse(e.target.result);

            if (!Array.isArray(raw)) {
                throw new Error('notArray');
            }
            const normalized = raw.map(p => ({
                id: p.id || uid(),
                name: String(p.name) || "",
                desc: String(p.desc) || '',
                img: p.img || '',
                revealed: !!p.reveraled
            })).slice(0, MAX_PRIZES);

            savePrizes(normalized);
            renderPrizeList();

        } catch (err) {
            console.error(err)
        } finally {
            pzImportFile.value = "";
        }
    };
    reader.readAsText(file, 'utf-8');
})

pzRegBtn.addEventListener('click', async () => {
    const prizes = loadPrizes();
    if (prizes.length >= MAX_PRIZES) { alert(`上限${MAX_PRIZES}件まで`); return; }
    const name = pzName.value.trim(); if (!name) { alert('景品名は必須'); return; }
    const desc = pzDesc.value.trim();
    const url = pzImgUrl.value.trim();
    const file = pzImgFile.files && pzImgFile.files[0];

    let imgData = '';
    if (file) {
        imgData = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = e => res(e.target.result);
            r.onerror = rej;
            r.readAsDataURL(file);
        });
    } else if (url) { imgData = url; }

    prizes.push({ id: uid(), name, desc, img: imgData, revealed: false }); // ★追加
    savePrizes(prizes);

    pzName.value = ''; pzDesc.value = ''; pzImgUrl.value = ''; pzImgFile.value = '';
    pzPreview.removeAttribute('src');
    renderPrizeList();
});

pzClearBtn.addEventListener('click', () => {
    if (!confirm('登録済み景品を全削除します。よろしい？')) return;
    savePrizes([]); renderPrizeList();
});

// 履歴
function renderHist() {
    const arr = loadHist().slice().reverse();
    historyGridPrize.innerHTML = '';
    if (arr.length === 0) {
        const d = el('div', { class: 'h-sub', text: 'まだ当選履歴はありません。' });
        historyGridPrize.appendChild(d); return;
    }
    arr.forEach(x => {
        const wrap = el('div', { class: 'h-card' });
        if (x.img) {
            const im = el('img', { src: x.img, alt: '' }); im.onerror = () => im.remove();
            wrap.appendChild(im);
        }
        const ttl = el('div', { class: 'h-title' });
        if (x.num) { ttl.appendChild(el('span', { class: 'badge-num', text: `#${x.num}` })); }
        ttl.appendChild(document.createTextNode(x.name));

        const meta = el('div', { class: 'h-sub', text: fmtTime(x.ts) });
        const dsc = x.desc ? el('div', { class: 'h-sub', text: x.desc }) : null;
        const win = x.winner ? el('div', { class: 'h-sub', text: `獲得者：${x.winner}` }) : null;

        const kids = [ttl, meta];
        if (dsc) kids.push(dsc);
        if (win) kids.push(win);

        const body = el('div', { class: 'h-body' }, kids);
        wrap.appendChild(body);
        historyGridPrize.appendChild(wrap);
    });
}
function pushHist(entry) {
    const arr = loadHist();
    arr.push(entry);
    saveHist(arr);
    renderHist();
    return arr.length - 1;
}
histClear.addEventListener('click', () => {
    if (!confirm('当選履歴をすべて削除します。よろしい？')) return;
    saveHist([]);
    renderHist();
});

// モーダル＆発表
function openPicker() {
    const prizes = loadPrizes().map(p => ({ revealed: false, ...p })); // 保険
    pickerGrid.innerHTML = '';
    if (prizes.length === 0) {
        pickerGrid.appendChild(el('div', { style: 'color:#9ca3af', text: '景品がありません。右の「景品管理」から登録してください。' }));
    } else {
        prizes.forEach(p => {
            const card = el('div', { class: 'prize-card' });

            if (p.revealed && p.img) {
                // 公開済みは本物の画像を出す
                const im = el('img', { src: p.img, alt: '' }); im.onerror = () => im.remove();
                card.appendChild(im);
            } else {
                // 未公開はネタバレ防止サムネを出す
                const mystery = el('div', { class: 'mystery-thumb' }, [
                    el('div', { class: 'q', text: '？？？' })
                ]);
                card.appendChild(mystery);
            }

            const name = el('div', { class: 'name', text: p.name });
            const desc = el('div', { class: 'desc', text: (p.desc || '').slice(0, 80) });
            const hint = !p.revealed ? el('div', { class: 'mystery-hint', text: '発表まで画像はヒミツ' }) : null;

            const choose = el('button', { class: 'btn' });
            choose.textContent = 'この景品を発表';
            choose.addEventListener('click', () => {
                //おめでとうサウンドの追加
                BINGOSE.play();

                showAnnouncement(p)
            });

            const bodyKids = hint ? [name, desc, hint] : [name, desc];
            const body = el('div', { class: 'body' }, [...bodyKids, el('div', { class: 'row' }, [choose])]);

            card.appendChild(body);
            pickerGrid.appendChild(card);
        });
    }
    prizePicker.classList.add('show');
    prizePicker.setAttribute('aria-hidden', 'false');
    pickerClose.focus();
}

function closePicker() {
    prizePicker.classList.remove('show');
    prizePicker.setAttribute('aria-hidden', 'true');
}

pickerClose.addEventListener('click', closePicker);
prizePicker.addEventListener('click', (e) => { if (e.target === prizePicker) closePicker(); });

function showAnnouncement(prize) {
    closePicker();
    announceName.textContent = prize.name;
    announceDesc.textContent = prize.desc || '';
    announceMsg.textContent = '当選おめでとう！';
    if (prize.img) {
        announceImg.src = prize.img;
    } else {
        announceImg.removeAttribute('src');
    }
    announceEl.classList.add('show');
    announceEl.setAttribute('aria-hidden', 'false');

    // ★ ここで公開フラグを立てる
    const arr = loadPrizes();
    const i = arr.findIndex(x => x.id === prize.id);
    if (i > -1) {
        arr[i].revealed = true;
        savePrizes(arr);
    }

    // 入力欄リセット
    winnerNameInput.value = '';
    winnerStatus.textContent = '';
    // 履歴に記録
    currentHistIndex = pushHist({
        ts: Date.now(),
        num: lastDecided,
        id: prize.id,
        name: prize.name,
        desc: prize.desc || '',
        img: prize.img || '',
        winner: '' // 初期は空
    });
}
winnerSaveBtn.addEventListener('click', () => {
    if (currentHistIndex == null) {
        alert('直近の当選情報が見つかりません。');
        return;
    }

    const name = winnerNameInput.value.trim();
    const arr = loadHist();

    if (!arr[currentHistIndex]) {
        alert('履歴データが見つかりません。');
        return;
    }

    arr[currentHistIndex].winner = name;
    saveHist(arr);
    renderHist();

    winnerStatus.textContent = name
        ? `「${name}」として記録しました。`
        : '獲得者なしで記録しました。';

    hideAnnouncement();
});

function hideAnnouncement() {
    announceEl.classList.remove('show');
    announceEl.setAttribute('aria-hidden', 'true');
}

// 背景（overlay 自体）をクリックしたときだけ閉じる
announceEl.addEventListener('click', (e) => {
    if (e.target === announceEl) {
        hideAnnouncement();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideAnnouncement();
});
// btnBingo の安全バインド
function onBingoClick() { openPicker(); }
function bindBingo() {
    const el = document.getElementById('btnBingo'); if (!el) return;
    el.removeEventListener('click', onBingoClick);
    el.addEventListener('click', onBingoClick, { passive: true });
}

// 画像公開リセット機能実装
const pzRevealReset = document.getElementById('pzRevealReset');
pzRevealReset.addEventListener('click', () => {
    if (!confirm('すべての景品の「公開済み」状態をリセットします。よろしい？')) return;
    const arr = loadPrizes().map(p => ({ ...p, revealed: false }));
    savePrizes(arr);
    renderPrizeList();
    // ピッカーを開いていた場合も反映したいなら再描画
    if (prizePicker.classList.contains('show')) openPicker();
});