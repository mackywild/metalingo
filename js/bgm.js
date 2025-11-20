
// ミュージック
const MetalSound = (() => {
    const tracks = [
        { id: 'ALWAYS', title: 'ALWAYS', file: 'Audio/ALWAYS.mp3' },
        { id: 'Despair', title: 'Despair', file: 'Audio/Despair.mp3' },
        { id: 'Energetic', title: 'Energetic', file: 'Audio/Energetic.mp3' },
        { id: 'Poison', title: 'Poison', file: 'Audio/Poison.mp3' },
        { id: 'Radiance', title: 'Radiance', file: 'Audio/Radiance.mp3' },
        { id: 'Falling', title: 'Falling', file: 'Audio/Falling.mp3' },
        { id: 'TOGETHER FOREVER', title: 'TOGETHER FOREVER', file: 'Audio/TOGETHER FOREVER.mp3' },
        { id: 'DEAR LUCIFER', title: 'DEAR LUCIFER', file: 'Audio/DEAR LUCIFER.mp3' },
        { id: 'Mi Amore', title: 'Mi Amore', file: 'Audio/Mi Amore.mp3' },
        { id: 'FINALE', title: 'FINALE', file: 'Audio/FINALE.mp3' },
        { id: 'Stargazer', title: 'Stargazer', file: 'Audio/Stargazer.mp3' },
        { id: 'Raincarnation', title: 'Raincarnation', file: 'Audio/Raincarnation.mp3' }
    ];

    let audio = null;
    let currentIndex = 0;
    let mode = 'order';  // 'single' | 'order' | 'shuffle'
    let volume = 0.1;
    let isPlaying = false;

    function ensureAudio(idx = currentIndex) {
        if (!tracks.length) return;

        // 同じ曲なら使い回し
        const src = tracks[idx].file;
        if (!audio || !audio._srcId || audio._srcId !== src) {
            if (audio) {
                audio.pause();
            }
            audio = new Audio(src);
            audio._srcId = src;
            audio.volume = volume;
            audio.loop = (mode === 'single');
            audio.onended = handleEnded;
        } else {
            audio.loop = (mode === 'single');
            audio.volume = volume;
            audio.onended = handleEnded;
        }
    }

    function handleEnded() {
        if (!tracks.length) return;

        if (mode === 'single') {
            // 単曲ループ
            audio.currentTime = 0;
            audio.play().catch(() => { });
        } else if (mode === 'order') {
            // 順番に再生
            currentIndex = (currentIndex + 1) % tracks.length;
            ensureAudio();
            audio.play().catch(() => { });
            syncUI();
        } else if (mode === 'shuffle') {
            // シャッフル（同じ曲を連続で避ける）
            if (tracks.length > 1) {
                let next = currentIndex;
                while (next === currentIndex) {
                    next = Math.floor(Math.random() * tracks.length);
                }
                currentIndex = next;
            }
            ensureAudio();
            audio.play().catch(() => { });
            syncUI();
        }
    }

    function play() {
        if (!tracks.length) return;
        ensureAudio();
        audio.play()
            .then(() => { isPlaying = true; syncUI(); })
            .catch(err => console.warn('BGM再生エラー:', err));
    }
    function pause() {
        if (audio) {
            audio.pause();
        }
        isPlaying = false;
        syncUI();
    }

    function stop() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        isPlaying = false;
        syncUI();
    }

    function toggle() {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }

    function setVolume(v) {
        volume = v;
        if (audio) audio.volume = v;
    }

    function setMode(m) {
        mode = m;
        if (audio) audio.loop = (mode === 'single');
    }

    function select(index) {
        if (index < 0 || index >= tracks.length) return;
        currentIndex = index;
        if (isPlaying) {
            ensureAudio();
            audio.play().catch(() => { });
        } else {
            ensureAudio();
        }
        syncUI();
    }

    function next() {
        if (!tracks.length) return;
        currentIndex = (currentIndex + 1) % tracks.length;
        if (isPlaying) {
            ensureAudio();
            audio.play().catch(() => { });
        } else {
            ensureAudio();
        }
        syncUI();
    }

    function prev() {
        if (!tracks.length) return;
        currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        if (isPlaying) {
            ensureAudio();
            audio.play().catch(() => { });
        } else {
            ensureAudio();
        }
        syncUI();
    }

    function getTracks() {
        return tracks.slice();
    }

    function getState() {
        return { currentIndex, mode, volume, isPlaying };
    }

    // 既存の抽選開始ボタンから呼ばれているAPIを維持
    function start() {
        play();
    }

    // UI 同期用（後でフックを渡す）
    let uiSyncHandlers = [];

    function registerUISync(handler) {
        uiSyncHandlers.push(handler);
    }

    function syncUI() {
        const state = getState();
        uiSyncHandlers.forEach(fn => fn(state, tracks));
    }

    return {
        start,
        stop,
        pause,
        toggle,
        setVolume,
        setMode,
        select,
        next,
        prev,
        getTracks,
        getState,
        registerUISync
    };
})();

// ===== BGM コントロール初期化 =====
function initBgmControls() {
    const sel = document.getElementById('bgmTrack');
    const btnPlay = document.getElementById('bgmPlay');
    const btnNext = document.getElementById('bgmNext');
    const btnPrev = document.getElementById('bgmPrev');
    const vol = document.getElementById('bgmVolume');
    const mode = document.getElementById('bgmMode');

    if (!sel || !btnPlay || !vol || !mode) return;

    // 曲リストをセレクトに表示
    const tracks = MetalSound.getTracks();
    sel.innerHTML = '';
    tracks.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = t.title || `Track ${i + 1}`;
        sel.appendChild(opt);
    });

    // イベント
    sel.addEventListener('change', () => {
        const idx = Number(sel.value);
        MetalSound.select(idx);
    });

    btnPlay.addEventListener('click', () => {
        MetalSound.toggle();
    });

    btnNext.addEventListener('click', () => {
        MetalSound.next();
    });

    btnPrev.addEventListener('click', () => {
        MetalSound.prev();
    });

    vol.addEventListener('input', () => {
        MetalSound.setVolume(Number(vol.value));
    });

    mode.addEventListener('change', () => {
        MetalSound.setMode(mode.value);
    });

    // プレイヤー → UI への同期
    MetalSound.registerUISync((state) => {
        if (sel && String(state.currentIndex) !== sel.value) {
            sel.value = String(state.currentIndex);
        }
        if (mode && mode.value !== state.mode) {
            mode.value = state.mode;
        }
        if (vol && Number(vol.value) !== state.volume) {
            vol.value = String(state.volume);
        }
        if (btnPlay) {
            btnPlay.textContent = state.isPlaying ? '⏸ 一時停止' : '▶ 再生';
        }
    });

    // 初期状態同期
    const st = MetalSound.getState();
    vol.value = String(st.volume);
    mode.value = st.mode;
    sel.value = String(st.currentIndex);
}
// ロール専用サウンド
const RollSound = (() => {
    let audio;

    function start() {
        if (!audio) {
            // 好きなロール用SEファイルに変えてOK
            audio = new Audio("Audio/res.mp3");
            audio.loop = true;
            audio.volume = 0.7;
        }
        audio.currentTime = 0;
        audio.play().catch(err => console.warn("ロール音再生エラー:", err));
    }

    function stop() {
        if (audio) {
            audio.pause();
        }
    }

    return { start, stop };
})();

// 確定SE
const ConfirmSound = (() => {
    let audio;

    function play() {
        if (!audio) {
            // ★確定SEのファイル名は好きなのに差し替え
            audio = new Audio("Audio/pon.mp3");
            audio.volume = 1.0;
        }
        audio.currentTime = 0;
        audio.play().catch(err => console.warn("確定SE再生エラー:", err));
    }

    return { play };
})();
// BGMを0から targetVolume までdurationミリ秒でフェードイン
function fadeInBgmToCurrentVolume(duration = 3000) {
    const state = MetalSound.getState();
    const targetVolume = state.volume; // スライダーの値(例:0.1)

    // 完全ミュート指定ならそのまま再生だけして終わり
    if (targetVolume <= 0) {
        MetalSound.setVolume(0);
        MetalSound.start();
        return;
    }

    // まず音量0で再生開始（続きから）
    MetalSound.setVolume(0);
    MetalSound.start();  // play() 相当。位置は pause 時のまま

    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1); // 0〜1
        const v = targetVolume * t;
        MetalSound.setVolume(v);

        if (t < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}
// GAME START用SE
const GameStartSE = (() => {
    let audio;

    function play() {
        if (!audio) {
            audio = new Audio("Audio/SE3.mp3"); // 好きなSEファイル名に
            audio.volume = 0.1;
        }
        audio.currentTime = 0;
        audio.play().catch(err => console.warn("GAME START SE 再生エラー:", err));
    }

    return { play };
})();

let bgmWasPlayingBeforeRoll = false;