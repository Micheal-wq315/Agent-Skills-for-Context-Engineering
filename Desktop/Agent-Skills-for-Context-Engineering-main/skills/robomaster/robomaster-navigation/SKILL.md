---
name: RoboMaster 导航系统
description: 提供 RoboMaster 哨兵导航系统完整设计指南，包括 LiDAR-IMU 紧耦合 SLAM、A*/DWA 分层路径规划、有限状态机决策系统、ROS2 仿真环境和 Sim2Real 迁移策略
version: 2.0.0
author: RoboMaster技术团队
tags:
  - RoboMaster
  - 导航系统
  - SLAM
  - 路径规划
---

# RoboMaster 导航系统

## 一、系统架构

```
┌─────────────────────────────────────────────────────────┐
│                   决策层                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 状态机管理 · 行为决策 · 任务调度 · 威胁评估      │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ 目标点
┌──────────────────────────▼──────────────────────────────┐
│                   规划层                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 全局: A*/Dijkstra/RRT*  局部: DWA/TEB          │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ 速度指令 (vx, vy, vw)
┌──────────────────────────▼──────────────────────────────┐
│                   控制层                                 │
│  运动学解算 · PID 速度跟踪 · 姿态稳定 · 功率限制       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   感知层                                 │
│  LiDAR(Mid360) · IMU · 里程计 · 摄像头                  │
│  扩展卡尔曼滤波(EKF) · 传感器融合 · 状态估计            │
└─────────────────────────────────────────────────────────┘
```

---

## 二、SLAM 建图与定位

### 方案对比

| 方案 | 精度 | 成本 | 光照依赖 | 推荐场景 |
|------|------|------|---------|---------|
| **LiDAR SLAM** (Cartographer) | 很高 | 高 | 无 | 哨兵标配 |
| **Visual SLAM** (ORB-SLAM3) | 中 | 低 | 严重 | 室内纹理丰富 |
| **LiDAR-IMU** (LIO-SAM) | 很高 | 高 | 无 | 高精度需求 |
| **2D LiDAR** (GMapping) | 中 | 中 | 无 | 低预算方案 |

### LiDAR-IMU 紧耦合 SLAM 核心算法

```python
import numpy as np
from scipy.spatial import KDTree

class LidarImuSLAM:
    def __init__(self):
        self.pose = np.eye(4)              # 当前位姿
        self.local_map = []                # 局部地图点云
        self.keyframes = []                # 关键帧

    def extract_features(self, scan):
        """提取边缘特征和平面特征"""
        # 计算点云曲率
        curvature = []
        for i in range(1, len(scan)-1):
            c = scan[i-1] + scan[i+1] - 2*scan[i]
            curvature.append(np.linalg.norm(c))
        # 按曲率排序，大的为边缘点，小的为平面点
        threshold = np.percentile(curvature, 80)
        edges = [scan[i] for i, c in enumerate(curvature) if c > threshold]
        planes = [scan[i] for i, c in enumerate(curvature) if c <= threshold]
        return edges, planes

    def imu_preintegration(self, accel, gyro, dt):
        """IMU 预积分：加速度→速度→位置"""
        # 陀螺仪 → 角速度积分 → 姿态
        # 加速度计 → 去除重力 → 加速度积分 → 速度 → 位置
        orientation = np.dot(self._skew(gyro*dt), self.pose[:3,:3])
        velocity = self.velocity + (accel - self.gravity) * dt
        position = self.position + velocity * dt + 0.5*(accel-self.gravity)*dt**2
        return position, orientation, velocity
```

### Cartographer 配置要点

```lua
-- cartographer_rm.lua
options = {
  map_builder = MAP_BUILDER,
  map_frame = "map",
  tracking_frame = "base_link",
  published_frame = "odom",
  TRAJECTORY_BUILDER_2D = {
    min_range = 0.1,    -- 最小检测距离
    max_range = 40.0,   -- Livox Mid360 最大量程
    num_accumulated_range_data = 1,
    voxel_filter_size = 0.05,  -- 5cm 体素滤波
    use_imu_data = true,        -- 启用 IMU
    ceres_scan_matcher = {
      occupied_space_weight = 1.0,
      translation_weight = 10.0,
      rotation_weight = 40.0,
    },
  },
}
```

---

## 三、路径规划

### 全局规划：A* 算法

```python
import heapq

def astar(start, goal, grid):
    """A* 全局路径规划"""
    open_list = [(0, start)]
    came_from = {}
    g_score = {start: 0}

    def heuristic(a, b):
        return abs(a[0]-b[0]) + abs(a[1]-b[1])  # 曼哈顿距离

    while open_list:
        _, current = heapq.heappop(open_list)
        if current == goal:
            # 回溯路径
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            return path[::-1]

        for dx, dy in [(0,1),(0,-1),(1,0),(-1,0),
                       (1,1),(1,-1),(-1,1),(-1,-1)]:
            neighbor = (current[0]+dx, current[1]+dy)
            if not (0 <= neighbor[0] < len(grid) and
                    0 <= neighbor[1] < len(grid[0])):
                continue
            if grid[neighbor[0]][neighbor[1]] == 1:  # 障碍物
                continue

            dist = 1.414 if dx and dy else 1.0
            tentative_g = g_score[current] + dist
            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                g_score[neighbor] = tentative_g
                f_score = tentative_g + heuristic(neighbor, goal)
                heapq.heappush(open_list, (f_score, neighbor))
                came_from[neighbor] = current
    return None
```

### 局部规划：DWA（动态窗口法）

```python
def dwa_planner(current_pose, current_vel, goal, obstacles, config):
    """DWA 局部避障"""
    best_score = -float('inf')
    best_cmd = (0, 0, 0)

    # 速度采样空间
    vx_samples = np.linspace(config['vx_min'], config['vx_max'], 10)
    vy_samples = np.linspace(config['vy_min'], config['vy_max'], 10)
    vw_samples = np.linspace(config['vw_min'], config['vw_max'], 10)

    for vx in vx_samples:
        for vy in vy_samples:
            for vw in vw_samples:
                # 1. 预测轨迹 (dt=3s, 步长0.1s)
                traj = predict_trajectory(current_pose, vx, vy, vw, 3.0, 0.1)
                # 2. 碰撞检测
                if check_collision(traj, obstacles):
                    continue
                # 3. 轨迹评价
                goal_dist   = 1.0 / (distance_to_goal(traj[-1], goal) + 1e-6)
                speed_score = np.sqrt(vx**2 + vy**2)
                obstacle_clearance = min_distance_to_obstacles(traj, obstacles)
                score = 0.4 * goal_dist + 0.3 * speed_score + 0.3 * obstacle_clearance
                if score > best_score:
                    best_score = score
                    best_cmd = (vx, vy, vw)
    return best_cmd
```

---

## 四、决策系统（有限状态机）

### 状态定义

```python
from enum import Enum

class SentryState(Enum):
    IDLE      = 0   # 空闲待命
    PATROL    = 1   # 巡逻
    CHASE     = 2   # 追击敌人
    DEFEND    = 3   # 防守射击
    ESCAPE    = 4   # 紧急撤退
    RECHARGE  = 5   # 回充/补给

class SentryFSM:
    def __init__(self):
        self.state = SentryState.IDLE
        self.target_pos = None
        self.health = 100
        self.ammo = 500

    def update(self, enemies_detected, nearest_enemy_dist, health):
        self.health = health
        # 状态转换逻辑
        if health < 30:                       # 血量低 → 撤退
            self.state = SentryState.ESCAPE
        elif nearest_enemy_dist < 200:        # 敌人很近 → 防守
            self.state = SentryState.DEFEND
        elif enemies_detected:                # 发现敌人 → 追击
            self.state = SentryState.CHASE
        elif self.state == SentryState.CHASE and not enemies_detected:
            self.state = SentryState.PATROL   # 丢失敌人 → 巡逻
        elif self.state == SentryState.IDLE:
            self.state = SentryState.PATROL   # 空闲 → 巡逻

    def get_action(self):
        """根据当前状态返回目标行为"""
        actions = {
            SentryState.IDLE:     ('wait', None),
            SentryState.PATROL:   ('navigate', self.patrol_waypoints()),
            SentryState.CHASE:    ('navigate', self.target_pos),
            SentryState.DEFEND:   ('navigate', self.target_pos),
            SentryState.ESCAPE:   ('navigate', self.safe_point),
            SentryState.RECHARGE: ('navigate', self.recharge_point),
        }
        return actions[self.state]
```

---

## 五、ROS2 仿真环境搭建

### 深圳北理莫斯科大学 pb_rm_simulation 架构

```
pb_rm_simulation/
├── launch/
│   ├── simulation.launch.py    # Gazebo 仿真启动
│   └── navigation.launch.py   # 导航启动
├── worlds/
│   ├── rmuc_world.world        # RMUC 比赛地图
│   └── rmul_world.world        # RMUL 比赛地图
├── models/
│   ├── sentry/                 # 哨兵 URDF/SDF 模型
│   └── obstacles/              # 障碍物模型
├── config/
│   ├── slam.yaml               # SLAM 参数
│   ├── planner.yaml            # 规划器参数
│   └── controller.yaml         # 控制器参数
└── scripts/
    ├── map_generator.py        # 地图生成
    └── data_recorder.py        # 数据记录
```

### Sim2Real 迁移策略

| 步骤 | 仿真 | 真实 |
|------|------|------|
| 1. 传感器噪声模拟 | 添加高斯噪声 | 真实噪声 |
| 2. 运动学模型 | PID 理想模型 | 实测模型 |
| 3. 定位精度 | 无误差 Ground Truth | GPS/里程计漂移 |
| 4. 策略验证 | 100% 仿真测试 | 增量实机验证 |

---

## 六、开源项目参考

| 项目 | 战队 | 平台 | 亮点 |
|------|------|------|------|
| [KDRobot_RM2023Sentry_Navigation](https://gitee.com/KDRobot) | 河北科大 | Gitee | ROS 哨兵导航、Cartographer |
| [pb_rm_simulation](https://gitee.com/SMBU-POLARBEAR) | 深圳北理莫斯科 | Gitee | Gazebo仿真、完整哨兵 |
| [pb2025_sentry_nav](https://github.com/SMBU-PolarBear-Robotics-Team) | 深圳北理莫斯科 | GitHub | 2025 赛季真实导航 |
| [RM2024_SMBU_auto_sentry_ws](https://gitee.com/SMBU-POLARBEAR) | 深圳北理莫斯科 | Gitee | 自动哨兵上位机 |
| [roborts_decision](https://github.com/RoboMaster) | 官方 | GitHub | RoboRTS 决策模块 |
| [rm_navigation](https://github.com/RoboMaster) | 官方 | GitHub | 官方导航栈 |

**学习资料**：
- 《Probabilistic Robotics》- Sebastian Thrun
- ROS Navigation 教程：https://wiki.ros.org/navigation/Tutorials
- Cartographer 文档：https://google-cartographer-ros.readthedocs.io
- bilibili RM 导航教程系列