---
name: RoboMaster 电控系统
description: 提供 RoboMaster 电控系统全面详解，包括双板架构、FreeRTOS 多任务、三环 PID、底盘运动学解算、功率限制、云台小陀螺和视觉目标跟踪算法，附带完整代码示例
version: 2.0.0
author: RoboMaster技术团队
tags:
  - RoboMaster
  - 电控系统
  - PID
  - FreeRTOS
  - 底盘控制
---

# RoboMaster 电控系统

## 一、系统架构分层设计

```
┌─────────────────────────────────────────┐
│           应用层 (Application)          │
│  底盘控制 · 云台控制 · 发射控制 · 裁判  │
└────────────────┬────────────────────────┘
│ 中间件层 (Middleware)                   │
│ FreeRTOS · 协议栈 · 滤波算法            │
└────────────────┬────────────────────────┘
│ 驱动层 (Driver)                         │
│ 电机驱动 · 传感器驱动 · CAN 协议栈      │
└────────────────┬────────────────────────┘
│ 硬件抽象层 (HAL)                        │
│ GPIO · Timer · ADC · SPI · I2C · CAN   │
└─────────────────────────────────────────┘
```

### 硬件抽象层 (HAL)
封装底层硬件：GPIO 控制、定时器配置、ADC 采样、CAN 通信等。提供统一接口供上层调用，实现硬件解耦。

### 驱动层
针对特定外设的驱动：电机驱动（M3508/M2006/GM6020）、IMU 陀螺仪、编码器、裁判系统数据解析等。

### 中间件层
FreeRTOS 实时操作系统、CAN 通信协议栈、数据处理算法（滤波、状态估计）。

### 应用层
实现具体功能：底盘运动控制、云台姿态控制、发射机构控制、裁判系统交互。

---

## 二、双板控制架构

步兵机器人采用双板物理隔离设计（A 型底盘板 + C 型云台板）：

```
┌──────────────────┐    CAN/串口    ┌──────────────────┐
│   底盘控制板     │◄──────────────►│   云台控制板     │
│   (A 型开发板)   │                │   (C 型开发板)   │
├──────────────────┤                ├──────────────────┤
│ · 运动学解算     │                │ · 姿态稳定       │
│ · 功率限制       │                │ · 目标跟踪       │
│ · 电机驱动       │                │ · 射击控制       │
│ · 2ms 控制周期   │                │ · 1ms 控制周期   │
└──────────────────┘                └──────────────────┘
```

**优势**：
- 职责明确，各板独立调试
- 控制周期独立优化
- 故障隔离好

---

## 三、FreeRTOS 实时操作系统

### 任务创建代码

```c
#include "FreeRTOS.h"
#include "task.h"

void Chassis_Task(void *argument) {
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(2);
    xLastWakeTime = xTaskGetTickCount();
    for(;;) {
        Chassis_Control();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void Gimbal_Task(void *argument) {
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(1);
    xLastWakeTime = xTaskGetTickCount();
    for(;;) {
        Gimbal_Control();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void Shoot_Task(void *argument) {
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(5);
    xLastWakeTime = xTaskGetTickCount();
    for(;;) {
        Shoot_Control();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void Referee_Task(void *argument) {
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(10);
    xLastWakeTime = xTaskGetTickCount();
    for(;;) {
        Referee_Communication();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void MX_FREERTOS_Init(void) {
    xTaskCreate(Chassis_Task, "Chassis", 256, NULL, 5, &ChassisTask_Handle);
    xTaskCreate(Gimbal_Task,  "Gimbal",  256, NULL, 6, &GimbalTask_Handle);
    xTaskCreate(Shoot_Task,   "Shoot",   256, NULL, 4, &ShootTask_Handle);
    xTaskCreate(Referee_Task, "Referee", 512, NULL, 3, &RefereeTask_Handle);
    vTaskStartScheduler();
}
```

### 任务优先级表（遵循 RMS 原则）

| 任务 | 周期 | 优先级 | 原因 |
|------|------|--------|------|
| 云台控制 | 1ms | 6（最高） | 瞄准响应要求最高 |
| 底盘控制 | 2ms | 5 | 实时解算 |
| 发射控制 | 5ms | 4 | 射击节奏 |
| 裁判通信 | 10ms | 3 | 数据交互 |
| 电池监控 | 100ms | 2 | 后台 |

### 任务间通信（队列）

```c
QueueHandle_t Gimbal_Queue;

void Chassis_Task(void *argument) {
    Chassis_Data_t chassis_data;
    for(;;) {
        if(xQueueReceive(Gimbal_Queue, &chassis_data, portMAX_DELAY) == pdTRUE) {
            Chassis_Solve(&chassis_data);
        }
    }
}

void Gimbal_Task(void *argument) {
    Gimbal_Data_t gimbal_data;
    for(;;) {
        Gimbal_Control();
        gimbal_data.yaw_angle   = Get_Yaw_Angle();
        gimbal_data.pitch_angle = Get_Pitch_Angle();
        xQueueSend(Gimbal_Queue, &gimbal_data, 0);
    }
}
```

---

## 四、PID 控制算法

### 位置式 PID（完整实现）

```c
typedef struct {
    float target, feedback, error, last_error;
    float integral, output;
    float kp, ki, kd;
    float output_max, integral_max;
} PID_Controller_t;

void PID_Init(PID_Controller_t *pid, float kp, float ki, float kd,
              float output_max, float integral_max) {
    pid->kp = kp; pid->ki = ki; pid->kd = kd;
    pid->output_max = output_max;
    pid->integral_max = integral_max;
    pid->integral = 0;  pid->last_error = 0;
}

float PID_Calculate(PID_Controller_t *pid, float target, float feedback) {
    pid->target = target;  pid->feedback = feedback;
    pid->error = target - feedback;
    pid->integral += pid->error;
    // 积分限幅
    LIMIT(pid->integral, -pid->integral_max, pid->integral_max);

    float derivative = pid->error - pid->last_error;
    pid->last_error = pid->error;

    pid->output = pid->kp * pid->error
                + pid->ki * pid->integral
                + pid->kd * derivative;
    // 输出限幅
    LIMIT(pid->output, -pid->output_max, pid->output_max);
    return pid->output;
}
```

### 增量式 PID

```c
typedef struct {
    float target, feedback, error, last_error, last_last_error;
    float output, output_delta;
    float kp, ki, kd, output_max;
} Incremental_PID_t;

float Incremental_PID_Calculate(Incremental_PID_t *pid, float target, float feedback) {
    pid->error = target - feedback;
    pid->output_delta = pid->kp * (pid->error - pid->last_error)
                      + pid->ki * pid->error
                      + pid->kd * (pid->error - 2*pid->last_error + pid->last_last_error);
    pid->last_last_error = pid->last_error;
    pid->last_error = pid->error;
    pid->output += pid->output_delta;
    LIMIT(pid->output, -pid->output_max, pid->output_max);
    return pid->output;
}
```

### 串级 PID（三环控制）

```
目标角度 ──► [角度环 PID] ──► 目标速度 ──► [速度环 PID] ──► 目标电流 ──► [电流环 PID] ──► 电机
              ▲                                    ▲                               ▲
              │ 实际角度                            │ 实际速度                       │ 实际电流
              └── 编码器反馈 ────────────────────────┘──────────────────────────────┘
```

```c
typedef struct {
    PID_Controller_t angle_pid;
    PID_Controller_t speed_pid;
    PID_Controller_t current_pid;
} Cascade_PID_t;

void Cascade_PID_Init(Cascade_PID_t *c,
    float akp, float aki, float akd,   // 角度环
    float skp, float ski, float skd,   // 速度环
    float ckp, float cki, float ckd) { // 电流环
    PID_Init(&c->angle_pid,   akp, aki, akd, 500,   1000);
    PID_Init(&c->speed_pid,   skp, ski, skd, 16000, 10000);
    PID_Init(&c->current_pid, ckp, cki, ckd, 16000, 0);
}

float Cascade_PID_Calculate(Cascade_PID_t *c, float target_angle,
    float current_angle, float current_speed, float current_current) {
    // 角度环 → 目标速度
    float target_speed = PID_Calculate(&c->angle_pid, target_angle, current_angle);
    // 速度环 → 目标电流
    float target_current = PID_Calculate(&c->speed_pid, target_speed, current_speed);
    // 电流环 → 最终输出
    return PID_Calculate(&c->current_pid, target_current, current_current);
}
```

### PID 参数整定流程

| 步骤 | 操作 | 判断标准 |
|------|------|---------|
| 1. 整定 Kp | 从 0 增大到出现振荡，再减小 20-30% | 系统快速响应无振荡 |
| 2. 整定 Ki | 从小开始增大，消除稳态误差 | 稳态误差趋近于 0 |
| 3. 整定 Kd | 从小到大，抑制超调 | 无明显超调和振荡 |
| 4. 微调 | 综合优化 | 满足所有指标 |

### 典型参数参考

| 控制对象 | Kp | Ki | Kd | 备注 |
|---------|----|----|----|------|
| 底盘速度环 | 10-50 | 0.1-1 | 0-10 | 机械特性决定 |
| 云台角度环 | 50-200 | 0.5-5 | 10-50 | 响应要求最高 |
| 发射机构 | 5-20 | 0.1-0.5 | 0-5 | 相对独立 |
| 拨弹电机 | 15-30 | 0.2-1 | 0-5 | 需要快速响应 |

---

## 五、底盘运动控制

### 麦克纳姆轮运动学解算

```c
typedef struct {
    float vx, vy, vw;               // 期望速度
    float wheel_speed[4];           // 四轮转速
    float wheel_radius;             // 轮子半径
    float chassis_radius;           // 底盘半宽/半长
} Mecanum_Chassis_t;

void Mecanum_Calc_Speed(Mecanum_Chassis_t *c) {
    float A = c->vx;
    float B = c->vy;
    float C = c->vw * c->chassis_radius;
    // 四轮速度分配（麦轮 45° 辊子力学合成）
    c->wheel_speed[0] = A + B + C;  // 右前
    c->wheel_speed[1] = A - B + C;  // 左前
    c->wheel_speed[2] = A - B - C;  // 左后
    c->wheel_speed[3] = A + B - C;  // 右后
    for(int i = 0; i < 4; i++)
        c->wheel_speed[i] /= c->wheel_radius;
}
```

### 功率限制算法

```c
typedef struct {
    float chassis_power;
    float chassis_power_buffer;
    float chassis_power_max;
    float current_sum, current_max;
} Power_Control_t;

void Power_Control(Power_Control_t *p, Motor_Feedback_t *motor, int16_t *current) {
    p->current_sum = 0;
    for(int i = 0; i < 4; i++)
        p->current_sum += abs(motor[i].current);

    if(p->current_sum > p->current_max) {
        float scale = p->current_max / p->current_sum;
        for(int i = 0; i < 4; i++)
            current[i] = (int16_t)(current[i] * scale);
    }
    p->chassis_power = motor[0].speed * motor[0].current
                     + motor[1].speed * motor[1].current
                     + motor[2].speed * motor[2].current
                     + motor[3].speed * motor[3].current;
}
```

### 斜坡规划器

```c
typedef struct {
    float target, current, step, max_step;
} Ramp_Filter_t;

void Ramp_Init(Ramp_Filter_t *r, float step_max) {
    r->current = 0;  r->target = 0;
    r->step = 0;     r->max_step = step_max;
}

float Ramp_Calculate(Ramp_Filter_t *r, float target) {
    r->target = target;
    float error = target - r->current;
    if(error > r->max_step)       r->step = r->max_step;
    else if(error < -r->max_step) r->step = -r->max_step;
    else                          r->step = error;
    r->current += r->step;
    return r->current;
}
```

---

## 六、云台控制策略

### 小陀螺战术实现

核心思想：底盘旋转 + 云台稳定 = 解耦控制

```c
typedef struct {
    float gimbal_yaw_angle;
    float chassis_yaw_angle;
    float relative_angle;
    float absolute_yaw_target;
} Top_Gyro_t;

void Top_Gyro_Control(Top_Gyro_t *t, float chassis_yaw,
                      float gimbal_yaw, float target_absolute) {
    t->chassis_yaw_angle = chassis_yaw;
    t->gimbal_yaw_angle  = gimbal_yaw;
    float relative_target = target_absolute - chassis_yaw;
    // 角度归一化到 [-180, 180]
    if(relative_target > 180)   relative_target -= 360;
    if(relative_target < -180)  relative_target += 360;
    t->absolute_yaw_target = relative_target;
}
```

---

## 七、视觉目标跟踪

```c
typedef struct {
    float x, y, vx, vy;
    float last_x, last_y;
} Target_Track_t;

void Target_Predict(Target_Track_t *t, float mx, float my, float dt) {
    t->vx = (mx - t->last_x) / dt;
    t->vy = (my - t->last_y) / dt;
    t->last_x = t->x;  t->last_y = t->y;
    t->x = mx + t->vx * dt;
    t->y = my + t->vy * dt;
}

void Target_Smooth(Target_Track_t *t, float mx, float my, float alpha) {
    t->x = alpha * mx + (1 - alpha) * t->x;
    t->y = alpha * my + (1 - alpha) * t->y;
}
```

---

## 开源项目参考

### 官方
| 项目 | 说明 |
|------|------|
| **RoboRTS-Firmware** | 官方步兵固件，完整软件栈 (FreeRTOS+三环PID) |

### 战队开源（含仓库链接）
| 战队 | 项目 | 平台 | 亮点 |
|------|------|------|------|
| **河北工业大学山海 Mas** | 2024 麦轮步兵电控 | [Gitee](https://gitee.com) | 双板通信、功率模型 |
| **中科大 RoboWalker** | 2025 电控教程 | [Gitee](https://gitee.com) | 力控底盘、教学资料 |
| **北京工业大学 PIP** | 2024 平衡步兵 | [GitHub](https://github.com) | 机械+电控+仿真 |
| **辽宁科大 COD** | COD-H7-Template | [Gitee](https://gitee.com/LNUT-COD) | STM32H723、达妙MC02 |
| **青岛大学未来** | qdu-rm-mcu | [GitHub](https://github.com/QduFutureTeam) | 底盘+云台+功率 |
| **上海交大** | 哨兵电控 | [GitHub](https://github.com) | 自主防御 |
| **华南理工华南虎** | 步兵电控 | [GitHub](https://github.com/SCUT-RobotTeam) | 全机器人控制 |

### 学习资料
- CSDN《RoboMaster 电机 PID 参数整定》
- CSDN《小陀螺战术实现》
- bilibili RoboMaster 电控教程系列
- 《PID 控制器设计与参数整定方法》