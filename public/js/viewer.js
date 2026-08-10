/**
 * @file 图片查看器
 * @description 管理图片查看器的缩放、平移、双指手势等交互
 */

import { state } from './state.js';
import { $, openModal, closeModal } from './utils.js';
import { AppConfig } from './config.js';

/**
 * 重置图片查看器状态
 * @description 将缩放和偏移恢复到初始值
 */
export function resetViewer() {
    state.viewer.scale = 1;
    state.viewer.translateX = 0;
    state.viewer.translateY = 0;
    applyViewerTransform();
}

/**
 * 应用图片变换效果
 * @description 根据当前缩放和偏移状态更新图片的CSS transform属性
 */
export function applyViewerTransform() {
    const v = state.viewer;
    $('imgViewerImg').style.transform = `translate(${v.translateX}px, ${v.translateY}px) scale(${v.scale})`;
    $('imgViewerZoomLevel').textContent = `${Math.round(v.scale * 100)}%`;
}

/**
 * 打开图片查看器
 * @param {string} src - 图片URL
 */
export function openImgViewer(src) {
    $('imgViewerImg').src = src;
    resetViewer();
    openModal('imgViewer');
}

/**
 * 设置图片查看器缩放比例
 * @param {number} newScale - 新的缩放比例（限制在minScale~maxScale范围内）
 */
export function setViewerScale(newScale) {
    const v = state.viewer;
    v.scale = Math.max(AppConfig.viewer.minScale, Math.min(AppConfig.viewer.maxScale, newScale));
    if (v.scale <= 1) {
        v.translateX = 0;
        v.translateY = 0;
    }
    applyViewerTransform();
}

/**
 * 初始化图片查看器事件绑定
 * @description 绑定缩放按钮、滚轮、拖拽、双指缩放、双击缩放等交互
 */
export function initViewer() {
    // 关闭按钮
    $('imgViewerClose').addEventListener('click', () => closeModal('imgViewer'));

    // 缩放按钮
    $('zoomIn').addEventListener('click', () => setViewerScale(state.viewer.scale + AppConfig.viewer.scaleStep));
    $('zoomOut').addEventListener('click', () => setViewerScale(state.viewer.scale - AppConfig.viewer.scaleStep));
    $('zoomReset').addEventListener('click', resetViewer);

    // 鼠标滚轮缩放
    $('imgViewer').addEventListener('wheel', e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -AppConfig.viewer.scaleStep : AppConfig.viewer.scaleStep;
        setViewerScale(state.viewer.scale + delta);
    });

    // 指针拖动（支持鼠标和触摸）
    $('imgViewerImg').addEventListener('pointerdown', e => {
        const v = state.viewer;
        if (v.isPinching) return;
        if (e.pointerType === 'touch' && e.isPrimary === false) return;
        v.isDragging = true;
        v.startX = e.clientX - v.translateX;
        v.startY = e.clientY - v.translateY;
        $('imgViewerImg').classList.add('dragging');
        $('imgViewerImg').setPointerCapture(e.pointerId);
    });

    $('imgViewerImg').addEventListener('pointermove', e => {
        const v = state.viewer;
        if (!v.isDragging) return;
        v.translateX = e.clientX - v.startX;
        v.translateY = e.clientY - v.startY;
        applyViewerTransform();
    });

    $('imgViewerImg').addEventListener('pointerup', () => {
        state.viewer.isDragging = false;
        $('imgViewerImg').classList.remove('dragging');
    });

    // 双指缩放（触摸设备）
    $('imgViewer').addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const v = state.viewer;
            v.isPinching = true;
            v.isDragging = false;
            const [t1, t2] = [e.touches[0], e.touches[1]];
            v.pinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            v.pinchScale = v.scale;
        }
    });

    $('imgViewer').addEventListener('touchmove', e => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const v = state.viewer;
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            if (v.pinchDist > 0) {
                setViewerScale(v.pinchScale * (dist / v.pinchDist));
            }
        }
    }, { passive: false });

    $('imgViewer').addEventListener('touchend', e => {
        const v = state.viewer;
        if (e.touches.length < 2) {
            v.pinchDist = 0;
            v.isPinching = false;
        }
        if (e.touches.length === 1 && v.scale > 1) {
            v.isDragging = true;
            v.startX = e.touches[0].clientX - v.translateX;
            v.startY = e.touches[0].clientY - v.translateY;
        }
    });

    // 双击缩放切换
    $('imgViewerImg').addEventListener('dblclick', () => {
        if (state.viewer.scale > 1.01) resetViewer();
        else setViewerScale(2);
    });

    // 点击遮罩关闭
    $('imgViewer').addEventListener('click', e => {
        if (e.target.id === 'imgViewer') closeModal('imgViewer');
    });
}
