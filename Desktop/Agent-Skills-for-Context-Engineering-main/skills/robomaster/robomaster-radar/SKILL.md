---
name: RoboMaster 雷达系统
description: 提供 RoboMaster 雷达系统完整设计指南，包括 YOLO 目标检测、SORT/DeepSORT 多目标跟踪、威胁评估算法、传感器融合策略和战场态势可视化方案
version: 2.0.0
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

## 六、开源项目参考

| 项目 | 战队 | 亮点 |
|------|------|------|
| [辽宁科大 COD 雷达视觉](https://gitee.com/LNUT-COD/RM_Radar) | 辽宁科技大学 | PyTorch+YOLO+DeepSORT |
| [华中科大雷达](https://github.com/HUST-RoboMaster/RadarSystem) | 华中科技大学 | OpenCV 传统视觉雷达 |
| [DeepSORT](https://github.com/nwojke/deep_sort) | 开源 | 多目标跟踪算法 |
| [ByteTrack](https://github.com/ifzhang/ByteTrack) | 华中科大 | 新一代跟踪算法 |
| [rm_radar](https://github.com) | 多战队 | ROS 雷达节点 |

**学习资料**：
- 《Multiple Target Tracking》- Li Zhang
- OpenCV Tracking API：https://docs.opencv.org
- YOLOv8 官方文档：https://docs.ultralytics.com