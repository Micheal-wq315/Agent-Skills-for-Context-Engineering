---
name: RoboMaster 雷达系统
description: 提供 RoboMaster 雷达系统完整设计指南，包括 YOLO 目标检测、SORT/DeepSORT 多目标跟踪、威胁评估算法、传感器融合策略、战场态势可视化和开源项目深度分析
version: 2.1.0
author: RoboMaster技术团队
tags:
  - RoboMaster
  - 雷达系统
  - DeepSORT
  - 多目标跟踪
---

# RoboMaster 雷达系统

## 一、系统架构

```
┌─────────────────────────────────────────────────────┐
│                  态势输出层                         │
│  敌方位置 (x,y) · 威胁等级 · 运动轨迹 · 预警       │
└────────────────────────┬────────────────────────────┘
                         │ 跟踪结果
┌────────────────────────▼────────────────────────────┐
│                  目标跟踪层                         │
│  多目标跟踪 · 轨迹预测 · 身份关联                  │
│  SORT · DeepSORT · 卡尔曼滤波                      │
└────────────────────────┬────────────────────────────┘
                         │ 检测框
┌────────────────────────▼────────────────────────────┐
│                  目标检测层                         │
│  步兵 · 英雄 · 工程 · 哨兵 · 装甲板                │
│  YOLOv8 · OpenCV · 深度学习推理                    │
└────────────────────────┬────────────────────────────┘
                         │ 原始数据
┌────────────────────────▼────────────────────────────┐
│                  数据采集层                         │
│  广角相机 · 全景相机 · LiDAR · 裁判系统数据        │
└─────────────────────────────────────────────────────┘
```

---

## 二、目标检测方案

### 深度学习方案（推荐）

```python
from ultralytics import YOLO
import numpy as np

class RadarDetector:
    def __init__(self, model_path='yolov8s_rm_radar.pt'):
        self.model = YOLO(model_path)
        self.class_names = {
            0: 'infantry',   # 步兵
            1: 'hero',       # 英雄
            2: 'engineer',   # 工程
            3: 'sentry',     # 哨兵
            4: 'base',       # 基地
            5: 'armor'       # 装甲板
        }

    def detect(self, frame, conf_threshold=0.5):
        results = self.model(frame, conf=conf_threshold, iou=0.45)
        detections = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                conf   = float(box.conf[0].cpu().numpy())
                center = ((x1+x2)//2, (y1+y2)//2)  # 目标中心
                detections.append({
                    'bbox': (x1, y1, x2, y2),
                    'center': center,
                    'class': self.class_names[cls_id],
                    'confidence': conf,
                    'width': x2 - x1,
                    'height': y2 - y1
                })
        return detections
```

### 传统视觉方案

```python
def detect_enemies_traditional(frame):
    """基于颜色分割 + 轮廓的传统检测"""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # 敌方颜色分割（以红色为例）
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    mask = cv2.inRange(hsv, lower_red1, upper_red1) | \
           cv2.inRange(hsv, lower_red2, upper_red2)
    # 形态学处理
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    # 轮廓检测
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)
    enemies = []
    for cnt in contours:
        if cv2.contourArea(cnt) > 500:  # 最小面积过滤
            x, y, w, h = cv2.boundingRect(cnt)
            enemies.append({'bbox': (x, y, x+w, y+h)})
    return enemies
```

---

## 三、多目标跟踪

### SORT 算法实现

```python
import numpy as np
from scipy.optimize import linear_sum_assignment

class SortTracker:
    def __init__(self, max_age=5, min_hits=3, iou_threshold=0.3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.tracks = []
        self.frame_count = 0

    def update(self, detections):
        self.frame_count += 1
        # 1. 使用卡尔曼滤波预测所有轨迹
        for track in self.tracks:
            track.predict()
        # 2. 计算检测与轨迹的 IoU 矩阵
        matches, unmatched_dets, unmatched_trks = \
            self._associate(detections)
        # 3. 更新匹配的轨迹
        for d_idx, t_idx in matches:
            self.tracks[t_idx].update(detections[d_idx])
        # 4. 创建新轨迹
        for d_idx in unmatched_dets:
            track = KalmanBoxTracker(detections[d_idx])
            self.tracks.append(track)
        # 5. 删除过期轨迹
        self.tracks = [t for t in self.tracks
                       if t.time_since_update <= self.max_age]
        return [t.get_state() for t in self.tracks
                if t.hit_streak >= self.min_hits]

class KalmanBoxTracker:
    """卡尔曼滤波跟踪器"""
    def __init__(self, bbox):
        # 状态: x, y, area, aspect_ratio, vx, vy, varea
        self.kf = cv2.KalmanFilter(7, 4)
        self.kf.measurementMatrix = np.eye(4, 7, dtype=np.float32)
        self.time_since_update = 0
        self.hit_streak = 0
        self.id = KalmanBoxTracker._next_id
        KalmanBoxTracker._next_id += 1
        x1,y1,x2,y2 = bbox
        self.kf.statePost[:4] = np.array([x1,y1,x2,y2], np.float32).reshape(-1,1)
        self.kf.errorCovPost = np.eye(7, dtype=np.float32) * 10.0

    def predict(self):
        prediction = self.kf.predict()
        self.time_since_update += 1
    def update(self, bbox):
        self.time_since_update = 0
        self.hit_streak += 1
```

---

## 四、威胁评估算法

```python
def assess_threat(tracks, my_position, priority_class='hero'):
    """综合威胁评估"""
    threats = []
    for track in tracks:
        center_x = (track['bbox'][0] + track['bbox'][2]) / 2
        center_y = (track['bbox'][1] + track['bbox'][3]) / 2
        distance = np.sqrt((center_x - my_position[0])**2 +
                          (center_y - my_position[1])**2)
        # 距离评分（越近越高）
        dist_score = max(0, 1.0 - distance / 1000.0)
        # 速度评分（假设可从跟踪器获取）
        speed_score = min(1.0, track.get('velocity', 0) / 5.0)
        # 类型评分
        type_score = {
            'hero':     1.0,
            'infantry': 0.7,
            'engineer': 0.3,
            'sentry':   0.5
        }.get(track.get('class', 'infantry'), 0.3)
        # 朝向评分（朝向己方 = 威胁）
        direction_score = track.get('approaching', 0)

        threat_score = (0.4 * dist_score +
                       0.2 * speed_score +
                       0.2 * type_score +
                       0.2 * direction_score)

        # 威胁等级
        if threat_score > 0.7:
            level = 'HIGH'
        elif threat_score > 0.4:
            level = 'MEDIUM'
        else:
            level = 'LOW'

        threats.append({
            'id': track['track_id'],
            'class': track.get('class', 'unknown'),
            'distance': distance,
            'position': (center_x, center_y),
            'threat_score': threat_score,
            'threat_level': level
        })
    # 按威胁排序
    threats.sort(key=lambda x: x['threat_score'], reverse=True)
    return threats
```

---

## 五、传感器融合

### 多源数据融合框架

```
视觉检测 (x,y,class)
       +
裁判系统数据 (absolute_position)
       +
激光雷达数据 (distance)
       │
       ▼
┌──────────────────┐
│  扩展卡尔曼滤波   │  ← 最优状态估计
│  (EKF Fusion)     │
└────────┬─────────┘
         │
         ▼
  融合后目标位置 + 不确定性
```

### 融合权重策略

| 数据源 | 权重 | 适用条件 |
|--------|------|---------|
| 视觉检测 | 0.5 | 目标可见 |
| 裁判系统 | 0.3 | 比赛进行中 |
| LiDAR | 0.2 | 测距有效 |

---

## 六、开源项目深度分析

### 项目 1：辽宁科技大学 COD - RM_Radar

**仓库地址**：https://gitee.com/LNUT-COD/RM_Radar

**战队**：辽宁科技大学 COD

**为什么好**：
- ✅ **完整雷达系统全链路**：从检测到跟踪到威胁评估，全部代码完整
- ✅ **PyTorch + YOLO 实现**：现代深度学习框架，训练部署方便
- ✅ **DeepSORT 集成**：多目标跟踪效果优秀，ID 切换少
- ✅ **可配置参数多**：超参都抽成配置文件，方便调优
- ✅ **可视化调试工具**：包含实时态势显示面板，调试方便

**技术亮点**：
- 卡尔曼滤波 + 匈牙利算法实现数据关联
- 基于历史轨迹的目标速度预测
- 多维度威胁评估（距离、速度、类型、朝向）

**学习建议**：先跑通完整流程，再逐个模块分析

### 项目 2：华中科技大学 - RadarSystem

**仓库地址**：https://github.com/HUST-RoboMaster/RadarSystem

**战队**：华中科技大学

**为什么好**：
- ✅ **传统视觉方案成熟**：不依赖深度学习，部署简单
- ✅ **算法设计巧妙**：基于颜色和几何特征，鲁棒性不错
- ✅ **实时性优化好**：纯 OpenCV 实现，CPU 上也能跑
- ✅ **代码注释详细**：每一行都有说明，学习价值高
- ✅ **跨平台支持**：Windows、Linux、Mac 都能跑

**技术亮点**：
- 自适应颜色阈值，应对光照变化
- 多特征融合验证（颜色、轮廓、长宽比）
- 运动轨迹预测和预测跟踪

**学习建议**：适合入门，理解传统计算机视觉思路

### 项目 3：DeepSORT 官方开源

**仓库地址**：https://github.com/nwojke/deep_sort

**作者**：nwojke（官方开源）

**为什么好**：
- ✅ **经典多目标跟踪算法**：SORT 的改进版，工业标准
- ✅ **代码简洁易读**：核心算法只有几百行，易于理解
- ✅ **理论基础扎实**：论文 + 代码，学习完整
- ✅ **广泛应用**：在各种跟踪任务中都有应用
- ✅ **持续引用**：学术论文引用率高，验证有效

**技术亮点**：
- 卡尔曼滤波 + 匈牙利算法关联
- 深度学习特征提取，提升关联准确率
- 轨迹生命周期管理，避免跳变

**学习建议**：先理解算法原理，再看代码实现

### 项目 4：ByteTrack 开源

**仓库地址**：https://github.com/ifzhang/ByteTrack

**作者**：张一峰等（华中科技大学等）

**为什么好**：
- ✅ **新一代跟踪算法**：性能优于 DeepSORT，速度更快
- ✅ **简单有效**：核心思想简单，但效果惊人
- ✅ **低置信度利用**：巧妙利用低置信度检测框
- ✅ **即插即用**：可与任意检测器配合使用
- ✅ **性能优秀**：MOT17 数据集表现出色

**技术亮点**：
- 级联匹配策略，高置信度先匹配
- 低置信度框过滤和利用
- 简单但有效的轨迹管理

**学习建议**：适合对跟踪性能有更高要求的队伍

### 项目 5：RoboMaster 官方视觉（可用于雷达）

**仓库信息**：官方开源视觉算法可直接改造为雷达算法

**优势**：
- ✅ **与硬件高度适配**：大疆官方代码，兼容性好
- ✅ **已有基础模型**：官方提供预训练权重
- ✅ **教程完善**：官方文档和示例代码齐全

**技术特点**：
- 模型针对比赛场地做了优化
- 部署工具链完整（TensorRT/ONNX）
- 有大量社区支持

**学习建议**：先看官方示例，再根据雷达需求改造

---

## 七、算法选择建议

### 场景 1：入门学习，无 GPU

**推荐方案**：传统视觉 + SORT + 简单威胁评估
**理由**：
- 无需深度学习环境，CPU 可跑
- 算法简单，容易理解
- 满足基础需求
- **参考开源**：华中科技大学 RadarSystem

### 场景 2：中等配置，追求平衡

**推荐方案**：YOLOv5n + DeepSORT + 多维度威胁评估
**理由**：
- 检测和跟踪效果平衡
- Jetson Nano 上可实时
- 社区支持好
- **参考开源**：辽宁科技大学 COD RM_Radar

### 场景 3：高性能，追求极致

**推荐方案**：YOLOv8s + ByteTrack + EKF 传感器融合
**理由**：
- 检测精度最高，跟踪最稳
- ByteTrack 性能优秀
- 传感器融合提升鲁棒性
- **参考开源**：ByteTrack 官方 + 辽宁科技大学高级版

---

## 八、学习资料

| 类型 | 资源 | 链接/说明 |
|------|------|------|
| **书籍** | 《Multiple Target Tracking》 | Li Zhang，理论基础 |
| | 《计算机视觉：算法与应用》 | Richard Szeliski 经典 |
| **算法教程** | SORT 论文 | Simple Online and Realtime Tracking |
| | DeepSORT 论文 | Simple Online and Realtime Tracking with a Deep Association Metric |
| | ByteTrack 论文 | 阅读了解新一代算法 |
| **官方文档** | OpenCV Tracking API | https://docs.opencv.org |
| | YOLOv8 官方文档 | https://docs.ultralytics.com |
| **视频教程** | bilibili "多目标跟踪" | 系统性学习路径 |
| | bilibili "RoboMaster 雷达" | 多个战队实战分享 |
| **实践项目** | MOT 挑战赛数据集 | 学习算法性能评估 |
| | RoboMaster 数据集 | 针对比赛场景优化 |
