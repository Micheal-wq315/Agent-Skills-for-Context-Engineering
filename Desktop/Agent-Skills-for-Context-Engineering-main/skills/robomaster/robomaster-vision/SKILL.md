---
name: RoboMaster 视觉系统
description: 提供 RoboMaster 视觉系统完整设计指南，包括传统视觉（OpenCV）与深度学习（YOLO）装甲板检测、能量机关识别、卡尔曼滤波跟踪、TensorRT/ONNX 部署优化、工业相机选型和开源项目分析
version: 2.0.0
author: RoboMaster技术团队
tags:
  - RoboMaster
  - 视觉系统
  - YOLO
  - 目标检测
---

# RoboMaster 视觉系统

## 一、系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     决策输出层                              │
│  目标坐标 (x,y,z) · 装甲板类型 · 威胁等级 · 射击指令       │
└──────────────────────────┬──────────────────────────────────┘
                           │ 识别结果
┌──────────────────────────▼──────────────────────────────────┐
│                     目标识别层                              │
│  装甲板检测 · 能量机关识别 · 敌方分类 · 关键点定位         │
│  YOLOv5/v8 · 传统视觉 · Hough变换                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ 预处理图像
┌──────────────────────────▼──────────────────────────────────┐
│                     图像预处理层                            │
│  去噪 · 颜色空间转换(RGB→HSV) · ROI提取 · 直方图均衡化    │
│  边缘检测(Canny) · 形态学操作(开/闭)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ 原始图像
┌──────────────────────────▼──────────────────────────────────┐
│                     图像采集层                              │
│  USB摄像头(罗技C920) · 工业相机(大恒/大华) · 图传模块      │
│  分辨率: 640x480 / 1280x720 · 帧率: 30-60fps              │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、传统视觉方案（OpenCV）

### 装甲板检测完整流程

```python
import cv2
import numpy as np

def detect_armor(image):
    # 1. 颜色空间转换 RGB → HSV
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # 2. 颜色阈值分割（蓝色装甲板）
    lower_blue = np.array([100, 50, 50])
    upper_blue = np.array([130, 255, 255])
    mask = cv2.inRange(hsv, lower_blue, upper_blue)

    # 3. 形态学操作：开运算去噪声 + 闭运算填空洞
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # 4. 轮廓检测
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)

    # 5. 装甲板特征匹配
    armor_list = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 100:  # 过滤小噪声
            continue
        rect = cv2.minAreaRect(contour)
        width, height = rect[1]
        if width == 0 or height == 0:
            continue
        aspect_ratio = max(width, height) / min(width, height)
        # 装甲板长宽比约 2:1
        if 1.5 < aspect_ratio < 2.5:
            armor_list.append(rect)
    return armor_list
```

### 关键参数调优

| 参数 | 作用 | 建议范围 |
|------|------|---------|
| **HSV 颜色阈值** | 分割目标颜色 | H:[100,130] S:[50,255] V:[50,255] 蓝色 |
| **轮廓面积过滤** | 过滤噪声 | > 100 像素 |
| **长宽比** | 装甲板特征 | 1.5 - 2.5 |
| **形态学核大小** | 噪声/空洞处理 | (3,3) 或 (5,5) |

**缺点**：受光照影响大，需要手动调整颜色阈值。

---

## 三、深度学习方案（YOLO）

### YOLOv8 装甲板检测

```python
from ultralytics import YOLO

class ArmorDetector:
    def __init__(self, model_path='yolov8n_armor.pt'):
        self.model = YOLO(model_path)

    def detect(self, image, conf=0.5, iou=0.45):
        results = self.model(image, conf=conf, iou=iou)
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cls  = int(box.cls[0].cpu().numpy())
                conf = float(box.conf[0].cpu().numpy())
                detections.append({
                    'bbox': (int(x1), int(y1), int(x2), int(y2)),
                    'class': cls,      # 0=装甲板 1=能量机关
                    'confidence': conf
                })
        return detections
```

### 数据集构建

```
dataset/
├── images/
│   ├── train/          # 训练集图像（建议 2000+ 张）
│   └── val/            # 验证集图像
├── labels/
│   ├── train/          # YOLO 格式标注
│   └── val/
└── data.yaml           # 数据集配置
```

**类别定义**：
- `0`: armor_blue（蓝色装甲板）
- `1`: armor_red（红色装甲板）
- `2`: energy_buff（能量机关）

### YOLO 版本对比

| 版本 | 速度 | 精度 | 资源需求 | 推荐场景 |
|------|------|------|---------|---------|
| YOLOv5n | 快 | 中 | Jetson Nano | 低配设备 |
| YOLOv5s | 中 | 高 | Jetson TX2 | 中配设备 |
| YOLOv8n | 很快 | 高 | Jetson Orin Nano | 新项目首选 |
| YOLOv8s | 中 | 很高 | Jetson Orin NX | 高精度需求 |

---

## 四、能量机关识别

### 传统方案

能量机关识别需要额外处理旋转角度：
1. 颜色分割 → 提取能量机关区域
2. Hough 圆检测 → 定位中心
3. 轮廓分析 → 识别旋转角度
4. 计算装甲板相对旋转位置

### 深度学习方案

五点关键点检测模型，输出能量机关中心 + 四个装甲板角点。

---

## 五、目标跟踪与预测

### 卡尔曼滤波预测

```python
import numpy as np

class KalmanTracker:
    def __init__(self):
        self.kf = cv2.KalmanFilter(4, 2)
        # 状态: [x, y, vx, vy]
        self.kf.transitionMatrix = np.array([
            [1, 0, 1, 0],   # x = x + vx*dt
            [0, 1, 0, 1],   # y = y + vy*dt
            [0, 0, 1, 0],
            [0, 0, 0, 1]], np.float32)
        self.kf.measurementMatrix = np.array([
            [1, 0, 0, 0],   # 只测量位置
            [0, 1, 0, 0]], np.float32)
        self.kf.processNoiseCov = np.eye(4, dtype=np.float32) * 0.03
        self.kf.measurementNoiseCov = np.eye(2, dtype=np.float32) * 1.0
        self.kf.errorCovPost = np.eye(4, dtype=np.float32)

    def predict(self):
        pred = self.kf.predict()
        return (int(pred[0]), int(pred[1]))

    def update(self, x, y):
        measurement = np.array([[np.float32(x)], [np.float32(y)]])
        self.kf.correct(measurement)
```

### α-β 平滑滤波

```python
class AlphaBetaFilter:
    def __init__(self, alpha=0.7):
        self.alpha = alpha
        self.x = 0.0
        self.y = 0.0

    def update(self, mx, my):
        self.x = self.alpha * mx + (1 - self.alpha) * self.x
        self.y = self.alpha * my + (1 - self.alpha) * self.y
        return self.x, self.y
```

---

## 六、部署与优化

### TensorRT 加速流程

```
PyTorch Model (.pt)
       │  torch.onnx.export()
       ▼
ONNX Model (.onnx)
       │  trtexec / onnx2trt
       ▼
TensorRT Engine (.trt / .engine)
       │  TensorRT Runtime API
       ▼
推理部署 (Jetson / x86 + GPU)
```

### 模型量化策略

| 精度 | 速度提升 | 精度损失 | 适用 |
|------|---------|---------|------|
| FP32 | 基准 | 0% | 训练 |
| FP16 | 1.5-2x | < 1% | Jetson 推理 |
| INT8 | 2-3x | 1-3% | 极致优化（需校准） |

### 实时性优化技巧

1. **ROI 裁剪**：只处理画面中心区域（减少 50% 计算量）
2. **多线程流水线**：采集线程 + 推理线程 + 通信线程
3. **跳帧检测**：每 2-3 帧检测一次，中间用跟踪预测
4. **图像缩放**：下采样到 320x240 推理再映射回原图

---

## 七、开源项目参考

| 项目 | 战队 | 平台 | 亮点 |
|------|------|------|------|
| [RM2023-Armor-Detection](https://github.com/GMasterXJTLU) | XJTLU GMaster | GitHub | YOLO 装甲板四点 + 能量机关五点 |
| [qdu-rm-ai](https://github.com/QduFutureTeam) | 青岛大学未来 | GitHub | 视觉 AI 完整流程 |
| [RM_Vision](https://github.com/SCUT-RobotTeam) | 华南理工华南虎 | GitHub | 传统+深度混合 |
| [辽宁科大 COD 雷达视觉](https://gitee.com/LNUT-COD) | 辽宁科技大学 | Gitee | PyTorch + YOLO 完整 |
| [RoboMaster-AI-Challenge](https://github.com/RoboMaster) | 官方 AI 挑战赛 | GitHub | 标准数据集 |
| [rm_vision](https://github.com/chenjunnn/rm_vision) | 陈君 (开源个人) | GitHub | ROS 视觉节点 |

**学习资料**：
- OpenCV 官方教程：https://docs.opencv.org
- YOLOv8 文档：https://docs.ultralytics.com
- TensorRT 文档：https://docs.nvidia.com/deeplearning/tensorrt
- bilibili RoboMaster 视觉教程系列