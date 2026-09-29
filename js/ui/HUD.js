/**
 * js/ui/HUD.js
 * 即時得分看板、儀表資訊、甩尾警示、賽博龐克遊戲封面與 Game Over 介面
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE } from '../config.js';

export class HUD {
    /**
     * 繪製上方 HUD 資訊面板
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} stateData 
     */
    static renderDashboard(ctx, { score, driftScore, highScore, trackCurve, currentCurveName, isMuted }) {
        // 半透明背景框
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(10, 10, CANVAS_WIDTH - 20, 50);
        ctx.strokeStyle = '#45a29e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, 50);

        // 即時得分 (SCORE)
        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${Math.floor(score)}`, 22, 32);

        // 甩尾得分 (DRIFT)
        ctx.fillStyle = '#ff2e63';
        ctx.fillText(`DRIFT: ${Math.floor(driftScore)}`, 22, 50);

        // 音樂/音效狀態徽章 (MUTE)
        const soundLabel = isMuted ? '🔇 [M] 靜音中' : '🔊 [M] SOUND: ON';
        ctx.fillStyle = isMuted ? '#ff2e63' : '#66fcf1';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(soundLabel, CANVAS_WIDTH / 2, 40);

        // 歷史最高分 (HI)
        ctx.fillStyle = '#f9ed69';
        ctx.textAlign = 'right';
        ctx.fillText(`HI: ${Math.floor(highScore)}`, CANVAS_WIDTH - 22, 32);

        // 彎道指示標籤
        ctx.fillStyle = trackCurve > 0.5 ? '#ff2e63' : trackCurve < -0.5 ? '#ff2e63' : '#a82ffc';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText(currentCurveName, CANVAS_WIDTH - 22, 50);
    }

    /**
     * 繪製甩尾發動中浮動提示
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} playerY 
     */
    static renderDriftBanner(ctx, playerY) {
        ctx.fillStyle = '#ff2e63';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ DRIFT (SLOW) ⚡', CANVAS_WIDTH / 2, playerY - 15);
    }

    /**
     * 繪製精美賽博龐克遊戲封面 (Start Cover)
     * @param {CanvasRenderingContext2D} ctx 
     */
    static drawStartCover(ctx) {
        ctx.save();

        // 1. 深色未來漸變背景
        const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bg.addColorStop(0, '#0a0d14');
        bg.addColorStop(0.45, '#131c28');
        bg.addColorStop(1, '#080a10');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. 透視格線地平線效果
        ctx.strokeStyle = 'rgba(69, 162, 158, 0.2)';
        ctx.lineWidth = 1;
        const horizonY = 240;
        for (let i = 0; i <= CANVAS_WIDTH; i += 40) {
            ctx.beginPath();
            ctx.moveTo(CANVAS_WIDTH / 2, horizonY);
            ctx.lineTo(i, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = horizonY + 20; y < CANVAS_HEIGHT; y += 35) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        // 3. 遊戲主標題 (MICRO RACING) 霓虹光暈
        ctx.shadowColor = '#66fcf1';
        ctx.shadowBlur = 22;
        ctx.fillStyle = '#66fcf1';
        ctx.font = '900 38px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MICRO RACING', CANVAS_WIDTH / 2, 85);

        // 副標題徽章 (PRO DRIFT EDITION)
        ctx.shadowColor = '#ff2e63';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ff2e63';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 110, 105, 220, 26);
        ctx.fillStyle = '#ff2e63';
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.fillText('⚡ TURBO DRIFT EDITION ⚡', CANVAS_WIDTH / 2, 123);
        ctx.shadowBlur = 0; // 重設光暈

        // 4. 封面主角賽車 (大尺寸立體繪製)
        const carX = CANVAS_WIDTH / 2;
        const carY = 250;
        const carW = 54;
        const carH = 92;

        // 車前大燈燈光投射
        const beamLeft = ctx.createLinearGradient(carX - 18, carY, carX - 35, carY - 80);
        beamLeft.addColorStop(0, 'rgba(0, 255, 245, 0.45)');
        beamLeft.addColorStop(1, 'rgba(0, 255, 245, 0)');
        ctx.fillStyle = beamLeft;
        ctx.beginPath();
        ctx.moveTo(carX - 22, carY - carH / 2);
        ctx.lineTo(carX - 55, carY - carH / 2 - 70);
        ctx.lineTo(carX - 10, carY - carH / 2 - 70);
        ctx.closePath();
        ctx.fill();

        const beamRight = ctx.createLinearGradient(carX + 18, carY, carX + 35, carY - 80);
        beamRight.addColorStop(0, 'rgba(0, 255, 245, 0.45)');
        beamRight.addColorStop(1, 'rgba(0, 255, 245, 0)');
        ctx.fillStyle = beamRight;
        ctx.beginPath();
        ctx.moveTo(carX + 22, carY - carH / 2);
        ctx.lineTo(carX + 10, carY - carH / 2 - 70);
        ctx.lineTo(carX + 55, carY - carH / 2 - 70);
        ctx.closePath();
        ctx.fill();

        // 車底霓虹燈
        ctx.fillStyle = 'rgba(255, 46, 99, 0.45)';
        ctx.fillRect(carX - carW / 2 - 4, carY - carH / 2 - 4, carW + 8, carH + 8);

        // 四顆輪胎
        ctx.fillStyle = '#111';
        ctx.fillRect(carX - carW / 2 - 4, carY - carH / 2 + 10, 10, 20);
        ctx.fillRect(carX + carW / 2 - 6, carY - carH / 2 + 10, 10, 20);
        ctx.fillRect(carX - carW / 2 - 4, carY + carH / 2 - 30, 10, 20);
        ctx.fillRect(carX + carW / 2 - 6, carY + carH / 2 - 30, 10, 20);

        // 主車身 (經典紅)
        ctx.fillStyle = '#ff2e63';
        ctx.fillRect(carX - carW / 2 + 5, carY - carH / 2, carW - 10, carH);

        // 競速白線條紋
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(carX - 3, carY - carH / 2, 6, carH);

        // 車頂與前擋風玻璃
        ctx.fillStyle = '#1f2833';
        ctx.fillRect(carX - carW / 2 + 9, carY - carH / 2 + 20, carW - 18, 18);
        ctx.fillStyle = '#00fff5';
        ctx.fillRect(carX - carW / 2 + 12, carY - carH / 2 + 24, carW - 24, 10);

        // 前大燈
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(carX - carW / 2 + 8, carY - carH / 2, 8, 4);
        ctx.fillRect(carX + carW / 2 - 16, carY - carH / 2, 8, 4);

        // 5. 呼吸閃爍按鈕 (▶ 按下 [空白鍵] 開始 ◀)
        const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 220);
        ctx.fillStyle = 'rgba(21, 31, 45, 0.9)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 140, 360, 280, 48);
        ctx.strokeStyle = `rgba(102, 252, 241, ${pulse})`;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 140, 360, 280, 48);

        ctx.fillStyle = `rgba(102, 252, 241, ${pulse})`;
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText('▶ 按下 [空白鍵] 啟程 ◀', CANVAS_WIDTH / 2, 391);

        // 6. 操作說明卡片
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(35, 435, CANVAS_WIDTH - 70, 95);
        ctx.strokeStyle = 'rgba(69, 162, 158, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(35, 435, CANVAS_WIDTH - 70, 95);

        ctx.fillStyle = '#f9ed69';
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.fillText('【 操作手冊 】', CANVAS_WIDTH / 2, 458);

        ctx.fillStyle = '#c5c6c7';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('[A / D] 轉向方向盤  |  [W / S] 油門 / 煞車', CANVAS_WIDTH / 2, 482);
        ctx.fillText('[Shift / 空白] 甩尾累積高分  |  [M] 音效開關', CANVAS_WIDTH / 2, 508);

        // 7. 右下角作者署名 (作者: 郭人華)
        ctx.shadowColor = '#66fcf1';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('作者: 郭人華', CANVAS_WIDTH - 20, CANVAS_HEIGHT - 22);

        ctx.restore();
    }

    /**
     * 繪製 Game Over 結算介面
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} score 
     * @param {number} highScore 
     */
    static drawGameOver(ctx, score, highScore) {
        ctx.save();
        ctx.fillStyle = 'rgba(11, 12, 16, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 爆烈 CRASHED 標題
        ctx.shadowColor = '#ff2e63';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#ff2e63';
        ctx.font = '900 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('💥 CRASHED! 💥', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);

        // 成績結算框
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(31, 40, 51, 0.85)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2 - 35, 240, 75);
        ctx.strokeStyle = '#45a29e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2 - 35, 240, 75);

        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 17px "Courier New", monospace';
        ctx.fillText(`本次得分: ${Math.floor(score)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

        ctx.fillStyle = '#f9ed69';
        ctx.fillText(`最高紀錄: ${Math.floor(highScore)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

        // 重新挑戰提示 (呼吸動態)
        const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 200);
        ctx.fillStyle = `rgba(102, 252, 241, ${pulse})`;
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText('按下 [空白鍵] 或點擊重新挑戰', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);

        // 右下角作者署名
        ctx.shadowColor = '#66fcf1';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 15px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('作者: 郭人華', CANVAS_WIDTH - 20, CANVAS_HEIGHT - 22);

        ctx.restore();
    }

    /**
     * HUD 完整渲染調度
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} game 
     */
    static render(ctx, game) {
        if (game.currentState === GAME_STATE.PLAYING) {
            this.renderDashboard(ctx, {
                score: game.score,
                driftScore: game.driftScore,
                highScore: game.highScore,
                trackCurve: game.roadSystem.trackCurve,
                currentCurveName: game.roadSystem.currentCurveName,
                isMuted: game.soundSystem ? game.soundSystem.isMuted : false
            });

            if (game.player.isDrifting) {
                this.renderDriftBanner(ctx, game.player.y);
            }
        } else if (game.currentState === GAME_STATE.START) {
            this.drawStartCover(ctx);
        } else if (game.currentState === GAME_STATE.GAMEOVER) {
            this.drawGameOver(ctx, game.score, game.highScore);
        }
    }
}
