/**
 * js/systems/RoadSystem.js
 * 動態擬 3D 賽道渲染、彎道演算法與賽道紋理系統
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_CONFIG } from '../config.js';
import { Physics } from './Physics.js';

export class RoadSystem {
    constructor() {
        this.trackCurve = 0;         // 當前賽道彎曲度 (-1.6 ~ 1.6)
        this.targetCurve = 0;        // 下一個彎道目標彎曲度
        this.curveChangeTimer = 0;
        this.currentCurveName = 'STRAIGHT';
    }

    /**
     * 重設彎道狀態
     */
    reset() {
        this.trackCurve = 0;
        this.targetCurve = 0;
        this.curveChangeTimer = 0;
        this.currentCurveName = 'STRAIGHT';
    }

    /**
     * 更新彎道狀態與平滑插值
     * @param {number} [dtRatio=1] 幀率時間步進比例
     */
    update(dtRatio = 1) {
        this.curveChangeTimer += dtRatio;

        if (this.curveChangeTimer > ROAD_CONFIG.CURVE_CHANGE_INTERVAL) {
            const rand = Math.random();
            if (rand < 0.35) {
                this.targetCurve = 1.6;
                this.currentCurveName = 'HARD RIGHT >';
            } else if (rand < 0.70) {
                this.targetCurve = -1.6;
                this.currentCurveName = '< HARD LEFT';
            } else {
                this.targetCurve = 0;
                this.currentCurveName = 'STRAIGHT';
            }
            this.curveChangeTimer = 0;
        }

        // 平滑漸變逼近目標彎度
        this.trackCurve += (this.targetCurve - this.trackCurve) * ROAD_CONFIG.CURVE_LERP * dtRatio;
    }

    /**
     * 繪製動態透視賽道（包含草地交錯條紋、紅白路肩石、雙車道虛線）
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} roadDistance 累計行駛距離
     */
    render(ctx, roadDistance) {
        ctx.fillStyle = '#1b262c';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const slices = ROAD_CONFIG.SLICES;
        const sliceHeight = CANVAS_HEIGHT / slices;

        for (let i = 0; i < slices; i++) {
            const y = i * sliceHeight;
            const geo = Physics.getRoadGeometryAtY(y, this.trackCurve);

            const p = i / slices;
            const stripePeriod = Math.sin((roadDistance * 0.15) - (p * 12));
            const isRedStripe = stripePeriod > 0;

            // 草地底色（深綠交錯）
            ctx.fillStyle = (i % 2 === 0) ? '#112d25' : '#0e241e';
            ctx.fillRect(0, y, CANVAS_WIDTH, sliceHeight + 1);

            // 紅白路肩石 (Curbs)
            const curbWidth = 12 * (0.5 + 0.5 * p);
            ctx.fillStyle = isRedStripe ? '#e63946' : '#f1faee';
            ctx.fillRect(geo.left - curbWidth, y, curbWidth, sliceHeight + 1);
            ctx.fillRect(geo.right, y, curbWidth, sliceHeight + 1);

            // 柏油路面（暗灰交錯）
            ctx.fillStyle = (i % 2 === 0) ? '#222831' : '#2d3748';
            ctx.fillRect(geo.left, y, geo.roadWidth, sliceHeight + 1);

            // 車道中央白色虛線
            if (Math.abs(stripePeriod) > 0.3) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                const dashWidth = 4 * (0.6 + 0.4 * p);
                const lane1X = geo.left + geo.roadWidth * (1 / 3);
                const lane2X = geo.left + geo.roadWidth * (2 / 3);
                ctx.fillRect(lane1X - dashWidth / 2, y, dashWidth, sliceHeight + 1);
                ctx.fillRect(lane2X - dashWidth / 2, y, dashWidth, sliceHeight + 1);
            }
        }
    }
}
