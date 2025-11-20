// DOM 
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

// 要素参照
const poolEl = $('#pool');
const historyEl = $('#history');
const nowNumEl = $('#nowNum');
const statusEl = $('#status');
const sparksEl = $('#sparks');

// 状態
const MODE = 75;
let pool = [], remain = [], history = [], rollTimer = null;
let sysFlg = false;

// 初期化
function init() {
    pool = Array.from({ length: MODE }, (_, i) => i + 1);
    remain = pool.slice();
    history = [];
    nowNumEl.textContent = '–';
    renderPool();
    renderHistory();
    statusEl.textContent = '未開始';
    btnStartStop.textContent = '抽選開始';
    btnStartStop.disabled = false;
    btnBingo.disabled = false;
    btnReset.disabled = false;
}

// プール描画
function renderPool() {
    poolEl.innerHTML = '';
    pool.forEach(n => {
        const d = document.createElement('div');
        d.className = 'cell' + (history.includes(n) ? ' mark' : '');
        d.textContent = n;
        poolEl.appendChild(d);
    });
}

// 履歴描画
function renderHistory() {
    historyEl.innerHTML = '';
    history.slice().reverse().forEach(n => {
        const b = document.createElement('div');
        b.className = 'ball hit';
        b.textContent = n;
        historyEl.appendChild(b);
    });
}

// 火花エフェクト
function burstSparks() {
    sparksEl.innerHTML = '';
    for (let i = 0; i < 36; i++) {
        const s = document.createElement('div');
        s.className = 'spark';
        s.style.left = 50 + (Math.random() * 30 - 15) + '%';
        s.style.top = '45%';
        s.style.setProperty('--r', Math.random() * 360 + 'deg');
        const vy = (Math.random() * 80 + 140) * (Math.random() > .5 ? -1 : 1);
        const vx = (Math.random() * 220 - 110);
        const dur = 600 + Math.random() * 400;
        const start = performance.now();
        function anim(t) {
            const p = (t - start) / dur;
            if (p >= 1) { s.remove(); return; }
            const y = vy * p * p, x = vx * p;
            s.style.transform = `translate(${x}px, ${y}px) rotate(var(--r))`;
            s.style.opacity = String(1 - p);
            requestAnimationFrame(anim);
        }
        sparksEl.appendChild(s);
        requestAnimationFrame(anim);
    }
}

let MusicCount = false;
// オープニングBGM
const OpeningSound = (() => {
    let audio;
    function start() {
        if (!audio) {
            audio = new Audio("Audio/Stargazer.mp3");
            audio.loop = true;
        }
        audio.currentTime = 0;
        audio.volume = 0.1;
        MusicCount = true;
        audio.play().catch(err => console.warn("オープニング音声再生エラー:", err));
    }
    function stop() {
        if (audio) {
            audio.pause();
        }
    }

    return { start, stop };
})();

// ボタンなど要素
const btnStartStop = $('#btnStartStop');
const btnReset = $('#btnReset');
const btnBingo = $('#btnBingo');
const btnSystem = $('#System');
const btnProjector = $('#btnProjector');

const startScreen = document.getElementById('startScreen');
const startTitle = document.getElementById('startTitle');
const btnGameStart = document.getElementById('btnGameStart');

// スタートボタン
btnGameStart.addEventListener('click', () => {
    btnGameStart.disabled = true;
    btnGameStart.textContent = 'LOADING...';

    // クリックをトリガにオープニングBGM開始..ここを変更しましょう
    OpeningSound.stop();
    GameStartSE.play();
    setTimeout(() => {
        startScreen.classList.add('fade-out');

        setTimeout(() => {
            startScreen.style.display = 'none';

            // デフォルトBGMをセット
            MetalSound.select(0);
            fadeInBgmToCurrentVolume(3000);

        }, 700);
    }, 6000)

});


// 状態管理（抽選）
let isRolling = false;
let lastDecided = null;
let currentHistIndex = null;


// 抽選開始・停止トグル
btnStartStop.addEventListener('click', () => {
    if (!isRolling) {
        // 抽選開始
        if (remain.length === 0) {
            alert('すべて抽選済みです');
            return;
        }
        statusEl.textContent = '抽選中…';
        btnStartStop.textContent = 'STOP / 決定';
        btnBingo.disabled = true;
        btnReset.disabled = true;

        const bgmState = MetalSound.getState();
        bgmWasPlayingBeforeRoll = bgmState.isPlaying; // ロール前に再生中だったか記録
        if (bgmWasPlayingBeforeRoll) {
            MetalSound.pause(); // 時間はリセットしない
        }
        RollSound.start();     // ロール専用SEを再生

        rollTimer = setInterval(() => {
            const n = remain[Math.floor(Math.random() * remain.length)];
            nowNumEl.textContent = n;
        }, 40);

        isRolling = true;
    } else {
        // ストップ・決定
        clearInterval(rollTimer);
        rollTimer = null;

        // ロールSE停止
        RollSound.stop();

        //確定SE
        ConfirmSound.play();

        // ロール前にBGMが鳴っていた場合のみ復帰処理
        if (bgmWasPlayingBeforeRoll) {
            // BGMは続きから3秒フェードイン
            fadeInBgmToCurrentVolume(3000);
        }
        bgmWasPlayingBeforeRoll = false;

        const n = Number(nowNumEl.textContent);
        lastDecided = n;
        const ri = remain.indexOf(n);
        if (ri > -1) remain.splice(ri, 1);
        if (!history.includes(n)) history.push(n);

        statusEl.textContent = `決定：${n}（残り ${remain.length}）`;
        renderPool();
        renderHistory();
        burstSparks();

        btnStartStop.textContent = '抽選開始';
        btnBingo.disabled = false;
        btnReset.disabled = false;
        isRolling = false;
    }
});

btnReset.addEventListener('click', () => {
    if (confirm('リセットしますか？履歴が消えます')) init();
});

btnBingo.addEventListener('click', () => { /* 後で bindBingo から上書き */ });

btnSystem.addEventListener('click', () => {
    if (sysFlg == false) {
        document.getElementById("prizeAdmin").hidden = false;
        document.getElementById("prizeHistoryPanel").hidden = false;
        sysFlg = true;
    } else {
        document.getElementById("prizeAdmin").hidden = true;
        document.getElementById("prizeHistoryPanel").hidden = true;
        sysFlg = false;
    }
});

// プロジェクターモード トグル
if (btnProjector) {
    btnProjector.addEventListener('click', () => {
        if (MusicCount == false) {
            OpeningSound.start();
        }
        document.body.classList.toggle('projector');
        const on = document.body.classList.contains('projector');
        btnProjector.textContent = on ? '通常サイズ' : 'プロジェクターサイズ';
    });
}

window.addEventListener('load', () => {

    // タイトル落下アニメも起動時にスタート
    const startTitle = document.getElementById('startTitle');
    if (startTitle) {
        startTitle.classList.add('drop-in');
    }
});