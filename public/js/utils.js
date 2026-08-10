/**
 * @file 工具函数库
 * @description Toast提示、弹窗控制、时间格式化、DOM操作等通用工具
 */

/**
 * 获取DOM元素快捷方法
 * @param {string} id - 元素ID
 * @returns {HTMLElement} DOM元素
 */
export const $ = id => document.getElementById(id);

/**
 * 显示Toast提示信息
 * @param {string} message - 要显示的提示文字
 */
export function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

/**
 * 打开指定弹窗
 * @param {string} id - 弹窗元素ID
 */
export function openModal(id) { $(id).classList.add('show'); }

/**
 * 关闭指定弹窗
 * @param {string} id - 弹窗元素ID
 */
export function closeModal(id) { $(id).classList.remove('show'); }

/**
 * 时间戳转日期字符串（MM/DD格式）
 * @param {number} ts - 时间戳（毫秒）
 * @returns {string} 格式化后的日期，如 "08/10"
 */
export function formatDate(ts) {
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 时间戳转时间字符串（HH:MM:SS格式）
 * @param {number} ts - 时间戳（毫秒）
 * @returns {string} 格式化后的时间，如 "14:30:05"
 */
export function formatTime(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * 时间戳转日期时间字符串（MM-DD hh:mm:ss格式）
 * @param {number} ts - 时间戳（毫秒）
 * @returns {string} 格式化后的日期时间，如 "08-10 14:30:05"
 */
export function formatDateTime(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * 时间戳转 datetime-local 输入值格式（YYYY-MM-DDThh:mm:ss）
 * @param {number} ts - 时间戳（毫秒）
 * @returns {string} datetime-local 格式字符串，如 "2026-08-10T14:30:05"
 */
export function toDateTimeLocal(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * 判断时间戳是否属于指定日期
 * @param {number} ts - 时间戳
 * @param {string} dateStr - 日期字符串（MM/DD）
 * @returns {boolean}
 */
export function isDate(ts, dateStr) {
    return formatDate(ts) === dateStr;
}

/**
 * 获取今天的日期字符串
 * @returns {string} 今天的日期，如 "08/10"
 */
export function todayStr() {
    return formatDate(Date.now());
}

/**
 * 创建DOM元素
 * @param {string} tag - 标签名
 * @param {string} [className] - CSS类名
 * @param {string} [text] - 文本内容
 * @returns {HTMLElement}
 */
export function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

/**
 * 创建可点击的DOM元素
 * @param {string} tag - 标签名
 * @param {string} className - CSS类名
 * @param {Function} onClick - 点击事件回调
 * @returns {HTMLElement}
 */
export function createClickable(tag, className, onClick) {
    const el = createEl(tag, className);
    if (onClick) el.addEventListener('click', onClick);
    return el;
}
