/**
 * @file API 接口封装
 * @description 封装所有后端接口调用，统一请求处理
 */

/**
 * 通用请求方法
 * @param {string} url - 请求URL
 * @param {Object|null} options - fetch请求配置（method, headers, body等）
 * @param {string} defaultMsg - 请求失败时的默认错误信息
 * @returns {Promise<any>} 响应数据中的data字段
 * @throws {Error} 当请求失败或返回非0错误码时抛出异常
 */
async function request(url, options, defaultMsg) {
    const res = await fetch(url, options);
    let json;
    try { json = await res.json(); } catch { throw new Error(defaultMsg); }
    if (json.code !== 0) throw new Error(json.message || defaultMsg);
    return json.data;
}

/**
 * API 接口集合
 * @description 封装所有后端接口调用
 */
export const API = {
    /**
     * 获取记录列表
     * @param {string} [date] - 可选，按日期筛选（格式：MM/DD）
     * @returns {Promise<Array<Object>>} 记录列表
     */
    list(date) {
        const url = date ? `/api/records?date=${encodeURIComponent(date)}` : '/api/records';
        return request(url, null, '加载数据失败');
    },

    /**
     * 创建新记录
     * @param {Object} data - 记录数据
     * @param {string} data.type - 记录类型标识符
     * @param {number} data.timestamp - 时间戳
     * @param {string} [data.ml] - 毫升数（喂奶/喝水）
     * @param {string} [data.h] - 小时数（睡觉）
     * @param {string} [data.img] - 图片URL
     * @returns {Promise<Object>} 创建的记录
     */
    create(data) {
        return request('/api/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }, '创建记录失败');
    },

    /**
     * 删除指定记录
     * @param {string} id - 记录ID
     * @returns {Promise<void>}
     */
    remove(id) {
        return request(`/api/records/${id}`, { method: 'DELETE' }, '删除记录失败');
    },

    /**
     * 清空所有记录
     * @returns {Promise<void>}
     */
    clear() {
        return request('/api/records', { method: 'DELETE' }, '清空记录失败');
    },

    /**
     * 上传图片文件
     * @param {File} file - 图片文件对象
     * @returns {Promise<string>} 上传后的图片URL
     */
    async upload(file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        let json;
        try { json = await res.json(); } catch { throw new Error('文件上传失败'); }
        if (json.code !== 0) throw new Error(json.message || '文件上传失败');
        return json.data.url;
    },
};
