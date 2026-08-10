/**
 * @file 表单字段组件
 * @description 创建数值输入、图片上传、时间选择等可复用表单字段
 */

import { state } from './state.js';
import { createEl, formatDateTime, toDateTimeLocal, todayStr } from './utils.js';

/**
 * 创建数值输入字段
 * @description 生成带单位后缀的数字输入框
 * @param {Object} f - 字段配置 { key, label }
 * @returns {HTMLElement} 表单字段容器
 */
export function createNumberField(f) {
    const wrap = createEl('div', 'form-field');
    const inputContainer = createEl('div', 'input-with-unit');
    const input = createEl('input');
    input.type = 'number';
    input.min = '0';
    input.step = 'any';
    input.placeholder = '请输入数值';
    input.dataset.key = f.key;
    const unit = createEl('span', 'input-unit', f.label);
    inputContainer.appendChild(input);
    inputContainer.appendChild(unit);
    wrap.appendChild(inputContainer);
    return wrap;
}

/**
 * 创建图片上传字段
 * @description 生成带上传预览的图片上传区域
 * @param {Object} f - 字段配置 { key, label }
 * @returns {HTMLElement} 表单字段容器
 */
export function createImageField(f) {
    const wrap = createEl('div', 'form-field');
    const uploadArea = createEl('div', 'upload-area');

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'upload-icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>';

    const text = createEl('div', 'upload-text', '点击上传图片');
    const preview = createEl('img', 'form-preview');
    const input = createEl('input');
    input.type = 'file';
    input.accept = 'image/*';

    uploadArea.appendChild(icon);
    uploadArea.appendChild(text);
    uploadArea.appendChild(preview);

    const wrapper = createEl('div', 'upload-wrapper');
    wrapper.appendChild(input);
    wrapper.appendChild(uploadArea);

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        uploadArea.classList.add('has-image');
        uploadArea.innerHTML = '';
        uploadArea.appendChild(preview);
    });

    wrap.appendChild(wrapper);
    return wrap;
}

/**
 * 获取默认时间戳
 * @description 基于当前选中日期 + 当前时间生成时间戳
 *              如果选中日期是今天，则直接用当前时间
 * @returns {number} 时间戳（毫秒）
 */
export function getDefaultTimestamp() {
    const now = new Date();
    const selected = state.selectedDate;
    if (selected && selected !== todayStr()) {
        const [m, d] = selected.split('/').map(Number);
        const ts = new Date(now);
        ts.setMonth(m - 1);
        ts.setDate(d);
        return ts.getTime();
    }
    return now.getTime();
}

/**
 * 创建可编辑的时间字段
 * @description 显示 MM-DD hh:mm:ss 格式的时间文本，点击可修改
 *              修改时使用 datetime-local 控件，确认后恢复显示文本
 *              使用绝对定位避免切换时布局抖动
 * @returns {HTMLElement} 时间字段容器
 */
export function createTimeField() {
    const wrap = createEl('div', 'form-field');
    wrap.style.marginBottom = '12px';

    const editor = createEl('div', 'time-editor');
    editor.style.cssText = 'position:relative;width:100%;min-height:44px;';

    const timeDisplay = createEl('div', 'time-display');
    timeDisplay.style.cssText = 'display:flex;align-items:center;gap:6px;padding:12px 16px;border:1px solid var(--input-border);border-radius:10px;background:var(--input-bg);color:var(--input-text);font-size:15px;cursor:pointer;transition:all 0.25s ease;box-sizing:border-box;width:100%;';

    const editIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    editIcon.setAttribute('viewBox', '0 0 24 24');
    editIcon.setAttribute('fill', 'none');
    editIcon.setAttribute('stroke', 'currentColor');
    editIcon.setAttribute('stroke-width', '2');
    editIcon.setAttribute('stroke-linecap', 'round');
    editIcon.setAttribute('stroke-linejoin', 'round');
    editIcon.style.cssText = 'width:16px;height:16px;opacity:0.6;flex-shrink:0;';
    editIcon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';

    const timeText = createEl('span');
    timeText.style.flex = '1';
    timeText.style.fontVariantNumeric = 'tabular-nums';
    timeText.style.whiteSpace = 'nowrap';
    timeText.textContent = state.editingTimestamp ? formatDateTime(state.editingTimestamp) : '';

    timeDisplay.appendChild(timeText);
    timeDisplay.appendChild(editIcon);

    const dateInput = createEl('input');
    dateInput.type = 'datetime-local';
    dateInput.value = toDateTimeLocal(state.editingTimestamp);
    dateInput.step = 1;
    dateInput.className = 'time-input';
    dateInput.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;padding:12px 16px;border:1px solid var(--accent);border-radius:10px;background:var(--input-bg);color:var(--input-text);font-size:15px;box-sizing:border-box;opacity:0;visibility:hidden;pointer-events:none;transition:opacity 0.15s ease;color-scheme:dark;appearance:textfield;-webkit-appearance:textfield;';

    if (document.documentElement.getAttribute('data-theme') === 'light') {
        dateInput.style.colorScheme = 'light';
    }

    editor.appendChild(timeDisplay);
    editor.appendChild(dateInput);
    wrap.appendChild(editor);

    function enterEdit() {
        timeDisplay.style.opacity = '0';
        timeDisplay.style.pointerEvents = 'none';
        dateInput.style.opacity = '1';
        dateInput.style.visibility = 'visible';
        dateInput.style.pointerEvents = 'auto';
        dateInput.value = toDateTimeLocal(state.editingTimestamp);
        dateInput.focus();
    }

    function exitEdit() {
        timeDisplay.style.opacity = '1';
        timeDisplay.style.pointerEvents = 'auto';
        dateInput.style.opacity = '0';
        dateInput.style.visibility = 'hidden';
        dateInput.style.pointerEvents = 'none';
    }

    timeDisplay.addEventListener('click', () => enterEdit());

    dateInput.addEventListener('change', () => {
        if (dateInput.value) {
            state.editingTimestamp = new Date(dateInput.value).getTime();
            timeText.textContent = formatDateTime(state.editingTimestamp);
        }
        exitEdit();
    });

    dateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') dateInput.blur();
        if (e.key === 'Escape') {
            dateInput.value = toDateTimeLocal(state.editingTimestamp);
            exitEdit();
        }
    });

    dateInput.addEventListener('blur', () => {
        if (dateInput.value) {
            state.editingTimestamp = new Date(dateInput.value).getTime();
            timeText.textContent = formatDateTime(state.editingTimestamp);
        }
        exitEdit();
    });

    return wrap;
}
