/**
 * js/config.js
 * 遊戲全域設定、物理常數與規格配置
 */

export const CANVAS_WIDTH = 440;
export const CANVAS_HEIGHT = 640;

export const GAME_STATE = Object.freeze({
    START: 0,
    PLAYING: 1,
    GAMEOVER: 2
});

export const SPEED_CONFIG = Object.freeze({
    BASE_SPEED: 6,
    ACCEL_MULTIPLIER: 1.45,
    BRAKE_MULTIPLIER: 0.55,
    SPEED_LERP: 0.15,
    BASE_SPEED_ACCEL_RATE: 0.0003,
    DISTANCE_SCORE_RATE: 0.05
});

export const DRIFT_CONFIG = Object.freeze({
    SPEED_MULTIPLIER: 0.72,       // 甩尾時速度降低 28%
    SCORE_RATE: 1.5,              // 甩尾加成得分
    BASE_SCORE_RATE: 0.8,         // 甩尾時額外基礎分
    STEER_POWER_NORMAL: 5.0,
    STEER_POWER_DRIFT: 7.5,
    STEER_ANGLE_NORMAL: 0.16,
    STEER_ANGLE_DRIFT: 0.48,
    ANGLE_LERP: 0.22,
    CENTRIFUGAL_FACTOR: 0.38
});

export const ROAD_CONFIG = Object.freeze({
    ROAD_WIDTH_TOP: 180,
    ROAD_WIDTH_BOTTOM: 340,
    CURVE_OFFSET_MAX: 110,
    CURVE_POWER: 2.2,
    CURVE_LERP: 0.025,
    CURVE_CHANGE_INTERVAL: 180,
    SLICES: 80
});

export const PLAYER_CONFIG = Object.freeze({
    WIDTH: 32,
    HEIGHT: 52,
    INIT_Y: 500,
    COLOR: '#ff2e63'
});

export const ENEMY_CONFIG = Object.freeze({
    COLORS: Object.freeze(['#f9ed69', '#00adb5', '#a82ffc', '#ff9a00']),
    SPAWN_CHANCE: 0.05,
    MIN_DISTANCE_SAME_LANE: 220,
    MIN_DISTANCE_ANY_LANE: 120,
    SPEED_RATIO_MIN: 0.6,
    SPEED_RATIO_RANGE: 0.15,
    TAILGATE_MIN_DISTANCE: 120,
    COLLISION_MARGIN: 5
});

export const STORAGE_KEY = Object.freeze({
    HIGH_SCORE: 'micro_racing_v5_hi'
});
