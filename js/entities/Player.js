/**
 * js/entities/Player.js
 * 玩家賽車實體（包含轉向、甩尾角度、離心力響應與外觀繪製）
 */

import { Entity } from './Entity.js';
import { PLAYER_CONFIG, DRIFT_CONFIG } from '../config.js';

export class Player extends Entity {
    constructor() {
        super(204, PLAYER_CONFIG.INIT_Y, PLAYER_CONFIG.WIDTH, PLAYER_CONFIG.HEIGHT, PLAYER_CONFIG.COLOR);
        this.isDrifting = false;
    }

    /**
     * 重設玩家至初始車道位置
     * @param {number} startX 
     */
    reset(startX) {
        this.x = startX;
        this.y = PLAYER_CONFIG.INIT_Y;
        this.angle = 0;
        this.isDrifting = false;
    }

    /**
     * 處理轉向與姿態角插值
     * @param {boolean} isPressLeft 
     * @param {boolean} isPressRight 
     * @param {boolean} isDrifting 
     * @param {number} dtRatio 
     */
    steer(isPressLeft, isPressRight, isDrifting, dtRatio = 1) {
        this.isDrifting = isDrifting;
        const steerPower = this.isDrifting ? DRIFT_CONFIG.STEER_POWER_DRIFT : DRIFT_CONFIG.STEER_POWER_NORMAL;
        let targetAngle = 0;

        if (isPressLeft) {
            this.x -= steerPower * dtRatio;
            targetAngle = this.isDrifting ? -DRIFT_CONFIG.STEER_ANGLE_DRIFT : -DRIFT_CONFIG.STEER_ANGLE_NORMAL;
        } else if (isPressRight) {
            this.x += steerPower * dtRatio;
            targetAngle = this.isDrifting ? DRIFT_CONFIG.STEER_ANGLE_DRIFT : DRIFT_CONFIG.STEER_ANGLE_NORMAL;
        }

        this.angle += (targetAngle - this.angle) * DRIFT_CONFIG.ANGLE_LERP * dtRatio;
    }

    /**
     * 應用離心力偏移
     * @param {number} centrifugalForce 
     * @param {number} dtRatio 
     */
    applyCentrifugalForce(centrifugalForce, dtRatio = 1) {
        this.x -= centrifugalForce * dtRatio;
    }

    /**
     * 繪製玩家賽車（含輪胎、白線條紋、擋風玻璃、紅色尾燈）
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

        // 玩家專屬賽車白線
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -this.height / 2, 4, this.height);

        // 車頂與擋風玻璃
        ctx.fillStyle = '#222';
        ctx.fillRect(-this.width / 2 + 6, -this.height / 2 + 12, this.width - 12, 10);
        ctx.fillRect(-this.width / 2 + 7, this.height / 2 - 16, this.width - 14, 6);
        ctx.fillStyle = '#00fff5';
        ctx.fillRect(-this.width / 2 + 8, -this.height / 2 + 14, this.width - 16, 6);

        // 玩家紅色車尾燈
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-this.width / 2 + 4, this.height / 2 - 2, 6, 2);
        ctx.fillRect(this.width / 2 - 10, this.height / 2 - 2, 6, 2);

        ctx.restore();
    }
}
