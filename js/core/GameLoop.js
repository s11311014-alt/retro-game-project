/**
 * js/core/GameLoop.js
 * 基於 requestAnimationFrame 之高精度幀循環器，計算 Delta Time 並提供平滑步進縮放
 */

export class GameLoop {
    /**
     * @param {(dtRatio: number) => void} updateFn 
     * @param {() => void} renderFn 
     */
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.isRunning = false;
        this.lastTime = 0;
        this.rafId = null;

        this._loop = this._loop.bind(this);
    }

    /**
     * 啟動主迴圈
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this._loop);
    }

    /**
     * 暫停主迴圈
     */
    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    _loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 以標準 60FPS (約 16.667ms) 作為基準單位步進 1.0
        // 設定上限 2.5 以防視窗切換背景後恢復時產生過度穿牆位移 (Spiral of Death)
        const dtRatio = Math.min(deltaTime / 16.6667, 2.5);

        this.updateFn(dtRatio);
        this.renderFn();

        this.rafId = requestAnimationFrame(this._loop);
    }
}
