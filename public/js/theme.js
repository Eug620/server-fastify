/**
 * @file 主题管理模块
 * @description 负责日间/夜间模式的切换、持久化存储和系统偏好检测
 *
 * 实现方案：
 * - 使用两个独立的CSS文件（dark.css / light.css）定义主题变量
 * - 通过 data-theme 属性标记当前主题
 * - 优先读取用户存储的偏好，其次跟随系统设置
 */

import { turntable } from './state.js';
import { destroyTurntable, initTurntable } from './turntable.js';
import { $ } from './utils.js';

export const ThemeManager = {
    /** localStorage 存储键名 */
    STORAGE_KEY: 'baby-app-theme',

    /**
     * 初始化主题
     * @description 页面加载时调用，确定初始主题并应用
     */
    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        const theme = saved || (prefersLight ? 'light' : 'dark');
        this.apply(theme, false);
        this.bindToggle();
    },

    /**
     * 应用指定主题
     * @param {'dark'|'light'} theme - 目标主题
     * @param {boolean} animate - 是否显示过渡动画
     */
    apply(theme, animate = true) {
        const html = document.documentElement;

        if (animate) {
            html.classList.add('theme-transition');
            setTimeout(() => html.classList.remove('theme-transition'), 350);
        }

        if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else {
            html.removeAttribute('data-theme');
        }

        localStorage.setItem(this.STORAGE_KEY, theme);
        // 重新创建转盘以应用新主题的Canvas配色
        if (turntable) {
            destroyTurntable();
            initTurntable();
        }
    },

    /**
     * 切换主题
     */
    toggle() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        this.apply(current === 'dark' ? 'light' : 'dark', true);
    },

    /**
     * 绑定切换按钮事件
     */
    bindToggle() {
        $('themeToggle').addEventListener('click', () => this.toggle());
    },
};
