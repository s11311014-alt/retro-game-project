/**
 * js/entities/Entity.js
 * 所有遊戲實體的抽象基礎類別
 */

export class Entity {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {string} color 
     */
    constructor(x, y, width, height, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.angle = 0;
        this.color = color;
    }

    /**
     * 取得包圍盒資訊
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * 實體邏輯更新
     * @param {number} [dtRatio=1]
     */
    update(dtRatio = 1) {}

    /**
     * 實體繪製
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {}
}
