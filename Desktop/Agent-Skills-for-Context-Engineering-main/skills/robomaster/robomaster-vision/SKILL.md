---
name: RoboMaster 视觉系统
description: 提供 RoboMaster 视觉系统完整设计指南，包括传统视觉（OpenCV）与深度学习（YOLO）装甲板检测、能量机关识别、卡尔曼滤波跟踪、TensorRT/ONNX部署优化、工业相机选型和开源项目深度分析
version: 2.1.0
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

## 七、开源项目深度分析

### 项目 1：XJTLU GMaster - RM2023-Armor-Detection

**仓库地址**：https://github.com/GMasterXJTLU/RM2023-Armor-Detection

**战队**：西交利物浦大学 GMaster

**为什么好**：
- ✅ **四点检测 + 五点能量机关**：比普通框检测更精确，能计算旋转角度
- ✅ **传统+深度混合策略**：传统视觉快速定位，深度学习精细识别
- ✅ **实时推理优化**：针对 Jetson 平台做了专门优化，延迟低
- ✅ **完整的训练框架**：包含数据标注脚本、训练配置、验证工具
- ✅ **详细的中文文档**：新手友好，学习曲线平缓

**技术亮点**：
- 采用 YOLOv5n 主干网络，兼顾速度和精度
- 自定义关键点检测头，解决能量机关识别
- 针对比赛光照变化的自适应预处理

### 项目 2：青岛大学未来战队 - qdu-rm-ai

**仓库地址**：https://github.com/QduFutureTeam/qdu-rm-ai

**战队**：青岛大学未来

**为什么好**：
- ✅ **端到端完整流程**：从图像采集到决策输出，代码结构清晰
- ✅ **模块化设计**：各模块独立，方便替换和升级
- ✅ **多种方案对比**：同时提供传统视觉和深度学习两种方案
- ✅ **性能监控工具**：包含详细的延迟统计和性能分析
- ✅ **新手教程**：README 写得非常详细，从环境配置到部署都有指导

**技术亮点**：
- PyTorch + ONNX + TensorRT 完整部署链
- 多线程架构，采集-推理-通信分离
- 自适应 ROI 选择，动态调整检测区域

### 项目 3：华南理工华南虎 - RM_Vision

**仓库地址**：https://github.com/SCUT-RobotTeam/RM_Vision

**战队**：华南理工大学华南虎（强队）

**为什么好**：
- ✅ **工业级代码质量**：代码规范，注释完整，工程化程度高
- ✅ **长期迭代积累**：多个赛季的经验沉淀，稳定性有保障
- ✅ **传统+深度双方案**：可根据计算资源选择方案
- ✅ **完整的调试工具**：可视化界面，方便调参和问题定位
- ✅ **多机器人支持**：步兵、英雄、哨兵都有对应的代码分支

**技术亮点**：
- 使用 C++ 实现高性能版本，推理速度快
- 自定义加速层，针对比赛场景优化
- 完整的性能监控和日志系统

### 项目 4：辽宁科技大学 COD - 雷达视觉

**仓库地址**：https://gitee.com/LNUT-COD/RM_Radar

**战队**：辽宁科技大学 COD

**为什么好**：
- ✅ **完整雷达系统**：从检测到跟踪到威胁评估，全链路实现
- ✅ **YOLO + DeepSORT**：业界标准的多目标跟踪方案
- ✅ **威胁评估算法**：综合距离、速度、类型的多维度评估
- ✅ **可配置化**：大量参数可调，方便适配不同场景
- ✅ **可视化界面**：方便调试和观看效果

**技术亮点**：
- 实时多目标跟踪，ID 切换少
- 基于历史轨迹的预测更准确
- 支持远程调试和实时监控

### 项目 5：陈君 - rm_vision（个人开源）

**仓库地址**：https://github.com/chenjunnn/rm_vision

**作者**：陈君（个人开源）

**为什么好**：
- ✅ **ROS 集成**：完整的 ROS 节点，方便与机器人系统集成
- ✅ **高代码质量**：代码结构清晰，易于理解和修改
- ✅ **文档详细**：每个模块都有详细说明和使用示例
- ✅ **长期维护**：项目持续更新，跟进最新技术
- ✅ **新手友好**：逐步教程，适合从零开始学习

**技术亮点**：
- ROS2 支持，与现代机器人系统兼容
- 模块化插件架构，方便扩展
- 丰富的可视化和调试工具

### 项目 6：上海交通大学 - 2019视觉代码

**仓库信息**：可在 CSDN 博客搜索「上海交通大学 RoboMaster 2019赛季视觉」

**战队**：上海交通大学（老牌强队）

**为什么好**：
- ✅ **经典传统视觉**：虽然年份较早，但基础算法很扎实
- ✅ **工程实践经验**：包含大量实际比赛中遇到的问题和解决方案
- ✅ **代码注释详细**：每个函数都有详细说明，学习价值高
- ✅ **跨平台支持**：同时支持 Windows 和 Linux
- ✅ **无依赖版本**：核心算法可以独立运行，方便移植

**技术亮点**：
- 颜色空间转换和阈值自动调整
- 基于几何特征的装甲板验证
- 能量机关角度计算的数学推导

---

## 八、算法选择建议

### 场景 1：新手入门或计算资源有限

**推荐方案**：传统视觉 + α-β滤波
**理由**：
- 不需要深度学习环境和 GPU
- 代码简单，容易理解和调试
- 满足基础比赛需求
- **参考开源**：上海交通大学 2019 视觉代码

### 场景 2：中等配置，追求稳定性

**推荐方案**：YOLOv5n + 卡尔曼滤波
**理由**：
- 精度和速度平衡好
- Jetson Nano 可以流畅运行
- 成熟稳定，社区支持好
- **参考开源**：XJTLU GMaster 2023

### 场景 3：高性能，追求极致

**推荐方案**：YOLOv8s + DeepSORT + TensorRT
**理由**：
- 精度最高，鲁棒性最好
- DeepSORT 跟踪更稳定
- TensorRT 加速后延迟很低
- **参考开源**：青岛大学未来、华南虎

---

## 九、学习资料

| 类型 | 资源 | 链接 |
|------|------|------|
| **官方文档** | OpenCV 教程 | https://docs.opencv.org |
| | YOLOv8 文档 | https://docs.ultralytics.com |
| | TensorRT 文档 | https://docs.nvidia.com/deeplearning/tensorrt |
| **视频教程** | bilibili RoboMaster 视觉教程 | 搜索「RoboMaster 视觉」 |
| | YOLO 教程系列 | 搜索「YOLOv8 训练部署」 |
| **书籍推荐** | 《学习 OpenCV》 | 经典入门书籍 |
| | 《Python 计算机视觉编程》 | 实用案例多 |
