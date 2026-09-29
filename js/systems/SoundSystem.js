/**
 * js/systems/SoundSystem.js
 * 基於原生 Web Audio API 之復古音樂合成器與即時音效系統
 * 包含：動態引擎轉速聲、手煞車甩尾胎痕尖叫聲、撞車爆炸聲、開局音效與 16-Step Synthwave BGM
 */

import { AUDIO_CONFIG, STORAGE_KEY } from '../config.js';

export class SoundSystem {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem(STORAGE_KEY.AUDIO_MUTED) === 'true';

        // 核心節點
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.engineGain = null;

        // 引擎聲合成器節點
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineFilter = null;
        this.isEngineRunning = false;

        // 甩尾聲合成器節點
        this.driftSource = null;
        this.driftGain = null;
        this.isDriftingSoundActive = false;

        // BGM 序列器定時器
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.isBgmPlaying = false;

        // 白噪音緩衝區 (供胎痕摩擦與爆炸音效使用)
        this.noiseBuffer = null;
    }

    /**
     * 初始化 AudioContext（瀏覽器需在首次使用者互動後解鎖）
     */
    initContext() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        this.ctx = new AudioCtx();

        // 建立音量控制匯流排
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
            this.isMuted ? 0 : AUDIO_CONFIG.MASTER_VOLUME,
            this.ctx.currentTime
        );
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(AUDIO_CONFIG.BGM_VOLUME, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(AUDIO_CONFIG.SFX_VOLUME, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(AUDIO_CONFIG.ENGINE_VOLUME, this.ctx.currentTime);
        this.engineGain.connect(this.masterGain);

        // 預先產生白噪音緩衝區
        this._createNoiseBuffer();
    }

    _createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2; // 2 秒白噪音
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    /**
     * 切換靜音狀態
     * @returns {boolean} 當前靜音狀態
     */
    toggleMute() {
        this.initContext();
        this.isMuted = !this.isMuted;
        localStorage.setItem(STORAGE_KEY.AUDIO_MUTED, this.isMuted.toString());

        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(
                this.isMuted ? 0 : AUDIO_CONFIG.MASTER_VOLUME,
                this.ctx.currentTime,
                0.03
            );
        }
        return this.isMuted;
    }

    // ==========================================
    // 1. 動態引擎轉速聲 (Dynamic Engine Drone)
    // ==========================================

    /**
     * 啟動引擎聲
     */
    startEngine() {
        this.initContext();
        if (!this.ctx || this.isEngineRunning) return;

        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc2 = this.ctx.createOscillator();
        this.engineFilter = this.ctx.createBiquadFilter();

        this.engineOsc1.type = 'sawtooth';
        this.engineOsc2.type = 'triangle';

        // 雙振盪器微失諧 (Detune) 製造機械轉子轰鳴質感
        this.engineOsc1.frequency.setValueAtTime(AUDIO_CONFIG.ENGINE_MIN_FREQ, this.ctx.currentTime);
        this.engineOsc2.frequency.setValueAtTime(AUDIO_CONFIG.ENGINE_MIN_FREQ * 1.5, this.ctx.currentTime);
        this.engineOsc2.detune.setValueAtTime(7, this.ctx.currentTime);

        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);

        this.engineOsc1.start();
        this.engineOsc2.start();
        this.isEngineRunning = true;
    }

    /**
     * 根據當前車速動態調節引擎頻率與濾波開口
     * @param {number} speed 當前行駛車速 (6 ~ 15)
     */
    updateEngine(speed) {
        if (!this.ctx || !this.isEngineRunning) return;

        // 車速映射至 45Hz ~ 140Hz
        const normalized = Math.max(0, Math.min(1, (speed - 6) / 8));
        const targetFreq = AUDIO_CONFIG.ENGINE_MIN_FREQ + (AUDIO_CONFIG.ENGINE_MAX_FREQ - AUDIO_CONFIG.ENGINE_MIN_FREQ) * normalized;
        const filterCutoff = 280 + normalized * 450;

        const now = this.ctx.currentTime;
        this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.08);
        this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.08);
        this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);
    }

    /**
     * 停止引擎聲
     */
    stopEngine() {
        if (!this.isEngineRunning) return;
        try {
            if (this.engineOsc1) {
                this.engineOsc1.stop();
                this.engineOsc1.disconnect();
            }
            if (this.engineOsc2) {
                this.engineOsc2.stop();
                this.engineOsc2.disconnect();
            }
        } catch (_) {}
        this.isEngineRunning = false;
    }

    // ==========================================
    // 2. 輪胎甩尾尖叫聲 (Drift Screech)
    // ==========================================

    /**
     * 開啟甩尾摩擦音效
     */
    startDrift() {
        if (this.isDriftingSoundActive) return;
        this.initContext();
        if (!this.ctx || !this.noiseBuffer) return;

        this.driftSource = this.ctx.createBufferSource();
        this.driftSource.buffer = this.noiseBuffer;
        this.driftSource.loop = true;

        // 帶通濾波器調製出尖銳胎痕聲
        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(1750, this.ctx.currentTime);
        bandpass.Q.setValueAtTime(4.5, this.ctx.currentTime);

        this.driftGain = this.ctx.createGain();
        this.driftGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.driftGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.05);

        this.driftSource.connect(bandpass);
        bandpass.connect(this.driftGain);
        this.driftGain.connect(this.sfxGain);

        this.driftSource.start();
        this.isDriftingSoundActive = true;
    }

    /**
     * 停止甩尾摩擦音效
     */
    stopDrift() {
        if (!this.isDriftingSoundActive || !this.ctx) return;
        if (this.driftGain) {
            this.driftGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.04);
        }
        setTimeout(() => {
            if (this.driftSource) {
                try {
                    this.driftSource.stop();
                    this.driftSource.disconnect();
                } catch (_) {}
            }
            this.isDriftingSoundActive = false;
        }, 50);
    }

    // ==========================================
    // 3. 碰撞爆炸與遊戲音效 (Crash & Game SFX)
    // ==========================================

    /**
     * 播放開局啟動音效
     */
    playStart() {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setTargetAtTime(0.001, now + 0.08, 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    /**
     * 播放車輛碰撞爆炸音效
     */
    playCrash() {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // 1. 低音衝擊重擊聲 (Sub Bass Thud)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

        subGain.gain.setValueAtTime(0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + 0.45);

        // 2. 爆炸白噪音碎裂聲 (Explosion Noise)
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.7, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noise.start(now);
            noise.stop(now + 0.65);
        }
    }

    // ==========================================
    // 4. 復古 Synthwave 16-Step BGM 序列器
    // ==========================================

    /**
     * 開始播放復古背景音樂
     */
    startBGM() {
        this.initContext();
        if (!this.ctx || this.isBgmPlaying) return;

        this.isBgmPlaying = true;
        this.bgmStep = 0;

        // 16-Step 經典賽車 Bassline 頻率音高 (D 小調電音琶音)
        const basslineFreqs = [
            73.42, 73.42, 146.83, 73.42,   // D2, D2, D3, D2
            87.31, 87.31, 174.61, 87.31,   // F2, F2, F3, F2
            98.00, 98.00, 196.00, 98.00,   // G2, G2, G3, G2
            110.00, 98.00, 87.31, 73.42    // A2, G2, F2, D2
        ];

        // 16-Step 主旋律琶音
        const leadFreqs = [
            293.66, 0, 349.23, 0,          // D4, -, F4, -
            440.00, 0, 392.00, 349.23,     // A4, -, G4, F4
            293.66, 349.23, 440.00, 523.25,// D4, F4, A4, C5
            587.33, 523.25, 440.00, 392.00 // D5, C5, A4, G4
        ];

        const stepDurationMs = 125; // 120 BPM 16th notes

        this.bgmTimer = setInterval(() => {
            if (!this.isBgmPlaying || !this.ctx) return;

            const now = this.ctx.currentTime;
            const currentStep = this.bgmStep % 16;
            this.bgmStep++;

            // A. 低音 Bass 音符觸發
            const bassFreq = basslineFreqs[currentStep];
            if (bassFreq > 0) {
                this._playSynthBass(bassFreq, now, 0.1);
            }

            // B. 高音 Lead 琶音觸發 (每 2 步一次)
            const leadFreq = leadFreqs[currentStep];
            if (leadFreq > 0) {
                this._playSynthLead(leadFreq, now, 0.11);
            }

            // C. 踩鈸 Hi-hat 節奏感 (每步觸發微量白噪音)
            this._playHiHat(now, currentStep % 4 === 2);
        }, stepDurationMs);
    }

    _playSynthBass(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + duration);

        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + duration + 0.02);
    }

    _playSynthLead(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + duration + 0.02);
    }

    _playHiHat(time, isAccent = false) {
        if (!this.noiseBuffer) return;
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);

        const gain = this.ctx.createGain();
        const vol = isAccent ? 0.07 : 0.03;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        source.start(time);
        source.stop(time + 0.05);
    }

    /**
     * 停止背景音樂
     */
    stopBGM() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
