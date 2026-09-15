/**
 * js/systems/ParticleSystem.js
 * 輪胎白煙粒子與地面胎痕渲染管理系統
 */

import { CANVAS_HEIGHT } from '../config.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.tireTracks = [];
    }

    /**
     * 重設粒子與胎痕列表
     */
    clear() {
        this.particles = [];
        this.tireTracks = [];
    }

    /**
     * 新增輪胎摩擦煙霧粒子
     * @param {number} x 
     * @param {number} y 
     * @param {number} speed 
     */
    addSmoke(x, y, speed) {
        this.particles.push({
            x: x,
            y: y,
            size: Math.random() * 6 + 3,
            alpha: 0.8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -speed * 0.3
        });
    }

    /**
     * 新增地面輪胎壓痕
     * @param {number} x 
     * @param {number} y 
     */
    addTireTrack(x, y) {
        this.tireTracks.push({
            x: x,
            y: y,
            alpha: 0.85
        });
    }

    /**
     * 粒子與胎痕物理推進
     * @param {number} speed 當前車速
     * @param {number} [dtRatio=1] 幀率時間步進比例
     */
    update(speed, dtRatio = 1) {
        // 更新胎痕下移（隨賽道向後滾動）
        for (let i = 0; i < this.tireTracks.length; i++) {
            this.tireTracks[i].y += speed * 0.6 * dtRatio;
        }
        this.tireTracks = this.tireTracks.filter(t => t.y < CANVAS_HEIGHT);

        // 更新煙霧粒子位置、透明度與尺寸衰退
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dtRatio;
            p.y += p.vy * dtRatio;
            p.alpha -= 0.03 * dtRatio;
            p.size *= Math.pow(0.96, dtRatio);
        }
        this.particles = this.particles.filter(p => p.alpha > 0);
    }

    /**
     * 渲染胎痕與煙霧
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        // 渲染胎痕
        ctx.fillStyle = 'rgba(10, 10, 10, 0.65)';
        for (let i = 0; i < this.tireTracks.length; i++) {
            const t = this.tireTracks[i];
            ctx.fillRect(t.x, t.y, 5, 8);
        }

        // 渲染煙霧粒子
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = `rgba(200, 200, 200, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
