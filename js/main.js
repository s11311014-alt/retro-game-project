/**
 * js/main.js
 * 應用程式模組進入點：初始化畫布、Game 控制器與啟動 GameLoop
 */

import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element #gameCanvas not found.');
        return;
    }

    const game = new Game(canvas);
    const loop = new GameLoop(
        (dtRatio) => game.update(dtRatio),
        () => game.render()
    );

    loop.start();
});
