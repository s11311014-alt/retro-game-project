/**
 * js/core/Game.js
 * 遊戲總調度控制器，整合輸入、實體、物理判定、特效與渲染管線
 */

import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    GAME_STATE,
    SPEED_CONFIG,
    DRIFT_CONFIG,
    PLAYER_CONFIG,
    STORAGE_KEY
} from '../config.js';

import { InputHandler } from './InputHandler.js';
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../entities/EnemyManager.js';
import { RoadSystem } from '../systems/RoadSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { Physics } from '../systems/Physics.js';
import { HUD } from '../ui/HUD.js';

export class Game {
    /**
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.input = new InputHandler(canvas);
        this.player = new Player();
        this.enemyManager = new EnemyManager();
        this.roadSystem = new RoadSystem();
        this.particleSystem = new ParticleSystem();

        this.currentState = GAME_STATE.START;
        this.score = 0;
        this.driftScore = 0;
        this.highScore = Number(localStorage.getItem(STORAGE_KEY.HIGH_SCORE)) || 0;

        this.speed = SPEED_CONFIG.BASE_SPEED;
        this.baseSpeed = SPEED_CONFIG.BASE_SPEED;
        this.roadDistance = 0;

        this._setupInput();
        this.init();
    }

    _setupInput() {
        this.input.onAction(() => {
            if (this.currentState === GAME_STATE.START || this.currentState === GAME_STATE.GAMEOVER) {
                this.init();
                this.currentState = GAME_STATE.PLAYING;
            }
        });
    }

    /**
     * 初始化/重置單局遊戲數據
     */
    init() {
        this.score = 0;
        this.driftScore = 0;
        this.speed = SPEED_CONFIG.BASE_SPEED;
        this.baseSpeed = SPEED_CONFIG.BASE_SPEED;
        this.roadDistance = 0;

        // 計算初始中間車道 X 座標並置中玩家
        const initPlayerX = Physics.getLaneXAtY(1, PLAYER_CONFIG.INIT_Y, 0) - this.player.width / 2;
        this.player.reset(initPlayerX);

        this.enemyManager.clear();
        this.particleSystem.clear();
        this.roadSystem.reset();
    }

    /**
     * 遊戲狀態更新（依據幀時間縮放維持精準物理手感）
     * @param {number} [dtRatio=1]
     */
    update(dtRatio = 1) {
        if (this.currentState !== GAME_STATE.PLAYING) return;

        // 1. 更新擬 3D 彎道
        this.roadSystem.update(dtRatio);

        // 2. 獲取使用者輸入
        const isPressLeft = this.input.isSteerLeft();
        const isPressRight = this.input.isSteerRight();
        const isDriftKey = this.input.isHandbrake();

        // 3. 計算目標行駛速度
        let targetSpeed = this.baseSpeed;
        if (this.input.isAccelerating()) {
            targetSpeed = this.baseSpeed * SPEED_CONFIG.ACCEL_MULTIPLIER;
        } else if (this.input.isBraking()) {
            targetSpeed = this.baseSpeed * SPEED_CONFIG.BRAKE_MULTIPLIER;
        }

        const isDrifting = isDriftKey && (isPressLeft || isPressRight);

        // 甩尾減速機制：甩尾時施加額外阻力
        if (isDrifting) {
            targetSpeed *= DRIFT_CONFIG.SPEED_MULTIPLIER;
        }

        // 平滑漸變車速
        this.speed += (targetSpeed - this.speed) * SPEED_CONFIG.SPEED_LERP * dtRatio;

        this.roadDistance += this.speed * dtRatio;
        this.score += this.speed * SPEED_CONFIG.DISTANCE_SCORE_RATE * dtRatio;
        this.baseSpeed += SPEED_CONFIG.BASE_SPEED_ACCEL_RATE * dtRatio;

        // 4. 玩家離心力與轉向物理
        const centrifugalForce = Physics.calculateCentrifugalForce(this.roadSystem.trackCurve, this.speed);
        this.player.applyCentrifugalForce(centrifugalForce, dtRatio);
        this.player.steer(isPressLeft, isPressRight, isDrifting, dtRatio);

        // 5. 甩尾加分與粒子效果生成
        if (this.player.isDrifting) {
            this.driftScore += DRIFT_CONFIG.SCORE_RATE * dtRatio;
            this.score += DRIFT_CONFIG.BASE_SCORE_RATE * dtRatio;

            // 產生兩側輪胎壓痕
            this.particleSystem.addTireTrack(this.player.x + 6, this.player.y + 42);
            this.particleSystem.addTireTrack(this.player.x + this.player.width - 6, this.player.y + 42);

            // 產生兩側排氣煙霧
            this.particleSystem.addSmoke(this.player.x + 4, this.player.y + 45, this.speed);
            this.particleSystem.addSmoke(this.player.x + this.player.width - 4, this.player.y + 45, this.speed);
        }

        // 6. 更新粒子與胎痕
        this.particleSystem.update(this.speed, dtRatio);

        // 7. 限制玩家於賽道範圍內
        Physics.clampPlayerToRoad(this.player, this.roadSystem.trackCurve);

        // 8. 更新敵車集群（防重疊生成、推進、防追撞調控）
        this.enemyManager.update(this.speed, this.roadSystem.trackCurve, dtRatio);

        // 9. 精確碰撞檢查
        if (this.enemyManager.checkCollisionWith(this.player)) {
            this.currentState = GAME_STATE.GAMEOVER;
            if (this.score > this.highScore) {
                this.highScore = Math.floor(this.score);
                localStorage.setItem(STORAGE_KEY.HIGH_SCORE, this.highScore.toString());
            }
        }
    }

    /**
     * 畫面繪製渲染管線
     */
    render() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 繪製動態透視賽道
        this.roadSystem.render(this.ctx, this.roadDistance);

        // 繪製地面胎痕與排氣煙霧
        this.particleSystem.render(this.ctx);

        // 繪製實體（玩家與敵車）
        if (this.currentState === GAME_STATE.PLAYING || this.currentState === GAME_STATE.GAMEOVER) {
            this.enemyManager.render(this.ctx);
            this.player.render(this.ctx);
        }

        // 繪製上方 HUD 與覆蓋層 (START / GAMEOVER)
        HUD.render(this.ctx, this);
    }
}
