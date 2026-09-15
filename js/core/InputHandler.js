/**
 * js/core/InputHandler.js
 * 集中監聽鍵盤與滑鼠事件，提供高階語意化操作狀態查詢
 */

export class InputHandler {
    /**
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            a: false,
            d: false,
            w: false,
            s: false,
            Shift: false,
            ' ': false
        };

        this.actionCallbacks = [];

        this._initListeners();
    }

    /**
     * 註冊動作回呼（例如按空白鍵或點擊以開始/重新開始遊戲）
     * @param {() => void} callback 
     */
    onAction(callback) {
        this.actionCallbacks.push(callback);
    }

    _triggerAction() {
        for (let i = 0; i < this.actionCallbacks.length; i++) {
            this.actionCallbacks[i]();
        }
    }

    _initListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key in this.keys || e.key.toLowerCase() in this.keys) {
                this.keys[e.key] = true;
                this.keys[e.key.toLowerCase()] = true;
            }

            if (e.code === 'Space') {
                this._triggerAction();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key in this.keys || e.key.toLowerCase() in this.keys) {
                this.keys[e.key] = false;
                this.keys[e.key.toLowerCase()] = false;
            }
        });

        if (this.canvas) {
            this.canvas.addEventListener('click', () => {
                this._triggerAction();
            });
        }
    }

    isSteerLeft() {
        return !!(this.keys.ArrowLeft || this.keys.a);
    }

    isSteerRight() {
        return !!(this.keys.ArrowRight || this.keys.d);
    }

    isAccelerating() {
        return !!(this.keys.ArrowUp || this.keys.w);
    }

    isBraking() {
        return !!(this.keys.ArrowDown || this.keys.s);
    }

    isHandbrake() {
        return !!(this.keys.Shift || this.keys[' ']);
    }
}
