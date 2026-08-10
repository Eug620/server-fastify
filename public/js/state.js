/**
 * @file 全局状态管理
 * @description 管理应用运行时状态，供各模块共享
 */

/** @type {Array<Object>} 当前加载的记录数据 */
export let values = [];

/**
 * 全局应用状态
 * @description 管理当前选中的日期、弹窗状态、图片查看器状态等
 */
export const state = {
    /** 当前选中的日期（格式：MM/DD） */
    selectedDate: null,
    /** 当前弹窗中操作的选项配置 */
    currentOption: null,
    /** 输入弹窗中正在编辑的时间戳 */
    editingTimestamp: null,
    /** 图片查看器交互状态 */
    viewer: {
        scale: 1,
        translateX: 0,
        translateY: 0,
        isDragging: false,
        isPinching: false,
        startX: 0,
        startY: 0,
        pinchDist: 0,
        pinchScale: 1,
    },
};

/** @type {import('../turntable-selection.mjs').TurntableSelection|null} 转盘组件实例 */
export let turntable = null;

/** 转盘事件回调集合 */
export const turntableCbs = {
    /** 选中扇形时的回调 */
    onSelect: null,
};

/**
 * 更新记录数据
 * @param {Array<Object>} newValues - 新的记录数组
 */
export function setValues(newValues) {
    values = newValues;
}

/**
 * 更新转盘实例
 * @param {import('../turntable-selection.mjs').TurntableSelection|null} instance - 转盘实例
 */
export function setTurntable(instance) {
    turntable = instance;
}
