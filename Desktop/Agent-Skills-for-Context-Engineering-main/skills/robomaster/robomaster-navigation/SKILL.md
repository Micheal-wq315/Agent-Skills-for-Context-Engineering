---
name: RoboMaster 导航系统
description: 提供 RoboMaster 哨兵导航系统完整设计指南，包括 LiDAR-IMU 紧耦合 SLAM、A*/DWA 分层路径规划、有限状态机决策系统、ROS2 仿真环境、Sim2Real 迁移策略和开源项目深度分析
version: 2.1.0
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
| **LiDAR SLAM (Cartographer)** | 很高 | 高 | 无 | 哨兵标配 |
| **Visual SLAM (ORB-SLAM3)** | 中 | 低 | 严重 | 室内纹理丰富 |
| **LiDAR-IMU (LIO-SAM)** | 很高 | 高 | 无 | 高精度需求 |
| **2D LiDAR (GMapping)** | 中 | 中 | 无 | 低预算方案 |

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
                # 1. 预测轨迹 (dt=3s, 步长 0.1s)
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

## 六、开源项目深度分析

### 项目 1：河北科技大学 - KDRobot_RM2023Sentry_Navigation

**仓库地址**：https://gitee.com/KDRobot/KDRobot_RM2023Sentry_Navigation

**战队**：河北科技大学 Actor & Thinker

**为什么好**：
- ✅ **完整的 ROS 哨兵导航系统**：从建图到定位到规划，全链路实现
- ✅ **Cartographer 集成**：直接使用成熟的 Google Cartographer SLAM 库
- ✅ **详细的中文教程**：包含环境配置、运行步骤、参数调优指南
- ✅ **多个赛季沉淀**：2022-2023 赛季的迭代，代码成熟稳定
- ✅ **新手友好**：README 非常详细，问题解决记录完整

**技术亮点**：
- 多传感器融合方案（LiDAR + IMU + 里程计）
- 全局与局部规划分离，路径平滑
- 有限状态机决策，逻辑清晰

**学习建议**：先跑仿真，再逐步移植到真实硬件

### 项目 2：深圳北理莫斯科大学 - pb_rm_simulation

**仓库地址**：https://gitee.com/SMBU-POLARBEAR/pb_rm_simulation

**战队**：深圳北理莫斯科大学 北极熊

**为什么好**：
- ✅ **高质量仿真环境**：Gazebo 建模精细，接近真实比赛场地
- ✅ **完整的哨兵架构**：从感知到控制到决策，代码完整
- ✅ **Sim2Real 设计**：仿真与真实硬件代码复用率高
- ✅ **ROS2 支持**：使用最新的 ROS2，技术栈前沿
- ✅ **文档齐全**：每个模块都有详细的架构说明

**技术亮点**：
- 模块化插件架构，方便扩展
- 支持多种导航算法切换
- 完整的测试和验证工具链

**学习建议**：先学习仿真环境搭建，再逐步迁移算法

### 项目 3：深圳北理莫斯科大学 - pb2025_sentry_nav

**仓库地址**：https://github.com/SMBU-PolarBear-Robotics-Team/pb2025_sentry_nav

**战队**：深圳北理莫斯科大学 北极熊（2025 赛季）

**为什么好**：
- ✅ **最新赛季代码**：2025 赛季的最新技术方案
- ✅ **真实硬件验证**：已经在真实哨兵上跑通的代码
- ✅ **性能优化**：针对赛场特定场景做了优化
- ✅ **问题解决记录**：包含大量调试日志和问题分析
- ✅ **持续更新**：赛季过程中持续迭代改进

**技术亮点**：
- LiDAR-IMU 紧耦合，定位精度更高
- 动态路径重规划，响应更快
- 多地图切换，支持多种场地

**学习建议**：先看 2024 版本，再看 2025 改进部分

### 项目 4：深圳北理莫斯科大学 - RM2024_SMBU_auto_sentry_ws

**仓库地址**：https://gitee.com/SMBU-POLARBEAR/RM2024_SMBU_auto_sentry_ws

**战队**：深圳北理莫斯科大学 北极熊

**为什么好**：
- ✅ **自动哨兵完整 Workspace**：一站式配置，开箱即用
- ✅ **上层决策完善**：状态机设计非常完整，覆盖各种赛场情况
- ✅ **多线程架构**：感知、规划、决策、控制分离，延迟低
- ✅ **可视化调试**：大量 RViz 可视化面板，调试方便
- ✅ **日志完善**：方便复现问题和分析性能

**技术亮点**：
- 基于行为树的决策系统
- 动态威胁评估和优先级排序
- 完整的电池监控和回充逻辑

**学习建议**：重点学习决策系统的设计思路

### 项目 5：RoboMaster 官方 - roborts_decision

**仓库地址**：https://github.com/RoboMaster/roborts_decision

**作者**：大疆官方

**为什么好**：
- ✅ **官方标准实现**：代码规范，架构设计优秀
- ✅ **行为树框架**：使用 BT++ 行为树，决策逻辑清晰
- ✅ **多机器人支持**：步兵、英雄、哨兵都有实现
- ✅ **战术丰富**：包含多种战术策略模板
- ✅ **文档完善**：官方教程和 API 文档齐全

**技术亮点**：
- 模块化行为树，战术可配置
- 支持多机器人协同
- 完整的裁判系统集成

**学习建议**：先学习官方架构，再根据自己需求定制

### 项目 6：RoboMaster 官方 - rm_navigation

**仓库地址**：https://github.com/RoboMaster/rm_navigation

**作者**：大疆官方

**为什么好**：
- ✅ **官方导航栈**：与 RoboMaster 硬件兼容性最好
- ✅ **多种算法集成**：GMapping、Cartographer、AMCL 等都有配置
- ✅ **参数优化**：官方针对比赛场地做了参数调优
- ✅ **文档齐全**：教程从建图到部署都有
- ✅ **长期维护**：官方持续更新，技术支持好

**技术亮点**：
- 多传感器融合定位
- 动态避障和路径重规划
- 完整的导航监控和调试工具

**学习建议**：新手首选官方导航栈，稳定可靠

---

## 七、算法选择建议

### 场景 1：入门学习，预算有限

**推荐方案**：GMapping + AMCL + DWA + 有限状态机
**理由**：
- 2D LiDAR 价格低（思岚 A1 或 LD06）
- 算法成熟，教程多
- 满足基础导航需求
- **参考开源**：官方 rm_navigation、河北科技大学 2022

### 场景 2：中等配置，追求稳定

**推荐方案**：Cartographer + TEB + 有限状态机
**理由**：
- Cartographer 定位稳定，漂移小
- TEB 规划路径更平滑
- 无需深度相机，成本适中
- **参考开源**：河北科技大学 2023、北极熊 2024

### 场景 3：高性能，追求极致

**推荐方案**：LIO-SAM + Fast-Planner + 行为树
**理由**：
- LiDAR-IMU 紧耦合，定位精度最高
- Fast-Planner 规划速度快，适合动态环境
- 行为树决策更灵活，战术丰富
- **参考开源**：北极熊 2025、官方 roborts_decision

---

## 八、学习资料

| 类型 | 资源 | 链接/说明 |
|------|------|------|
| **书籍** | 《Probabilistic Robotics》 | Sebastian Thrun 经典 |
| | 《移动机器人导航与定位》 | 理论与实践结合 |
| **官方文档** | ROS Navigation 教程 | https://wiki.ros.org/navigation/Tutorials |
| | Cartographer 文档 | https://google-cartographer-ros.readthedocs.io |
| **视频教程** | bilibili "RoboMaster 导航" | 多个战队的教程系列 |
| | bilibili "SLAM 从入门到放弃" | 系统性学习路径 |
| **实践资源** | Gazebo 教程 | 学习仿真环境搭建 |
| | ROS2 官方教程 | 掌握现代机器人系统 |
