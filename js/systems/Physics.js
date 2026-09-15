/**
 * js/systems/Physics.js
 * 幾何計算、道路透視與碰撞判定系統
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, ROAD_CONFIG, DRIFT_CONFIG, ENEMY_CONFIG } from '../config.js';

export class Physics {
    /**
     * 給定縱向 Y 座標，計算該高度的賽道中心點、總路寬與左右邊界
     * @param {number} y 
     * @param {number} trackCurve 當前彎度 (-1 ~ 1)
     * @returns {{centerX: number, roadWidth: number, left: number, right: number}}
     */
    static getRoadGeometryAtY(y, trackCurve) {
        const p = Math.max(0, Math.min(1, y / CANVAS_HEIGHT));
        const roadWidthTop = ROAD_CONFIG.ROAD_WIDTH_TOP;
        const roadWidthBottom = ROAD_CONFIG.ROAD_WIDTH_BOTTOM;
        const currentRoadWidth = roadWidthTop + (roadWidthBottom - roadWidthTop) * p;

        // 二次曲線透視偏移 (頂端彎曲最大，底端趨近玩家)
        const curveOffset = Math.pow(1 - p, ROAD_CONFIG.CURVE_POWER) * trackCurve * ROAD_CONFIG.CURVE_OFFSET_MAX;
        const centerX = CANVAS_WIDTH / 2 + curveOffset;

        return {
            centerX,
            roadWidth: currentRoadWidth,
            left: centerX - currentRoadWidth / 2,
            right: centerX + currentRoadWidth / 2
        };
    }

    /**
     * 根據車道索引 (0: 左, 1: 中, 2: 右) 與 Y 座標算出車輛中心 X 座標
     * @param {number} laneIndex 
     * @param {number} y 
     * @param {number} trackCurve 
     * @returns {number}
     */
    static getLaneXAtY(laneIndex, y, trackCurve) {
        const geo = this.getRoadGeometryAtY(y, trackCurve);
        // 0 -> 1/6 (左車道中心), 1 -> 3/6 (中車道中心), 2 -> 5/6 (右車道中心)
        const laneRatio = (laneIndex * 2 + 1) / 6;
        return geo.left + geo.roadWidth * laneRatio;
    }

    /**
     * 精確 AABB 碰撞盒判定
     * @param {{x: number, y: number, width: number, height: number}} rectA 
     * @param {{x: number, y: number, width: number, height: number}} rectB 
     * @param {number} [margin=5] 邊緣寬容度
     * @returns {boolean}
     */
    static checkCollision(rectA, rectB, margin = ENEMY_CONFIG.COLLISION_MARGIN) {
        return (rectA.x + margin < rectB.x + rectB.width - margin) &&
               (rectA.x + rectA.width - margin > rectB.x + margin) &&
               (rectA.y + margin < rectB.y + rectB.height - margin) &&
               (rectA.y + rectA.height - margin > rectB.y + margin);
    }

    /**
     * 計算彎道對車輛產生的離心力
     * @param {number} trackCurve 
     * @param {number} speed 
     * @returns {number}
     */
    static calculateCentrifugalForce(trackCurve, speed) {
        return trackCurve * (speed * DRIFT_CONFIG.CENTRIFUGAL_FACTOR);
    }

    /**
     * 將玩家拘束於賽道左右邊界之內
     * @param {{x: number, y: number, width: number, height: number}} player 
     * @param {number} trackCurve 
     */
    static clampPlayerToRoad(player, trackCurve) {
        const playerRoadGeo = this.getRoadGeometryAtY(player.y + player.height / 2, trackCurve);
        player.x = Math.max(playerRoadGeo.left, Math.min(playerRoadGeo.right - player.width, player.x));
    }
}
