/**
 * @file 转盘组件初始化
 * @description 负责 turntable-selection 组件的数据映射、主题配色读取和实例创建
 */

import { TurntableSelection } from '../turntable-selection.mjs';
import { AppConfig, options } from './config.js';
import { turntable, turntableCbs, setTurntable } from './state.js';

/**
 * 根据 options 配置创建 TurntableItem 数组
 * @description 将业务配置（type/label/color）映射为 turntable-selection 所需的数据格式
 * @returns {Array<{label: string, color: string, type: string}>}
 */
export function createTurntableItems() {
    return options.map(opt => ({
        label: opt.label,
        color: opt.color,
        type: opt.type,
    }));
}

/**
 * 从 CSS 变量读取主题相关的配置值
 * @description 读取当前主题下的转盘配色变量，使 Canvas 绘制能响应主题切换
 * @returns {Object} 包含按钮、标签等配色配置的对象
 */
export function getThemeTurntableConfig() {
    const style = getComputedStyle(document.documentElement);
    return {
        button: {
            ...AppConfig.turntable.button,
            fontColor: style.getPropertyValue('--turntable-btn-font').trim() || AppConfig.turntable.button.fontColor,
            backgroundColor: style.getPropertyValue('--turntable-btn-bg').trim() || AppConfig.turntable.button.backgroundColor,
            backgroundEndColor: style.getPropertyValue('--turntable-btn-bg').trim() || AppConfig.turntable.button.backgroundEndColor,
        },
        label: {
            ...AppConfig.turntable.label,
            activeColor: style.getPropertyValue('--turntable-label-active').trim() || AppConfig.turntable.label.activeColor,
            inactiveColor: style.getPropertyValue('--turntable-label-inactive').trim() || AppConfig.turntable.label.inactiveColor,
        },
    };
}

/**
 * 初始化转盘组件
 * @description 使用 turntable-selection 库创建转盘实例，配置交互回调
 *              配色从 CSS 变量读取，确保主题切换时 Canvas 颜色同步更新
 *
 * 交互说明：
 * - 左右滑动超过 swipeThreshold 像素 → 触发旋转动画
 * - 点击中心按钮（+号）→ 触发 select 事件，打开对应的输入弹窗
 */
export function initTurntable() {
    const items = createTurntableItems();
    const cfg = AppConfig.turntable;
    const themeCfg = getThemeTurntableConfig();

    const instance = new TurntableSelection({
        container: '#turntable-container',
        items,
        duration: cfg.duration,
        aspectRatio: cfg.aspectRatio,
        swipeThreshold: cfg.swipeThreshold,
        tapThreshold: cfg.tapThreshold,
        sectorGap: cfg.sectorGap,
        innerRadiusRatio: cfg.innerRadiusRatio,
        label: themeCfg.label,
        button: themeCfg.button,
        onRotate: (data) => {
            console.debug('转盘旋转:', data.direction, '当前:', data.currentItem?.label);
        },
        onSelect: (data) => {
            const option = options.find(o => o.type === data.item.type);
            if (option && turntableCbs.onSelect) {
                turntableCbs.onSelect(option);
            }
        },
    });

    setTurntable(instance);
}

/**
 * 销毁转盘实例
 */
export function destroyTurntable() {
    if (turntable) {
        turntable.destroy?.();
        setTurntable(null);
    }
}
