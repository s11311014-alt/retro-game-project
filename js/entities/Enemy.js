/**
 * js/entities/Enemy.js
 * 敵方障礙車輛實體
 */

import { Entity } from './Entity.js';
import { PLAYER_CONFIG } from '../config.js';

export class Enemy extends Entity {
    /**
     * @param {number} lane 車道編號 (0: 左, 1: 中, 2: 右)
     * @param {string} color 車身顏色
     * @param {number} speedRatio 相對速差比例
     * @param {number} [initY=-80] 初始 Y 座標
     */
    constructor(lane, color, speedRatio, initY = -80) {
        super(0, initY, PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT, color);
        this.lane = lane;
        this.speedRatio = speedRatio;
    }

    /**
     * 繪製敵方賽車（含輪胎、車頂、前擋風玻璃、黃色尾燈）
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        // 四顆輪胎
        ctx.fillStyle = '#111';
        const tw = 6, th = 12;
        ctx.fillRect(-this.width / 2 - 2, -this.height / 2 + 6, tw, th);
        ctx.fillRect(this.width / 2 - tw + 2, -this.height / 2 + 6, tw, th);
        ctx.fillRect(-this.width / 2 - 2, this.height / 2 - 18, tw, th);
        ctx.fillRect(this.width / 2 - tw + 2, this.height / 2 - 18, tw, th);

        // 主車身
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2 + 3, -this.height / 2, this.width - 6, this.height);

        // 車頂與擋風玻璃
        ctx.fillStyle = '#222';
        ctx.fillRect(-this.width / 2 + 6, -this.height / 2 + 12, this.width - 12, 10);
        ctx.fillRect(-this.width / 2 + 7, this.height / 2 - 16, this.width - 14, 6);
        ctx.fillStyle = '#00fff5';
        ctx.fillRect(-this.width / 2 + 8, -this.height / 2 + 14, this.width - 16, 6);

        // 敵車黃色尾燈
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-this.width / 2 + 4, this.height / 2 - 2, 6, 2);
        ctx.fillRect(this.width / 2 - 10, this.height / 2 - 2, 6, 2);

        ctx.restore();
    }
}
