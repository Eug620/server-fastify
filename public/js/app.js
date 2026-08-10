/**
 * @file 应用主逻辑
 * @description 数据加载、UI渲染、弹窗交互、应用初始化等核心逻辑
 */

import { AppConfig, options } from './config.js';
import { values, setValues, state, turntableCbs } from './state.js';
import { $, showToast, openModal, closeModal, formatDate, formatTime, isDate, todayStr, createEl, createClickable } from './utils.js';
import { API } from './api.js';
import { ThemeManager } from './theme.js';
import { initTurntable } from './turntable.js';
import { openImgViewer, initViewer } from './viewer.js';
import { createTimeField, createNumberField, createImageField, getDefaultTimestamp } from './components.js';

/**
 * 加载所有记录数据
 * @description 从API获取最新数据，失败时显示错误提示
 * @returns {Promise<void>}
 */
async function loadData() {
    try {
        setValues(await API.list());
    } catch (e) {
        showToast(e.message || '加载数据失败');
        setValues([]);
    }
}

/**
 * 刷新所有界面数据
 * @param {string} [dateStr] - 可选，指定刷新的日期
 * @returns {Promise<void>}
 */
async function refreshAll(dateStr) {
    await loadData();
    if (dateStr) state.selectedDate = dateStr;
    renderDateTabs();
    renderCards();
}

/**
 * 获取所有有记录的日期列表（含今天）
 * @description 从已有记录中提取所有不重复的日期，并按时间倒序排列
 * @returns {string[]} 日期字符串数组，如 ["08/10", "08/09"]
 */
function getAllDates() {
    const dates = new Set([todayStr()]);
    values.forEach(v => dates.add(formatDate(v.timestamp)));
    return Array.from(dates).sort((a, b) => {
        const [ma, da] = a.split('/').map(Number);
        const [mb, db] = b.split('/').map(Number);
        return mb * 100 + db - (ma * 100 + da);
    });
}

/**
 * 渲染日期Tab栏
 * @description 根据所有日期生成可滚动的Tab列表，当前选中日期高亮显示
 */
function renderDateTabs() {
    const dates = getAllDates();
    const list = $('dateTabsList');
    list.innerHTML = '';

    if (!state.selectedDate) state.selectedDate = todayStr();

    dates.forEach(date => {
        const isActive = date === state.selectedDate;
        const tab = createClickable('div', 'date-tab' + (isActive ? ' active' : ''), () => {
            state.selectedDate = date;
            renderDateTabs();
            renderCards();
        });
        tab.textContent = date;
        list.appendChild(tab);
    });

    const activeTab = list.querySelector('.date-tab.active');
    if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

/**
 * 统计指定日期各类型的记录数量
 * @param {string} dateStr - 日期字符串（MM/DD）
 * @returns {Object<string, number>} 各类型的计数，如 { wn: 3, hs: 1, ... }
 */
function getDateCounts(dateStr) {
    const counts = {};
    options.forEach(opt => { counts[opt.type] = 0; });
    values.forEach(v => {
        if (isDate(v.timestamp, dateStr)) {
            counts[v.type] = (counts[v.type] || 0) + 1;
        }
    });
    return counts;
}

/**
 * 渲染卡片网格
 * @description 根据当前选中日期，显示各类型的记录次数卡片
 *              点击卡片可查看该类型的详细记录列表
 */
function renderCards() {
    const dateStr = state.selectedDate || todayStr();
    const counts = getDateCounts(dateStr);
    const list = $('cardList');

    list.style.gridTemplateColumns = `repeat(${AppConfig.grid.columns}, 1fr)`;
    list.innerHTML = '';

    options.forEach(opt => {
        const card = createEl('div', 'card');
        card.style.backgroundColor = opt.color;
        card.innerHTML = `
            <div class="card__title">${opt.label}</div>
            <div class="card__count">${counts[opt.type]} 次</div>
        `;
        card.addEventListener('click', () => openDataList(opt, dateStr));
        list.appendChild(card);
    });
}

/**
 * 获取指定日期和类型的记录列表（按时间升序）
 * @param {string} dateStr - 日期字符串
 * @param {string} type - 记录类型
 * @returns {Array<Object>} 排序后的记录数组
 */
function getDataByType(dateStr, type) {
    return values
        .filter(v => isDate(v.timestamp, dateStr) && v.type === type)
        .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * 打开数据列表弹窗
 * @description 显示指定类型在指定日期的所有记录，支持删除操作
 *              标题显示类型名称，若有 ml/h 字段则显示合计
 * @param {Object} option - 类型配置对象
 * @param {string} dateStr - 当前日期
 */
function openDataList(option, dateStr) {
    const dataList = getDataByType(dateStr, option.type);
    const fields = option.options || [];

    let sumText = '';
    const numberFields = fields.filter(f => f.key === 'ml' || f.key === 'h');
    if (numberFields.length > 0 && dataList.length > 0) {
        const parts = numberFields.map(f => {
            const sum = dataList.reduce((acc, item) => {
                const v = parseFloat(item[f.key]);
                return acc + (isNaN(v) ? 0 : v);
            }, 0);
            const displaySum = sum % 1 === 0 ? sum : parseFloat(sum.toFixed(1));
            return `${displaySum}${f.label}`;
        });
        sumText = ` 合计: ${parts.join(' + ')}`;
    }

    $('listModalTitle').textContent = `${option.label}${sumText}`;

    const content = $('listModalContent');
    content.innerHTML = '';

    if (dataList.length === 0) {
        content.appendChild(createEl('div', 'list-empty', '暂无数据'));
        openModal('listModal');
        return;
    }

    dataList.forEach(item => {
        const row = createEl('div', 'list-item');

        row.appendChild(createEl('div', 'list-item__time', formatTime(item.timestamp)));

        const contentEl = createEl('div', 'list-item__content');
        contentEl.style.flex = '1';
        contentEl.style.marginLeft = '10px';

        fields.forEach(f => {
            if (f.key === 'img') {
                if (item.img) {
                    const img = createEl('img', 'list-item__img');
                    img.src = item.img;
                    img.alt = option.label;
                    img.addEventListener('click', () => openImgViewer(item.img));
                    contentEl.appendChild(img);
                } else {
                    contentEl.appendChild(createEl('div', 'list-item__empty', '暂无图片'));
                }
            } else {
                const val = item[f.key];
                const text = val ? `${val} ${f.label}` : '--';
                contentEl.appendChild(createEl('div', 'list-item__value', text));
            }
        });

        row.appendChild(contentEl);

        const delBtn = createEl('button');
        delBtn.textContent = '删除';
        delBtn.style.cssText = 'background:none;border:none;color:#e74c3c;cursor:pointer;font-size:12px;padding:4px 8px;';
        delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!item.id) { showToast('记录ID缺失'); return; }
            try {
                await API.remove(item.id);
                await refreshAll(dateStr);
                openDataList(option, dateStr);
                showToast('已删除');
            } catch (err) {
                showToast(err.message || '删除失败');
            }
        });
        row.appendChild(delBtn);

        content.appendChild(row);
    });

    openModal('listModal');
}

/**
 * 打开输入弹窗
 * @description 根据选项配置动态生成表单字段并显示
 *              默认使用当前选中日期 + 当前时间作为时间戳
 * @param {Object} option - 选中的类型配置
 */
function openInputDialog(option) {
    state.currentOption = option;
    state.editingTimestamp = getDefaultTimestamp();
    $('inputModalTitle').textContent = option.label;
    const body = $('inputModalBody');
    body.innerHTML = '';

    body.appendChild(createTimeField());

    (option.options || []).forEach(f => {
        body.appendChild(f.key === 'img' ? createImageField(f) : createNumberField(f));
    });
    openModal('inputModal');
}

/**
 * 关闭输入弹窗
 */
function closeInputDialog() {
    closeModal('inputModal');
    state.currentOption = null;
    state.editingTimestamp = null;
}

/**
 * 提交输入表单
 * @description 收集表单数据，上传图片，调用API创建记录
 *              使用编辑中的时间戳（默认为当前选中日期 + 当前时间）
 * @returns {Promise<void>}
 */
async function submitInput() {
    const opt = state.currentOption;
    if (!opt) return;

    const ts = state.editingTimestamp || Date.now();
    const record = { type: opt.type, ml: '', img: '', h: '', timestamp: ts };

    for (const f of (opt.options || [])) {
        if (f.key === 'img') {
            const fileInput = $('inputModalBody').querySelector('input[type="file"]');
            if (fileInput && fileInput.files[0]) {
                try {
                    record.img = await API.upload(fileInput.files[0]);
                } catch (e) {
                    showToast(e.message || '图片上传失败');
                    return;
                }
            }
        } else {
            const input = $('inputModalBody').querySelector(`input[data-key="${f.key}"]`);
            record[f.key] = input ? input.value : '';
        }
    }

    try {
        await API.create(record);
        closeInputDialog();
        const recordDate = formatDate(ts);
        await refreshAll(recordDate);
        showToast(`已记录: ${opt.label}`);
    } catch (e) {
        showToast(e.message || '保存失败，请重试');
        console.error(e);
    }
}

/**
 * 初始化所有事件绑定
 * @description 将弹窗、按钮等DOM事件统一在此绑定
 */
function bindEvents() {
    // 输入弹窗事件
    $('inputModalCancel').addEventListener('click', closeInputDialog);
    $('inputModalConfirm').addEventListener('click', submitInput);

    // 列表弹窗事件
    $('listModalClose').addEventListener('click', () => closeModal('listModal'));
    $('listModal').addEventListener('click', e => {
        if (e.target.id === 'listModal') closeModal('listModal');
    });
}

/**
 * 应用初始化入口
 * @description 初始化主题 → 加载数据 → 渲染UI → 初始化转盘
 * @returns {Promise<void>}
 */
async function init() {
    ThemeManager.init();

    // 设置转盘回调
    turntableCbs.onSelect = openInputDialog;

    await loadData();
    renderDateTabs();
    renderCards();
    initViewer();
    initTurntable();
    bindEvents();
}

init();
