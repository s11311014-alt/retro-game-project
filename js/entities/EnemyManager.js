/**
 * js/entities/EnemyManager.js
 * 敵車集群生命週期、防重疊生成演算法與防追撞安全距調控
 */

import { CANVAS_HEIGHT, ENEMY_CONFIG } from '../config.js';
import { Enemy } from './Enemy.js';
import { Physics } from '../systems/Physics.js';

export class EnemyManager {
    constructor() {
        /** @type {Enemy[]} */
        this.enemies = [];
    }

    /**
     * 重設敵車集群
     */
    clear() {
        this.enemies = [];
    }

    /**
     * 執行防重疊生成檢查
     */
    spawn() {
        // 1. 頂端全域安全距檢查：若頂部有任何車輛，暫緩生成
        const hasEnemyNearTop = this.enemies.some(e => e.y < ENEMY_CONFIG.MIN_DISTANCE_ANY_LANE);
        if (hasEnemyNearTop) return;

        // 2. 機率性生成
        if (Math.random() < ENEMY_CONFIG.SPAWN_CHANCE) {
            // 3. 篩選同車道前方車距足夠安全的車道
            const availableLanes = [0, 1, 2].filter(laneIndex => {
                return !this.enemies.some(e => e.lane === laneIndex && e.y < ENEMY_CONFIG.MIN_DISTANCE_SAME_LANE);
            });

            if (availableLanes.length > 0) {
                const selectedLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
                const color = ENEMY_CONFIG.COLORS[Math.floor(Math.random() * ENEMY_CONFIG.COLORS.length)];
                const speedRatio = ENEMY_CONFIG.SPEED_RATIO_MIN + Math.random() * ENEMY_CONFIG.SPEED_RATIO_RANGE;

                const enemy = new Enemy(selectedLane, color, speedRatio, -80);
                this.enemies.push(enemy);
            }
        }
    }

    /**
     * 更新所有敵車位置、防追撞調速、彎道自適應與越界銷毀
     * @param {number} speed 當前玩家/賽道速度
     * @param {number} trackCurve 當前彎度
     * @param {number} [dtRatio=1] 幀率時間步進比例
     */
    update(speed, trackCurve, dtRatio = 1) {
        this.spawn();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // 相對車速前進推進
            const currentEnemySpeed = speed * enemy.speedRatio;
            enemy.y += (speed - currentEnemySpeed) * dtRatio;

            // 【防同車道追撞機制】：若前方同車道有車，自動調節距離不重疊
            for (let j = 0; j < this.enemies.length; j++) {
                if (i !== j && this.enemies[j].lane === enemy.lane) {
                    const other = this.enemies[j];
                    // 如果 enemy 在 other 後方且車距小於安全距離
                    if (enemy.y > other.y && enemy.y - other.y < ENEMY_CONFIG.TAILGATE_MIN_DISTANCE) {
                        enemy.y = other.y + ENEMY_CONFIG.TAILGATE_MIN_DISTANCE;
                    }
                }
            }

            // 根據彎道與車道計算自適應 X 座標與車身偏航姿態角
            const targetX = Physics.getLaneXAtY(enemy.lane, enemy.y + enemy.height / 2, trackCurve) - enemy.width / 2;
            enemy.angle = (targetX - enemy.x) * 0.05;
            enemy.x = targetX;

            // 超出畫布底部銷毀
            if (enemy.y > CANVAS_HEIGHT + 80) {
                this.enemies.splice(i, 1);
            }
        }
    }

    /**
     * 繪製所有敵車
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].render(ctx);
        }
    }

    /**
     * 檢查是否與目標實體發生碰撞
     * @param {import('./Entity.js').Entity} target 
     * @returns {boolean}
     */
    checkCollisionWith(target) {
        return this.enemies.some(enemy => Physics.checkCollision(target, enemy));
    }
}
