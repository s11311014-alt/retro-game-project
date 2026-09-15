/**
 * js/ui/HUD.js
 * 即時得分看板、儀表資訊、甩尾警示與選單覆蓋層繪製模組
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE } from '../config.js';

export class HUD {
    /**
     * 繪製遊戲狀態覆蓋層 (START / GAMEOVER)
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} title 
     * @param {string} subtitle 
     */
    static drawOverlay(ctx, title, subtitle) {
        ctx.fillStyle = 'rgba(11, 12, 16, 0.88)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.fillStyle = '#c5c6c7';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(subtitle, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }

    /**
     * 繪製上方 HUD 資訊面板
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} stateData 
     */
    static renderDashboard(ctx, { score, driftScore, highScore, trackCurve, currentCurveName }) {
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
     * HUD 完整渲染調度
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} game 
     */
    static render(ctx, game) {
        this.renderDashboard(ctx, {
            score: game.score,
            driftScore: game.driftScore,
            highScore: game.highScore,
            trackCurve: game.roadSystem.trackCurve,
            currentCurveName: game.roadSystem.currentCurveName
        });

        if (game.player.isDrifting) {
            this.renderDriftBanner(ctx, game.player.y);
        }

        if (game.currentState === GAME_STATE.START) {
            this.drawOverlay(ctx, 'MICRO RACING PRO', '按下 [空白鍵] 開始飆車');
        } else if (game.currentState === GAME_STATE.GAMEOVER) {
            this.drawOverlay(ctx, 'CRASHED!', '按下 [空白鍵] 重新挑戰');
        }
    }
}
