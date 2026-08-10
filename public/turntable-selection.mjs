// turntable-selection v1.0.0
// A turntable selection library

// src/constants.ts
var HALF_PI = Math.PI / 2;
var TAU = Math.PI * 2;
var easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
var DEFAULT_SHADOW = {
  color: "rgba(0, 0, 0, 0.35)",
  blur: 20,
  offsetX: 0,
  offsetY: -6
};
var DEFAULT_BUTTON_CONFIG = {
  text: "+",
  radiusRatio: 0.48,
  fontSizeRatio: 0.6,
  fontColor: "#7d7d7f",
  backgroundColor: "#272727",
  backgroundEndColor: "#272727",
  borderColor: "rgba(0, 0, 0, 0.1)",
  borderWidth: 2,
  shadow: DEFAULT_SHADOW,
  hitTolerance: 10
};
var DEFAULT_LABEL_CONFIG = {
  radiusRatio: 0.62,
  fontSizeRatio: 0.11,
  activeColor: "rgba(255, 255, 255, 1)",
  inactiveColor: "rgba(255, 255, 255, 0.5)"
};
var BASE_DEFAULTS = {
  /** 旋转动画时长 (ms) */
  duration: 450,
  /** 高宽比，容器无高度时使用 */
  aspectRatio: 0.5,
  /** 滑动识别阈值 (px) */
  swipeThreshold: 30,
  /** 点击识别阈值 (px) */
  tapThreshold: 15,
  /** 扇区间距 (px) */
  sectorGap: 8,
  /** 内圈半径比例 */
  innerRadiusRatio: 0.52
};
function resolveDefaults(options) {
  return {
    duration: options.duration ?? BASE_DEFAULTS.duration,
    aspectRatio: options.aspectRatio ?? BASE_DEFAULTS.aspectRatio,
    swipeThreshold: options.swipeThreshold ?? BASE_DEFAULTS.swipeThreshold,
    tapThreshold: options.tapThreshold ?? BASE_DEFAULTS.tapThreshold,
    sectorGap: options.sectorGap ?? BASE_DEFAULTS.sectorGap,
    innerRadiusRatio: options.innerRadiusRatio ?? BASE_DEFAULTS.innerRadiusRatio,
    labelConfig: {
      radiusRatio: options.label?.radiusRatio ?? DEFAULT_LABEL_CONFIG.radiusRatio,
      fontSizeRatio: options.label?.fontSizeRatio ?? DEFAULT_LABEL_CONFIG.fontSizeRatio,
      activeColor: options.label?.activeColor ?? DEFAULT_LABEL_CONFIG.activeColor,
      inactiveColor: options.label?.inactiveColor ?? DEFAULT_LABEL_CONFIG.inactiveColor
    },
    buttonConfig: {
      text: options.button?.text ?? DEFAULT_BUTTON_CONFIG.text,
      radiusRatio: options.button?.radiusRatio ?? DEFAULT_BUTTON_CONFIG.radiusRatio,
      fontSizeRatio: options.button?.fontSizeRatio ?? DEFAULT_BUTTON_CONFIG.fontSizeRatio,
      fontColor: options.button?.fontColor ?? DEFAULT_BUTTON_CONFIG.fontColor,
      backgroundColor: options.button?.backgroundColor ?? DEFAULT_BUTTON_CONFIG.backgroundColor,
      backgroundEndColor: options.button?.backgroundEndColor ?? DEFAULT_BUTTON_CONFIG.backgroundEndColor,
      borderColor: options.button?.borderColor ?? DEFAULT_BUTTON_CONFIG.borderColor,
      borderWidth: options.button?.borderWidth ?? DEFAULT_BUTTON_CONFIG.borderWidth,
      shadow: options.button?.shadow ? { ...DEFAULT_BUTTON_CONFIG.shadow, ...options.button.shadow } : { ...DEFAULT_BUTTON_CONFIG.shadow },
      hitTolerance: options.button?.hitTolerance ?? DEFAULT_BUTTON_CONFIG.hitTolerance
    }
  };
}

// src/drawing.ts
function drawSectorArc(ctx, cx, cy, outerR, startAngle, endAngle, innerR, gap) {
  const isRing = innerR > 1;
  const effectiveInnerR = isRing ? innerR : 0;
  const outerHalfAngle = gap / outerR / 2;
  const innerHalfAngle = isRing ? gap / effectiveInnerR / 2 : 0;
  const outerStart = startAngle + outerHalfAngle;
  const outerEnd = endAngle - outerHalfAngle;
  const angleDiff = outerEnd - outerStart;
  if (angleDiff <= 0) return;
  ctx.beginPath();
  if (isRing) {
    const innerStart = startAngle + innerHalfAngle;
    const innerEnd = endAngle - innerHalfAngle;
    ctx.arc(cx, cy, outerR, outerStart, outerEnd, false);
    ctx.lineTo(cx + Math.cos(innerEnd) * effectiveInnerR, cy + Math.sin(innerEnd) * effectiveInnerR);
    ctx.arc(cx, cy, effectiveInnerR, innerEnd, innerStart, true);
    ctx.closePath();
  } else {
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, outerStart, outerEnd, false);
    ctx.closePath();
  }
}
function drawSectorLabel(ctx, startAngle, label, isActive, state, itemsCount, labelConf) {
  const { radius, centerX, centerY } = state;
  const sectorAngle = TAU / itemsCount;
  const midAngle = startAngle + sectorAngle / 2;
  const r = radius * labelConf.radiusRatio;
  const tx = centerX + Math.cos(midAngle) * r;
  const ty = centerY + Math.sin(midAngle) * r - radius * labelConf.fontSizeRatio;
  const fontSize = Math.round(radius * labelConf.fontSizeRatio);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.fillStyle = isActive ? labelConf.activeColor : labelConf.inactiveColor;
  ctx.fillText(label, tx, ty);
}
function drawSemicircleButton(ctx, state, btnConf) {
  const { centerX: cx, centerY: cy, radius } = state;
  const br = radius * btnConf.radiusRatio;
  state.btnRadius = br;
  const shadow = btnConf.shadow;
  ctx.save();
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetX = shadow.offsetX ?? 0;
  ctx.shadowOffsetY = shadow.offsetY ?? 0;
  ctx.beginPath();
  ctx.arc(cx, cy, br, Math.PI, TAU, false);
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx - br, cy - br, cx + br, cy);
  grad.addColorStop(0, btnConf.backgroundColor);
  grad.addColorStop(1, btnConf.backgroundEndColor);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = btnConf.borderWidth;
  ctx.strokeStyle = btnConf.borderColor;
  ctx.beginPath();
  ctx.arc(cx, cy, br, Math.PI, TAU, false);
  ctx.stroke();
  const fontSize = Math.round(br * btnConf.fontSizeRatio);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = btnConf.fontColor;
  ctx.fillText(btnConf.text, cx, cy - br * 0.35);
}
function drawTurntable(ctx, canvas, state, items, highlightIndex, labelConf, btnConf, sectorGap, innerRatio) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (items.length === 0) {
    drawSemicircleButton(ctx, state, btnConf);
    return;
  }
  const sectorCount = items.length;
  const sectorAngle = TAU / sectorCount;
  const innerR = state.radius * innerRatio;
  for (let i = 0; i < sectorCount; i++) {
    const start = (i - 0.5) * sectorAngle - HALF_PI + state.rotation;
    const end = start + sectorAngle;
    drawSectorArc(ctx, state.centerX, state.centerY, state.radius, start, end, innerR, sectorGap);
    ctx.fillStyle = items[i].color;
    ctx.fill();
    drawSectorLabel(ctx, start, items[i].label, i === highlightIndex, state, sectorCount, labelConf);
  }
  drawSemicircleButton(ctx, state, btnConf);
}

// src/utils.ts
function findElement(selector) {
  const el = document.querySelector(selector);
  if (el) return el;
  return document.getElementById(selector);
}
function createCanvasIn(container) {
  const existing = container.querySelector("canvas");
  if (existing) existing.remove();
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none";
  canvas.style.userSelect = "none";
  container.appendChild(canvas);
  return canvas;
}
function setupCanvasSize(canvas, width, height, ctx, dpr = window.devicePixelRatio || 1) {
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}
function clientToCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}
function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
function isPointInCircle(point, center, radius) {
  return distance(point, center) <= radius;
}
function normalizeIndex(index, count) {
  if (count === 0) return 0;
  return (index % count + count) % count;
}
function removeItem(arr, item) {
  const idx = arr.indexOf(item);
  if (idx > -1) {
    arr.splice(idx, 1);
    return true;
  }
  return false;
}
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// src/events.ts
var EventEmitter = class {
  constructor() {
    /** 事件名到回调函数数组的映射 */
    this.listeners = {};
  }
  /**
   * 注册事件监听器。
   * 同一回调函数可以被多次注册，触发时会按注册顺序依次调用。
   *
   * @param event    - 事件名
   * @param callback - 回调函数
   */
  on(event, callback) {
    const arr = this.listeners[event] ?? [];
    arr.push(callback);
    this.listeners[event] = arr;
  }
  /**
   * 移除事件监听器。
   * 仅移除与 callback 引用相等的监听器。
   *
   * @param event    - 事件名
   * @param callback - 要移除的回调函数
   */
  off(event, callback) {
    const arr = this.listeners[event];
    if (arr) {
      removeItem(arr, callback);
    }
  }
  /**
   * 触发事件，通知所有已注册的监听器。
   * 每个监听器的异常会被捕获并打印到控制台，不影响其他监听器的执行。
   *
   * @param event - 事件名
   * @param args  - 传递给回调的参数
   */
  emit(event, ...args) {
    const arr = this.listeners[event];
    if (!arr || arr.length === 0) return;
    const snapshot = [...arr];
    snapshot.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        console.error(`[EventEmitter] Error in "${event}" listener:`, e);
      }
    });
  }
  /**
   * 清除所有指定事件的监听器，或清除全部监听器。
   *
   * @param event - 要清除的事件名，省略则清除所有事件
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners[event] = [];
    } else {
      this.listeners = {};
    }
  }
  /**
   * 获取指定事件当前的监听器数量。
   *
   * @param event - 事件名
   * @returns       监听器数量
   */
  listenerCount(event) {
    return this.listeners[event]?.length ?? 0;
  }
};

// index.ts
var TurntableSelection = class {
  // ── 构造函数 ──────────────────────────────────────────────
  constructor(options = {}) {
    // ── DOM 引用 ──────────────────────────────────────────────
    /** 容器元素 */
    this.container = null;
    /** canvas 元素 */
    this.canvas = null;
    /** Canvas 2D 上下文 */
    this.ctx = null;
    // ── 回调引用 (用于清理) ───────────────────────────────────
    /** window resize 防抖回调 */
    this.boundResize = null;
    /** DOMContentLoaded 等待回调 */
    this.onContainerFound = null;
    /**
     * requestAnimationFrame 回调，执行旋转动画的每帧更新。
     * 使用 easeOutCubic 缓动函数。
     */
    this.animationTick = (ts) => {
      if (!this.ctx || this.items.length === 0) return;
      if (this.state.animStart === null) {
        this.state.animStart = ts;
      }
      const t = Math.min((ts - this.state.animStart) / this.duration, 1);
      const sectorAngle = Math.PI * 2 / this.items.length;
      this.state.rotation = this.state.animFrom + (-this.state.activeIndex * sectorAngle - this.state.animFrom) * easeOutCubic(t);
      this.draw();
      if (t < 1) {
        requestAnimationFrame(this.animationTick);
      } else {
        this.state.rotation = -this.state.activeIndex * sectorAngle;
        this.state.animating = false;
      }
    };
    const resolved = resolveDefaults(options);
    this.items = options.items ?? [];
    this.duration = resolved.duration;
    this.aspectRatio = resolved.aspectRatio;
    this.swipeThreshold = resolved.swipeThreshold;
    this.tapThreshold = resolved.tapThreshold;
    this.sectorGap = resolved.sectorGap;
    this.innerRadiusRatio = resolved.innerRadiusRatio;
    this.labelConfig = resolved.labelConfig;
    this.buttonConfig = resolved.buttonConfig;
    this.state = {
      centerX: 0,
      centerY: 0,
      radius: 0,
      btnRadius: 0,
      activeIndex: 0,
      rotation: 0,
      animFrom: 0,
      animStart: null,
      animating: false,
      startX: 0,
      startY: 0,
      tracking: false,
      resizeTimer: null
    };
    this.emitter = new EventEmitter();
    if (options.onRotate) this.on("rotate", options.onRotate);
    if (options.onSelect) this.on("select", options.onSelect);
    if (options.container) {
      this.setContainer(options.container);
    }
  }
  on(event, callback) {
    this.emitter.on(event, callback);
  }
  off(event, callback) {
    this.emitter.off(event, callback);
  }
  /**
   * 触发 rotate 事件 (内部使用)。
   */
  emitRotate(data) {
    this.emitter.emit("rotate", data);
  }
  /**
   * 触发 select 事件 (内部使用)。
   */
  emitSelect(data) {
    this.emitter.emit("select", data);
  }
  // ── 容器管理 ──────────────────────────────────────────────
  /**
   * 设置或切换容器。
   * 如果传入字符串，则通过 CSS 选择器或 ID 查找元素；
   * 如果传入 HTMLElement，则直接使用。
   * 如果容器尚未就绪，会自动等待 DOMContentLoaded。
   *
   * @param container - CSS 选择器、元素 ID 或 HTMLElement
   */
  setContainer(container) {
    if (typeof container === "string") {
      const el = findElement(container);
      if (el) {
        this.mountCanvas(el);
      } else {
        this.waitForContainer(container);
      }
    } else {
      this.mountCanvas(container);
    }
  }
  /**
   * 等待 DOM 中出现指定选择器的元素后挂载 canvas。
   *
   * @param selector - CSS 选择器或元素 ID
   */
  waitForContainer(selector) {
    if (this.onContainerFound) {
      document.removeEventListener("DOMContentLoaded", this.onContainerFound);
    }
    this.onContainerFound = () => {
      const el = findElement(selector);
      if (el) {
        this.mountCanvas(el);
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", this.onContainerFound);
    } else {
      requestAnimationFrame(() => {
        const el = findElement(selector);
        if (el) this.mountCanvas(el);
      });
    }
  }
  /**
   * 在容器中创建 canvas 并完成初始化。
   * 设置尺寸、绑定事件、首次绘制。
   *
   * @param container - 容器元素
   */
  mountCanvas(container) {
    this.container = container;
    const canvas = createCanvasIn(container);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    this.draw();
    this.bindPointerEvents();
    this.bindResizeHandler();
  }
  // ── 尺寸与响应式 ──────────────────────────────────────────
  /**
   * 根据容器尺寸重新设置 canvas 大小。
   * 处理高 DPI 缩放，更新内部几何状态。
   */
  resize() {
    if (!this.canvas || !this.container || !this.ctx) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height || Math.round(w * this.aspectRatio);
    setupCanvasSize(this.canvas, w, h, this.ctx, dpr);
    this.state.centerX = w / 2;
    this.state.centerY = h;
    this.state.radius = w / 2;
    this.state.btnRadius = this.state.radius * this.buttonConfig.radiusRatio;
    this.draw();
  }
  /**
   * 绑定 window resize 事件，使用防抖避免频繁重绘。
   */
  bindResizeHandler() {
    if (this.boundResize) {
      window.removeEventListener("resize", this.boundResize);
    }
    const debouncedResize = debounce(() => this.resize(), 100);
    this.boundResize = debouncedResize;
    window.addEventListener("resize", debouncedResize);
  }
  // ── 指针事件 ──────────────────────────────────────────────
  /**
   * 绑定 pointerdown / pointerup / pointercancel 事件。
   * 实现：
   * - 点击中心按钮 → emit('select')
   * - 水平滑动 → 旋转转盘
   */
  bindPointerEvents() {
    if (!this.canvas) return;
    const canvas = this.canvas;
    const onPointerDown = (e) => {
      this.state.startX = e.clientX;
      this.state.startY = e.clientY;
      this.state.tracking = true;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
      }
    };
    const onPointerUp = (e) => {
      if (!this.state.tracking) return;
      this.state.tracking = false;
      const dx = e.clientX - this.state.startX;
      const dy = e.clientY - this.state.startY;
      const isTap = Math.abs(dx) < this.tapThreshold && Math.abs(dy) < this.tapThreshold;
      if (isTap) {
        const canvasPoint = clientToCanvas(canvas, e.clientX, e.clientY);
        if (this.isInsideButton(canvasPoint)) {
          this.handleSelect(e.clientX, e.clientY);
          return;
        }
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > this.swipeThreshold) {
        this.rotateInternal(dx < 0 ? 1 : -1);
      }
    };
    const onPointerCancel = () => {
      this.state.tracking = false;
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
  }
  /**
   * 判断点击点是否在中心按钮范围内。
   * 使用 hitTolerance 扩大命中区域，使交互更友好。
   *
   * @param point - canvas 内部坐标
   * @returns       是否命中按钮
   */
  isInsideButton(point) {
    const center = { x: this.state.centerX, y: this.state.centerY };
    const effectiveRadius = this.state.btnRadius + this.buttonConfig.hitTolerance;
    return isPointInCircle(point, center, effectiveRadius) && point.y <= this.state.centerY;
  }
  /**
   * 处理中心按钮点击，触发 select 事件。
   *
   * @param clientX - 原始 clientX
   * @param clientY - 原始 clientY
   */
  handleSelect(clientX, clientY) {
    const index = this.getCurrentIndex();
    const item = this.items[index];
    if (!item) return;
    this.emitSelect({
      index,
      item,
      clientX,
      clientY
    });
  }
  // ── 旋转控制 ──────────────────────────────────────────────
  /**
   * 获取当前激活扇区的规范化索引。
   * 支持负数和越界索引的环形回绕。
   *
   * @returns 规范化后的索引
   */
  getCurrentIndex() {
    const count = this.items.length || 1;
    return normalizeIndex(this.state.activeIndex, count);
  }
  /**
   * 内部旋转方法。更新索引、触发动画、发射事件。
   *
   * @param delta - 旋转步长 (+1 顺时针, -1 逆时针)
   */
  rotateInternal(delta) {
    if (delta === 0 || this.items.length === 0) return;
    this.state.activeIndex += delta;
    this.state.animFrom = this.state.rotation;
    this.state.animStart = null;
    if (!this.state.animating) {
      this.state.animating = true;
      requestAnimationFrame(this.animationTick);
    }
    Math.PI * 2 / this.items.length;
    const direction = delta > 0 ? "clockwise" : "counter-clockwise";
    const activeIdx = this.getCurrentIndex();
    this.emitRotate({
      direction,
      delta,
      activeIndex: activeIdx,
      currentItem: this.items[activeIdx] ?? null,
      rotation: this.state.rotation
    });
  }
  // ── 公开旋转 API ──────────────────────────────────────────
  /**
   * 按指定方向旋转到下一个扇区。
   *
   * @param direction - 'clockwise' (顺时针) 或 'counter-clockwise' (逆时针)
   */
  rotate(direction) {
    this.rotateInternal(direction === "clockwise" ? 1 : -1);
  }
  /**
   * 顺时针旋转到下一个扇区。
   */
  next() {
    this.rotateInternal(1);
  }
  /**
   * 逆时针旋转到上一个扇区。
   */
  prev() {
    this.rotateInternal(-1);
  }
  // ── 数据管理 ──────────────────────────────────────────────
  /**
   * 更新转盘数据。重置旋转状态并重新绘制。
   *
   * @param items - 新的扇区数据列表
   */
  setItems(items) {
    this.items = items;
    this.state.activeIndex = 0;
    this.state.rotation = 0;
    this.state.animFrom = 0;
    this.state.animStart = null;
    this.state.animating = false;
    this.draw();
  }
  /**
   * 获取当前转盘数据的副本。
   *
   * @returns 扇区数据数组 (浅拷贝)
   */
  getItems() {
    return [...this.items];
  }
  // ── 绘制入口 ──────────────────────────────────────────────
  /**
   * 触发完整重绘：清空画布并绘制所有扇区、标签和按钮。
   */
  draw() {
    if (!this.ctx || !this.canvas) return;
    const highlightIdx = this.getCurrentIndex();
    drawTurntable(
      this.ctx,
      this.canvas,
      this.state,
      this.items,
      highlightIdx,
      this.labelConfig,
      this.buttonConfig,
      this.sectorGap,
      this.innerRadiusRatio
    );
  }
  // ── 状态查询 ──────────────────────────────────────────────
  /**
   * 获取当前组件状态的只读快照。
   *
   * @returns 状态对象，包含旋转角度、激活索引、动画状态等
   */
  getState() {
    return {
      rotation: this.state.rotation,
      activeIndex: this.getCurrentIndex(),
      isAnimating: this.state.animating,
      isSpinning: this.state.animating,
      sectorCount: this.items.length
    };
  }
  // ── 资源清理 ──────────────────────────────────────────────
  /**
   * 销毁实例，释放所有资源。
   * - 移除事件监听 (resize, DOMContentLoaded, pointer)
   * - 移除 canvas 元素
   * - 清空事件监听器
   * - 重置所有引用
   *
   * 多次调用是安全的。
   */
  destroy() {
    if (this.boundResize) {
      window.removeEventListener("resize", this.boundResize);
      this.boundResize = null;
    }
    if (this.onContainerFound) {
      document.removeEventListener("DOMContentLoaded", this.onContainerFound);
      this.onContainerFound = null;
    }
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
    this.emitter.removeAllListeners();
    this.ctx = null;
    this.container = null;
  }
};
var index_default = TurntableSelection;

// Generated by tsup

export { TurntableSelection, index_default as default };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map