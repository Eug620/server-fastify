/**
 * @file 应用配置与数据定义
 * @description 集中管理可调整的参数和记录类型配置
 */

/**
 * 应用配置对象
 * @description 所有可调整的参数都集中在此处
 */
export const AppConfig = {
    /** 转盘组件配置 */
    turntable: {
        duration: 450,
        swipeThreshold: 30,
        tapThreshold: 15,
        aspectRatio: 0.5,
        sectorGap: 8,
        innerRadiusRatio: 0.52,
        label: {
            radiusRatio: 0.62,
            fontSizeRatio: 0.11,
            activeColor: 'rgba(255,255,255,1)',
            inactiveColor: 'rgba(255,255,255,0.5)',
        },
        button: {
            text: '+',
            radiusRatio: 0.48,
            fontSizeRatio: 0.6,
            fontColor: '#7d7d7f',
            backgroundColor: '#272727',
            backgroundEndColor: '#272727',
            borderColor: 'rgba(0,0,0,0.1)',
            borderWidth: 2,
            hitTolerance: 10,
            shadow: {
                color: 'rgba(0,0,0,0.35)',
                blur: 20,
                offsetY: -6,
            },
        },
    },
    /** 卡片网格配置 */
    grid: {
        columns: 4,
        gap: 12,
    },
    /** 图片查看器配置 */
    viewer: {
        minScale: 0.5,
        maxScale: 5,
        scaleStep: 0.25,
    },
};

/**
 * 记录类型配置
 * @type {Array<{type: string, label: string, color: string, options: Array<{key: string, label: string}>}>}
 */
export const options = [
    { type: 'wn', label: '喂奶', color: 'rgba(255,138,128,0.5)', options: [{ key: 'ml', label: 'ml' }] },
    { type: 'hs', label: '喝水', color: 'rgba(79,165,255,0.5)', options: [{ key: 'ml', label: 'ml' }] },
    { type: 'db', label: '大便', color: 'rgba(139,98,58,0.5)', options: [{ key: 'img', label: 'img' }] },
    { type: 'xb', label: '小便', color: 'rgba(255,206,86,0.5)', options: [{ key: 'img', label: 'img' }] },
    { type: 'sj', label: '睡觉', color: 'rgba(149,117,205,0.5)', options: [{ key: 'h', label: 'h' }] },
];
