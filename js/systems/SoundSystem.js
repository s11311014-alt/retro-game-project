/**
 * js/systems/SoundSystem.js
 * 堅若磐石的原生 Web Audio API 復古音樂合成器與即時音效引擎
 * 支援跨瀏覽器自動解鎖、16-Step Synthwave BGM、動態轉速引擎聲、甩尾尖叫聲、碰撞爆炸聲與一鍵靜音
 */

import { AUDIO_CONFIG, STORAGE_KEY } from '../config.js';

export class SoundSystem {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem(STORAGE_KEY.AUDIO_MUTED) === 'true';

        // 音訊匯流排節點
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.engineGain = null;

        // 引擎聲節點
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineFilter = null;
        this.isEngineRunning = false;

        // 甩尾摩擦節點
        this.driftSource = null;
        this.driftGain = null;
        this.isDriftingSoundActive = false;

        // BGM 定時器與步進
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.isBgmPlaying = false;

        // 白噪音緩衝區
        this.noiseBuffer = null;
    }

    /**
     * 初始化並保證解鎖 AudioContext
     */
    initContext() {
        try {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return false;
                this.ctx = new AudioCtx();
                this._setupNodes();
            }

            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return true;
        } catch (e) {
            console.warn('[SoundSystem] AudioContext init failed:', e);
            return false;
        }
    }

    _setupNodes() {
        if (!this.ctx) return;

        // 主音量匯流排
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(
            this.isMuted ? 0 : AUDIO_CONFIG.MASTER_VOLUME,
            this.ctx.currentTime
        );
        this.masterGain.connect(this.ctx.destination);

        // BGM 匯流排
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(AUDIO_CONFIG.BGM_VOLUME, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // 音效匯流排
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(AUDIO_CONFIG.SFX_VOLUME, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // 引擎聲匯流排
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(AUDIO_CONFIG.ENGINE_VOLUME, this.ctx.currentTime);
        this.engineGain.connect(this.masterGain);

        this._createNoiseBuffer();
    }

    _createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * 1.5);
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    /**
     * 切換靜音開關
     */
    toggleMute() {
        this.initContext();
        this.isMuted = !this.isMuted;
        localStorage.setItem(STORAGE_KEY.AUDIO_MUTED, this.isMuted.toString());

        if (this.masterGain && this.ctx) {
            const target = this.isMuted ? 0 : AUDIO_CONFIG.MASTER_VOLUME;
            this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    // ==========================================
    // 1. 動態引擎轉速聲 (Dynamic Engine Drone)
    // ==========================================

    startEngine() {
        this.initContext();
        if (!this.ctx || this.isEngineRunning) return;

        try {
            this.engineOsc1 = this.ctx.createOscillator();
            this.engineOsc2 = this.ctx.createOscillator();
            this.engineFilter = this.ctx.createBiquadFilter();

            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'triangle';

            const now = this.ctx.currentTime;
            this.engineOsc1.frequency.setValueAtTime(AUDIO_CONFIG.ENGINE_MIN_FREQ, now);
            this.engineOsc2.frequency.setValueAtTime(AUDIO_CONFIG.ENGINE_MIN_FREQ * 1.5, now);

            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.setValueAtTime(380, now);

            this.engineOsc1.connect(this.engineFilter);
            this.engineOsc2.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);

            this.engineOsc1.start();
            this.engineOsc2.start();
            this.isEngineRunning = true;
        } catch (e) {
            console.warn('[SoundSystem] startEngine error:', e);
        }
    }

    updateEngine(speed) {
        if (!this.ctx || !this.isEngineRunning) return;

        try {
            const normalized = Math.max(0, Math.min(1, (speed - 6) / 8));
            const targetFreq = AUDIO_CONFIG.ENGINE_MIN_FREQ + (AUDIO_CONFIG.ENGINE_MAX_FREQ - AUDIO_CONFIG.ENGINE_MIN_FREQ) * normalized;
            const filterCutoff = 320 + normalized * 550;

            const now = this.ctx.currentTime;
            this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.06);
            this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.06);
            this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.06);
        } catch (_) {}
    }

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

    startDrift() {
        if (this.isDriftingSoundActive) return;
        this.initContext();
        if (!this.ctx || !this.noiseBuffer) return;

        try {
            this.driftSource = this.ctx.createBufferSource();
            this.driftSource.buffer = this.noiseBuffer;
            this.driftSource.loop = true;

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(1850, this.ctx.currentTime);
            bandpass.Q.setValueAtTime(4.0, this.ctx.currentTime);

            this.driftGain = this.ctx.createGain();
            this.driftGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            this.driftGain.gain.linearRampToValueAtTime(0.45, this.ctx.currentTime + 0.05);

            this.driftSource.connect(bandpass);
            bandpass.connect(this.driftGain);
            this.driftGain.connect(this.sfxGain);

            this.driftSource.start();
            this.isDriftingSoundActive = true;
        } catch (e) {
            console.warn('[SoundSystem] startDrift error:', e);
        }
    }

    stopDrift() {
        if (!this.isDriftingSoundActive || !this.ctx) return;
        try {
            if (this.driftGain) {
                this.driftGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
            }
            setTimeout(() => {
                if (this.driftSource) {
                    try {
                        this.driftSource.stop();
                        this.driftSource.disconnect();
                    } catch (_) {}
                }
                this.isDriftingSoundActive = false;
            }, 60);
        } catch (_) {
            this.isDriftingSoundActive = false;
        }
    }

    // ==========================================
    // 3. 遊戲與碰撞音效 (Game SFX)
    // ==========================================

    playStart() {
        this.initContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime + 0.01;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 經典街機升調
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);

                gain.gain.setValueAtTime(0.3, now + idx * 0.07);
                gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.07 + 0.09);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.1);
            });
        } catch (e) {
            console.warn('[SoundSystem] playStart error:', e);
        }
    }

    playCrash() {
        this.initContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime + 0.01;

            // 1. 低音重擊下潛
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(160, now);
            subOsc.frequency.linearRampToValueAtTime(25, now + 0.5);

            subGain.gain.setValueAtTime(0.9, now);
            subGain.gain.linearRampToValueAtTime(0.001, now + 0.5);

            subOsc.connect(subGain);
            subGain.connect(this.sfxGain);
            subOsc.start(now);
            subOsc.stop(now + 0.52);

            // 2. 爆炸碎裂白噪音
            if (this.noiseBuffer) {
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1400, now);
                filter.frequency.linearRampToValueAtTime(70, now + 0.7);

                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.9, now);
                noiseGain.gain.linearRampToValueAtTime(0.001, now + 0.7);

                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(this.sfxGain);

                noise.start(now);
                noise.stop(now + 0.72);
            }
        } catch (e) {
            console.warn('[SoundSystem] playCrash error:', e);
        }
    }

    // ==========================================
    // 4. 16-Step Synthwave BGM 序列器
    // ==========================================

    startBGM() {
        this.initContext();
        if (this.isBgmPlaying) return;

        this.isBgmPlaying = true;
        this.bgmStep = 0;

        // Dm 經典電子動感旋律
        const basslineFreqs = [
            73.42, 73.42, 146.83, 73.42,   // D2, D2, D3, D2
            87.31, 87.31, 174.61, 87.31,   // F2, F2, F3, F2
            98.00, 98.00, 196.00, 98.00,   // G2, G2, G3, G2
            110.00, 98.00, 87.31, 73.42    // A2, G2, F2, D2
        ];

        const leadFreqs = [
            293.66, 0, 349.23, 0,          // D4, -, F4, -
            440.00, 0, 392.00, 349.23,     // A4, -, G4, F4
            293.66, 349.23, 440.00, 523.25,// D4, F4, A4, C5
            587.33, 523.25, 440.00, 392.00 // D5, C5, A4, G4
        ];

        const stepDurationMs = 125;

        this.bgmTimer = setInterval(() => {
            if (!this.isBgmPlaying || !this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
                return;
            }

            const now = this.ctx.currentTime + 0.02;
            const currentStep = this.bgmStep % 16;
            this.bgmStep++;

            const bassFreq = basslineFreqs[currentStep];
            if (bassFreq > 0) {
                this._playSynthBass(bassFreq, now, 0.1);
            }

            const leadFreq = leadFreqs[currentStep];
            if (leadFreq > 0) {
                this._playSynthLead(leadFreq, now, 0.11);
            }

            this._playHiHat(now, currentStep % 4 === 2);
        }, stepDurationMs);
    }

    _playSynthBass(freq, time, duration) {
        try {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, time);
            filter.frequency.linearRampToValueAtTime(150, time + duration);

            gain.gain.setValueAtTime(0.4, time);
            gain.gain.linearRampToValueAtTime(0.001, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(time);
            osc.stop(time + duration + 0.03);
        } catch (_) {}
    }

    _playSynthLead(freq, time, duration) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.2, time);
            gain.gain.linearRampToValueAtTime(0.001, time + duration);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(time);
            osc.stop(time + duration + 0.03);
        } catch (_) {}
    }

    _playHiHat(time, isAccent = false) {
        if (!this.noiseBuffer) return;
        try {
            const source = this.ctx.createBufferSource();
            source.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(8000, time);

            const gain = this.ctx.createGain();
            const vol = isAccent ? 0.12 : 0.06;
            gain.gain.setValueAtTime(vol, time);
            gain.gain.linearRampToValueAtTime(0.001, time + 0.04);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            source.start(time);
            source.stop(time + 0.05);
        } catch (_) {}
    }

    stopBGM() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}
