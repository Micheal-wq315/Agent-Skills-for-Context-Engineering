---
name: RoboMaster 机甲大师全能助手
description: 提供 RoboMaster 2026 赛季规则详解、机器人硬件架构设计、电机控制策略、通信协议详解、裁判系统应用、优秀开源项目推荐以及技术社区资源汇总。本技能涵盖从入门到精通的全面技术指南，包括电控系统架构、PID控制算法、底盘运动控制、云台控制策略等核心内容。
version: 1.1.0
author: RoboMaster技术团队
tags:
  - RoboMaster
  - 机甲大师
  - 电控系统
  - PID控制
  - 机器人竞赛
---

# RoboMaster 机甲大师全能助手

## 简介

本技能文档旨在为 RoboMaster 机甲大师赛参赛队伍提供从入门到精通的全面技术指南。文档涵盖 2026 赛季最新规则深度解析、机器人硬件架构设计、电机控制策略、通信协议详解、裁判系统应用、优秀开源项目推荐以及技术社区资源汇总。通过整合官方规则手册、开源代码仓库、技术博客文章等多源信息，本文档力求成为参赛队员备战 RoboMaster 比赛的全方位技术参考手册。

本文档具有自我更新能力，通过引用的官方链接和开源资源，用户可以获取最新的赛季动态、技术更新和代码实现。建议用户定期查阅引用的资源链接，以获取最新的技术资料和赛事信息。

---

## 第一篇：RoboMaster 2026 赛季规则深度详解

### 一、比赛概述与核心机制

RoboMaster 机甲大师超级对抗赛是由大疆创新（DJI）主办的大学生机器人竞技比赛。2026 赛季的比赛形式为红蓝双方对抗，每支队伍需要自主研发多种功能的机器人，在规定场地内进行激烈的战术对抗。比赛的核心目标是通过操控机器人发射弹丸攻击对方机器人和基地，最终以基地剩余血量判定胜负。

在 2026 赛季中，对战双方需自主研发不同种类和功能的机器人，在指定的比赛场地内进行战术对抗，通过操控机器人发射弹丸攻击对方机器人和基地。比赛结束时，基地剩余血量高的一方获得比赛胜利。核心是设计并部署具备自主能力的多类型机器人，在动态对抗环境中完成识别、移动、瞄准、射击、补给等复杂任务。

比赛采用类似王者荣耀的对抗模式，要求参赛队独立设计制作多个不同兵种的机器人，参与机器人对抗赛。各机器人通过发射弹丸与敌方机器人及基地进行交互，比赛过程集技术性、对抗性、观赏性于一体，对参赛队员的机械设计能力、电子开发能力、嵌入式编程能力、机器视觉算法能力以及团队协作能力都提出了极高要求。

### 二、机器人类型详解

#### （一）步兵机器人

步兵机器人是 RoboMaster 赛场上数量最多、机动性最强的作战单位，通常每队配置 2 至 3 台。步兵的主要定位是灵活机动的输出单位，发射 17mm 标准弹丸执行攻击任务。其典型硬件配置包括标准底盘配合 M3508 电机驱动轮组、云台搭载 GM6020 高速电机实现快速响应、17mm 发射机构完成弹丸射击。步兵机器人血量设定为中等水平，但由于数量优势和出色的机动性，在战场上承担着骚扰、支援、侦查等多重战术角色。

步兵的机械结构设计通常采用麦克纳姆轮或全向轮底盘，实现任意方向的平移运动，这对于小陀螺战术的实现至关重要。小陀螺战术是步兵机器人的标志性操作方式，通过底盘持续旋转配合云台稳定瞄准，使机器人能够以旋转姿态快速移动，同时保持对目标的持续火力输出。

步兵机器人的电控系统通常采用双板控制架构，即底盘控制板（A 型开发板）和云台控制板（C 型开发板）分离设计。这种分布式控制方案能够有效降低单板负载，提高系统实时性。

#### （二）英雄机器人

英雄机器人是赛场上的主力输出火力平台，发射 42mm 大弹丸，具有单发伤害高、攻击力强的特点。其典型配置为大型底盘配合多个 M3508 驱动电机、云台使用 GM6020 高速电机实现稳定瞄准、42mm 发射机构提供强大火力输出。英雄机器人血量设定较高，但相应地尺寸较大、机动性相对较低。

#### （三）工程机器人

工程机器人是赛场上的辅助支援单位，虽然不配备攻击能力，但在比赛中发挥着至关重要的作用。工程机器人的核心功能包括兑换金币获取装备优势、救援阵亡的友方机器人、触发场地机关获得增益效果。典型配置为中型底盘配合 M3508 驱动、机械臂或抓取机构完成物资存取操作。

#### （四）空中机器人

空中机器人提供独特的空中支援视角和能力，通常为四旋翼飞行平台搭载轻量级发射机构。在部分赛季规则中，空中机器人可以进行空中观测、战术信息传递，特定情况下也可执行空中打击任务。

#### （五）哨兵机器人

哨兵机器人是基地的自动防御单位，完全自主运行无需手动操控。哨兵机器人只能在基地轨道上移动，自动识别进入基地防御范围的敌方机器人并发起攻击。

#### （六）雷达机器人

雷达机器人部署于己方半场，承担战场态势感知和战术信息提供的重要职责。雷达通过视觉识别和数据分析，探测敌方机器人的位置和运动状态，为操作员提供全局战场信息。

### 三、比赛流程与胜负判定

#### （一）比赛时间结构

RoboMaster 超级对抗赛的标准比赛时长为 7 分钟，划分为多个阶段。准备阶段双方进行机器人部署和系统检查；启动阶段完成机器人激活和状态确认；战术阶段为主战斗时间；基地摧毁阶段为决胜时刻。

#### （二）胜负判定机制

比赛胜负的核心判定依据为基地剩余血量。比赛结束时，基地剩余血量高的一方获胜。若一方基地血量提前归零，则另一方立即获胜。

#### （三）血量系统详解

每个机器人拥有独立的血量值，被弹丸攻击时根据弹丸类型和命中部位扣除相应血量。当血量归零时，机器人进入“死亡”状态，失去作战功能。

### 四、场地机关与增益系统

#### （一）场地地形要素

比赛场地包含多种地形元素，包括标准地面、飞坡、资源岛、高地和基地等，对机器人设计和战术策略产生重要影响。

#### （二）机关类型与功能

场地机关包括增益机关、能量机关、兑换机关和救援点四种类型，各具不同的功能效果。

### 五、操作员界面系统

操作员界面是选手控制机器人的核心终端系统，提供全面的战场信息和控制功能。

---

## 第二篇：机器人制作规范与硬件架构

### 一、硬件系统分层架构

RoboMaster 机器人采用典型的“控制层—传感层—执行层”三级分层架构，这种架构设计围绕实时性、鲁棒性和可维护性进行优化设计。控制层作为机器人的“大脑”，由主控制器承担决策、协调和指令下发功能；传感层作为“感官”，由各类传感器提供环境感知和状态反馈；执行层作为“执行器”，由电机、舵机等完成具体动作执行。

### 二、控制器选型指南

#### （一）C 型开发板详解

RoboMaster C 型开发板是赛事专用的高性能控制主板，核心规格如下：主控芯片采用 STM32F4 系列高性能 32 位 ARM Cortex-M4 处理器；板载陀螺仪和加速度计集成 IMU 模块；配置 2 路 CAN 总线接口（CAN1、CAN2）；提供多个 USART 串口通道；工作电压范围 5V 至 24V DC。

C 型开发板的典型应用场景包括云台控制、多传感器数据融合、复杂运动控制。接口资源包括多个 PWM 输出通道、GPIO 引脚、ADC 模拟输入通道、SPI/I2C 通信接口等。

#### （二）A 型开发板详解

A 型开发板同样基于 STM32F4 平台，专为底盘控制优化设计。特点包括丰富的 PWM 输出通道适合多电机驱动、完整的 CAN 总线接口支持分布式控制架构。

### 三、电机系统详解

#### （一）M3508 减速直流电机

M3508 是 RoboMaster 赛事最主流的底盘驱动电机，采用 P19 减速机构。核心电气参数如下：额定电压 DC 24V；峰值扭矩 3.7 N·m；额定扭矩 2.5 N·m；空载转速 480 rpm；减速比 19:1；配套 C620 电调。

#### （二）M2006 P36 直流无刷减速电机

M2006 P36 是针对精密控制场景优化的小型电机，核心参数包括：额定电压 DC 24V；峰值扭矩 0.75 N·m；额定扭矩 0.5 N·m；减速比 36:1；配套 C610 电调。

#### （三）GM6020 高速电机

GM6020 是大疆推出的云台专用一体化电机，内置电调设计简化了系统复杂度。核心参数：额定电压 DC 24V；空载转速 320 rpm；额定扭矩 1.2 N·m；额定电流 1.62A；内置电调无需外部驱动。

#### （四）电机扭矩排序与选型参考

减速后扭矩大小排序为 M3508 > GM6020 > M2006。选型时，底盘驱动推荐 M3508；云台电机可根据重量和响应需求选择 GM6020 或 M2006；精密小负载机构推荐 M2006。

### 四、电源系统设计

#### （一）电池规格

RoboMaster 机器人通常采用 LiPo 锂电池供电，常见规格包括 3S（11.1V）和 4S（14.8V）两种配置。电池容量范围通常为 2200mAh 至 6000mAh，放电倍率要求 25C 至 50C。

#### （二）电源分配架构

主电源总线通常直接采用电池电压（4S 为 24V）。通过 DC-DC 转换模块产生 12V、5V、3.3V 等多级电压供给不同子系统。

#### （三）电源设计原则

关键系统应采用冗余设计，各个子系统应独立配置保险丝，电源电路需要完整的电磁兼容设计。

---

## 第三篇：电控系统架构与软件框架

### 一、电控系统整体架构

#### （一）系统架构分层

RoboMaster 电控系统绝非孤立存在的硬件或代码模块，而是贯穿机器人全生命周期的中枢神经系统。它既不是机械结构的附庸，也不是算法决策的被动执行者，而是深度耦合机械、算法、结构、电源等多学科的系统集成枢纽。

在机器人研发体系中，“电控”并非一个孤立的技术模块，而是一个横跨硬件实现、软件逻辑与系统集成的工程枢纽。以 RoboMaster 赛事中的哨兵机器人为例，当规则要求其从轨道的任意位置自主防御入侵目标时，电控系统需要协调视觉识别、目标跟踪、弹道预测、功率限制等多重约束，这对软件架构的模块化设计提出了极高要求。

电控系统的核心架构通常包含以下几个层次：

**硬件抽象层（HAL）**：负责封装底层硬件操作，包括 GPIO 控制、定时器配置、ADC 采样、CAN 通信等。该层提供统一的接口供上层调用，实现硬件解耦。

**驱动层**：针对特定外设的驱动程序，如电机驱动、传感器驱动、通信协议栈等。该层直接与硬件交互，向上层提供标准化的数据接口。

**中间件层**：包含实时操作系统（RTOS）、通信协议栈、数据处理算法等通用组件。FreeRTOS 是 RoboMaster 电控系统中最常用的 RTOS 选择。

**应用层**：实现具体功能逻辑，如底盘运动控制、云台姿态控制、发射机构控制、裁判系统交互等。

#### （二）双板控制架构

RoboMaster 步兵机器人采用典型的分层控制系统架构，其硬件系统明确划分为控制层与执行层两大功能域。这种物理隔离的设计不仅符合工业控制系统可靠性要求，更具有良好的电磁兼容性。

步兵机器人的硬件系统采用分层控制结构，由核心控制器、执行机构与传感反馈单元三大部分构成。这种架构设计围绕实时性、鲁棒性进行优化，而非简单堆砌外设。

双板控制架构将控制任务分配到两个独立的控制器：底盘控制板（A 型开发板）负责底盘运动学解算、功率限制和电机驱动；云台控制板（C 型开发板）负责云台姿态稳定、目标跟踪和射击控制。两板之间通过 CAN 总线或串口进行数据交换。

这种架构的优势在于：各板职责明确，便于调试和维护；控制周期可独立优化，底盘控制可达 2ms，云台控制可达 1ms；故障隔离好，单板故障不影响其他功能。

### 二、实时操作系统 FreeRTOS

#### （一）FreeRTOS 概述

FreeRTOS 是一个专为嵌入式系统设计的实时操作系统，在 STM32 系列平台上，其轻量、易用、结构清晰的特点使其成为构建多任务系统的首选。在 RoboMaster 电控开发中，FreeRTOS 主要用于管理多个控制任务，实现实时调度。

RoboMaster 官方固件框架 RoboRTS-Firmware 提供了完整的软件栈，包括实时操作系统 FreeRTOS、标准 CMSIS-RTOS 接口、完整的电机控制和传感器驱动。

使用 FreeRTOS 可以有效地管理多个任务。通过 FreeRTOS 的任务调度机制，可以同时运行底盘控制、云台控制、视觉通信、裁判系统交互等多个任务，保证各任务的实时性要求。

#### （二）任务创建与优先级配置

```c
#include "FreeRTOS.h"
#include "task.h"

void Chassis_Task(void *argument)
{
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(2);
    xLastWakeTime = xTaskGetTickCount();
    
    for(;;)
    {
        Chassis_Control();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void Gimbal_Task(void *argument)
{
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(1);
    xLastWakeTime = xTaskGetTickCount();
    
    for(;;)
    {
        Gimbal_Control();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void Shoot_Task(void *argument)
{
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(5);
    xLastWakeTime = xTaskGetTickCount();
    
    for(;;)
    {
        Shoot_Control();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void Referee_Task(void *argument)
{
    TickType_t xLastWakeTime;
    const TickType_t xPeriod = pdMS_TO_TICKS(10);
    xLastWakeTime = xTaskGetTickCount();
    
    for(;;)
    {
        Referee_Communication();
        vTaskDelayUntil(&xLastWakeTime, xPeriod);
    }
}

void MX_FREERTOS_Init(void)
{
    xTaskCreate(Chassis_Task, "Chassis", 256, NULL, 5, &ChassisTask_Handle);
    xTaskCreate(Gimbal_Task, "Gimbal", 256, NULL, 6, &GimbalTask_Handle);
    xTaskCreate(Shoot_Task, "Shoot", 256, NULL, 4, &ShootTask_Handle);
    xTaskCreate(Referee_Task, "Referee", 512, NULL, 3, &RefereeTask_Handle);
    
    vTaskStartScheduler();
}
```

#### （三）任务调度与优先级分配

任务优先级分配需遵循速率单调调度（RMS）原则：周期越短的任务优先级越高，确保关键控制任务的及时执行。

RoboMaster 电控系统的典型任务配置如下：

| 任务名称 | 控制周期 | 优先级 | 说明 |
|---------|---------|--------|------|
| 云台控制任务 | 1ms | 6（最高） | 云台响应要求最高 |
| 底盘控制任务 | 2ms | 5 | 底盘实时性要求高 |
| 发射控制任务 | 5ms | 4 | 射击控制 |
| 裁判系统通信 | 10ms | 3 | 数据交互 |
| 电池监控任务 | 100ms | 2 | 低优先级后台任务 |

vTaskStartScheduler() 函数用于启动任务调度器，任务调度器启动后，FreeRTOS 便会开始进行任务调度。启动流程包括：初始化空闲任务、创建启动任务、配置心跳定时器、启动调度器。

#### （四）任务间通信

FreeRTOS 提供多种任务间通信机制，包括队列（Queue）、信号量（Semaphore）、互斥量（Mutex）和事件组（Event Group）。

```c
QueueHandle_t Gimbal_Queue;

void Chassis_Task(void *argument)
{
    Chassis_Data_t chassis_data;
    
    for(;;)
    {
        if(xQueueReceive(Gimbal_Queue, &chassis_data, portMAX_DELAY) == pdTRUE)
        {
            Chassis_Solve(&chassis_data);
        }
    }
}

void Gimbal_Task(void *argument)
{
    Gimbal_Data_t gimbal_data;
    
    for(;;)
    {
        Gimbal_Control();
        gimbal_data.yaw_angle = Get_Yaw_Angle();
        gimbal_data.pitch_angle = Get_Pitch_Angle();
        xQueueSend(Gimbal_Queue, &gimbal_data, 0);
    }
}
```

### 三、CAN 总线通信详解

#### （一）CAN 总线基础

CAN（Controller Area Network）总线是工业机器人最常用的通讯接口，在 RoboMaster 系统中承担电机控制、传感器通信等核心功能。CAN 总线的主要特点包括多主控制模式、优先级仲裁机制、完善的错误检测机制、高速传输能力（最高 1Mbps）。

CAN 总线通信因其高可靠性和实时性成为电机控制的黄金标准。大疆 RoboMaster 系列电机通过 CAN 协议传递的 8 字节数据包，蕴含着转速、角度、电流等关键状态信息。

大疆的这几款产品原本设计得非常容易上手，应该几天就能熟练使用。但是由于 C610、C620 电调选用了 CAN 总线通信，给不少初学者带来了困扰。然而使用这几个电机并不需要把 CAN 通信原理完全掌握，只需按照固定格式发送和接收数据即可。

#### （二）C 型板 CAN 接口配置

C 型开发板的 CAN1 接口通常使用 PB8（TX）和 PB9（RX）或 PA12（TX）和 PA11（RX）引脚。CAN2 接口通常使用 PB12（TX）和 PB13（RX）或 PB5（TX）和 PB6（RX）引脚。

配置时需要确保 CAN 总线终端电阻匹配（通常为 120Ω），波特率设置为 1Mbps。

#### （三）CAN 数据帧格式

标准 CAN 数据帧为 8 字节格式：

**发送数据帧（主控 → 电调）**：

| 字节位置 | 内容 | 说明 |
|---------|------|------|
| Byte 0-1 | 控制值低字节、控制值高字节 | 电流指令值（int16） |
| Byte 2-7 | 保留 | 通常填充 0 |

**接收数据帧（电调 → 主控）**：

| 字节位置 | 内容 | 说明 |
|---------|------|------|
| Byte 0-1 | 转子角度（0-8191） | 12 位分辨率 |
| Byte 2-3 | 转子转速 | 有符号 16 位 |
| Byte 4-5 | 实际电流 | 有符号 16 位 |
| Byte 6-7 | 温度 | 摄氏度 |

#### （四）电机 CAN ID 分配

| 电机编号 | CAN ID（发送） | CAN ID（接收） | 说明 |
|---------|---------------|---------------|------|
| 电机1 | 0x200 | 0x201 | 底盘电机1 |
| 电机2 | 0x200 | 0x202 | 底盘电机2 |
| 电机3 | 0x200 | 0x203 | 底盘电机3 |
| 电机4 | 0x200 | 0x204 | 底盘电机4 |
| 电机5 | 0x1FF | 0x205 | 云台俯仰电机 |
| 电机6 | 0x1FF | 0x206 | 云台偏航电机 |
| 电机7 | 0x1FF | 0x207 | 拨弹电机 |
| 电机8 | 0x1FF | 0x208 | 发射电机 |

#### （五）CAN 通信代码实现

```c
typedef struct
{
    uint16_t angle;
    int16_t speed;
    int16_t current;
    uint8_t temperate;
} Motor_Feedback_t;

typedef struct
{
    int16_t current;
} Motor_Control_t;

Motor_Feedback_t motor_feedback[8];

void CAN1_Init(void)
{
    hcan.Instance = CAN1;
    hcan.Init.Prescaler = 6;
    hcan.Init.Mode = CAN_MODE_NORMAL;
    hcan.Init.SJW = CAN_SJW_1TQ;
    hcan.Init.BS1 = CAN_BS1_6TQ;
    hcan.Init.BS2 = CAN_BS2_2TQ;
    hcan.Init.TTCM = DISABLE;
    hcan.Init{ABOM = ENABLE;
    hcan.Init.ABOM = ENABLE;
    hcan.Init.NART = DISABLE;
    hcan.Init.RFLM = DISABLE;
    hcan.Init.TXFP = DISABLE;
    
    HAL_CAN_Init(&hcan);
    
    CAN_FilterTypeDef sFilterConfig;
    sFilterConfig.FilterBank = 0;
    sFilterConfig.FilterMode = CAN_FILTERMODE_IDMASK;
    sFilterConfig.FilterScale = CAN_FILTERSCALE_32BIT;
    sFilterConfig.FilterIdHigh = 0x0000;
    sFilterConfig.FilterIdLow = 0x0000;
    sFilterConfig.FilterMaskIdHigh = 0x0000;
    sFilterConfig.FilterMaskIdLow = 0x0000;
    sFilterConfig.FilterFIFOAssignment = CAN_FILTER_FIFO0;
    sFilterConfig.FilterActivation = ENABLE;
    
    HAL_CAN_ConfigFilter(&hcan, &sFilterConfig);
    HAL_CAN_Start(&hcan);
    HAL_CAN_ActivateNotification(&hcan, CAN_IT_RX_FIFO0_MSG_PENDING);
}

void Motor_Send_Control(CAN_HandleTypeDef *hcan, int16_t c1, int16_t c2, int16_t c3, int16_t c4)
{
    uint32_t txMailbox;
    TxHeader.StdId = 0x200;
    TxHeader.DLC = 0x08;
    TxHeader.IDE = CAN_ID_STD;
    TxHeader.RTR = CAN_RTR_DATA;
    
    TxData[0] = c1 >> 8;
    TxData[1] = c1 & 0xFF;
    TxData[2] = c2 >> 8;
    TxData[3] = c2 & 0xFF;
    TxData[4] = c3 >> 8;
    TxData[5] = c3 & 0xFF;
    TxData[6] = c4 >> 8;
    TxData[7] = c4 & 0xFF;
    
    HAL_CAN_AddTxMessage(hcan, &TxHeader, TxData, &txMailbox);
}

void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &RxHeader, RxData);
    
    uint8_t id = RxHeader.StdId;
    
    if(id >= 0x201 && id <= 0x208)
    {
        uint8_t index = id - 0x201;
        motor_feedback[index].angle = (RxData[0] << 8) | RxData[1];
        motor_feedback[index].speed = (RxData[2] << 8) | RxData[3];
        motor_feedback[index].current = (RxData[4] << 8) | RxData[5];
        motor_feedback[index].temperate = RxData[6];
    }
}
```

---

## 第四篇：控制算法深度解析

### 一、PID 控制算法

#### （一）PID 基本原理

PID 控制算法是 RoboMaster 电机控制的基础。PID 控制器由比例（Proportional）、积分（Integral）和微分（Derivative）三个环节组成，通过对误差信号的比例、积分、微分运算产生控制输出。

```c
typedef struct
{
    float target;
    float feedback;
    float error;
    float last_error;
    float integral;
    float output;
    
    float kp;
    float ki;
    float kd;
    
    float output_max;
    float integral_max;
} PID_Controller_t;

void PID_Init(PID_Controller_t *pid, float kp, float ki, float kd, float output_max, float integral_max)
{
    pid->kp = kp;
    pid->ki = ki;
    pid->kd = kd;
    pid->output_max = output_max;
    pid->integral_max = integral_max;
    pid->integral = 0;
    pid->last_error = 0;
}

float PID_Calculate(PID_Controller_t *pid, float target, float feedback)
{
    pid->target = target;
    pid->feedback = feedback;
    pid->error = target - feedback;
    
    pid->integral += pid->error;
    
    if(pid->integral > pid->integral_max)
        pid->integral = pid->integral_max;
    if(pid->integral < -pid->integral_max)
        pid->integral = -pid->integral_max;
    
    float derivative = pid->error - pid->last_error;
    pid->last_error = pid->error;
    
    pid->output = pid->kp * pid->error 
                + pid->ki * pid->integral 
                + pid->kd * derivative;
    
    if(pid->output > pid->output_max)
        pid->output = pid->output_max;
    if(pid->output < -pid->output_max)
        pid->output = -pid->output_max;
    
    return pid->output;
}
```

#### （二）位置式与增量式 PID

**位置式 PID**：直接计算控制量的绝对值，适用于执行器需要绝对位置控制的场景。

**增量式 PID**：计算控制量的增量，适用于执行器累加控制量的场景。增量式 PID 计算量小，无积分饱和问题。

```c
typedef struct
{
    float target;
    float feedback;
    float error;
    float last_error;
    float last_last_error;
    float output;
    float output_delta;
    
    float kp;
    float ki;
    float kd;
    
    float output_max;
} Incremental_PID_t;

float Incremental_PID_Calculate(Incremental_PID_t *pid, float target, float feedback)
{
    pid->target = target;
    pid->feedback = feedback;
    pid->error = target - feedback;
    
    pid->output_delta = pid->kp * (pid->error - pid->last_error)
                      + pid->ki * pid->error
                      + pid->kd * (pid->error - 2 * pid->last_error + pid->last_last_error);
    
    pid->last_last_error = pid->last_error;
    pid->last_error = pid->error;
    
    pid->output += pid->output_delta;
    
    if(pid->output > pid->output_max)
        pid->output = pid->output_max;
    if(pid->output < -pid->output_max)
        pid->output = -pid->output_max;
    
    return pid->output;
}
```

### 二、串级 PID 控制架构

#### （一）串级 PID 原理

RoboMaster 电机控制普遍采用串级 PID 控制架构，由内到外依次为电流环、速度环和角度环。这种分层控制结构实现了不同控制目标的解耦，提高了系统的稳定性和响应性能。

串级调节系统参数整定一般采用两步法和一步完成，串级调节系统与单回路调节系统参数整定思路和方法不同。

串级 PID 控制器是一种常见的控制策略，其中位置环和速度环分别负责不同的控制任务。位置环主要关注目标位置的跟踪性能，而速度环则用于调节系统的动态响应特性。

一般串级 PID 的调参主要是调角度环，若需要电机的爆发力很大，角度环的输出限制不能设置太大。若是电机在目标值附近来回震动很大，则需要在角度环里加大 d 的值。

```c
typedef struct
{
    PID_Controller_t angle_pid;
    PID_Controller_t speed_pid;
    PID_Controller_t current_pid;
    
    float target_angle;
    float current_angle;
    float target_speed;
    float current_speed;
    float target_current;
    float current_current;
} Cascade_PID_t;

void Cascade_PID_Init(Cascade_PID_t *cascade, 
                      float angle_kp, float angle_ki, float angle_kd,
                      float speed_kp, float speed_ki, float speed_kd,
                      float current_kp, float current_ki, float current_kd)
{
    PID_Init(&cascade->angle_pid, angle_kp, angle_ki, angle_kd, 500, 1000);
    PID_Init(&cascade->speed_pid, speed_kp, speed_ki, speed_kd, 16000, 10000);
    PID_Init(&cascade->current_pid, current_kp, current_ki, current_kd, 16000, 0);
}

float Cascade_PID_Calculate(Cascade_PID_t *cascade, float target_angle, float current_angle, 
                           float current_speed, float current_current)
{
    cascade->target_angle = target_angle;
    cascade->current_angle = current_angle;
    cascade->current_speed = current_speed;
    cascade->current_current = current_current;
    
    cascade->target_speed = PID_Calculate(&cascade->angle_pid, 
                                        cascade->target_angle, 
                                        cascade->current_angle);
    
    cascade->target_current = PID_Calculate(&cascade->speed_pid,
                                          cascade->target_speed,
                                          cascade->current_speed);
    
    cascade->target_current = PID_Calculate(&cascade->current_pid,
                                           cascade->target_current,
                                           cascade->current_current);
    
    return cascade->target_current;
}
```

#### （二）三环控制详解

**电流环（最内环）**：直接控制电机电流，实现力矩输出。电流环响应速度最快，带宽最高。

```c
void Current_Loop_Config(PID_Controller_t *current_pid)
{
    current_pid->kp = 800;
    current_pid->ki = 0;
    current_pid->kd = 0;
    current_pid->output_max = 16000;
    current_pid->integral_max = 0;
}
```

**速度环（中环）**：以目标转速为输入，输出作为电流环给定值。速度环决定系统的动态响应特性。

```c
void Speed_Loop_Config(PID_Controller_t *speed_pid)
{
    speed_pid->kp = 20;
    speed_pid->ki = 0.5;
    speed_pid->kd = 0;
    speed_pid->output_max = 16000;
    speed_pid->integral_max = 5000;
}
```

**角度环（最外环）**：根据目标角度计算所需转速，实现精确的位置控制。

```c
void Angle_Loop_Config(PID_Controller_t *angle_pid)
{
    angle_pid->kp = 100;
    angle_pid->ki = 0;
    angle_pid->kd = 5;
    angle_pid->output_max = 500;
    angle_pid->integral_max = 0;
}
```

#### （三）PID 参数整定流程

PID 参数整定的一般步骤是：先整定 Kp（从 0 开始逐渐增大直到出现振荡），再整定 Ki（消除稳态误差），最后整定 Kd（抑制超调和振荡），最后进行微调优化。

**Kp 整定**：Kp 从 0 开始逐渐增大，直到系统出现持续振荡，然后适当减小。Kp 过大会导致系统振荡和超调。

**Ki 整定**：引入积分作用消除稳态误差，注意防止积分饱和导致超调。Ki 过大会导致积分饱和和响应缓慢。

**Kd 整定**：增加微分作用抑制超调和振荡，改善系统动态响应。Kd 过大会导致系统对噪声敏感。

| 控制对象 | Kp 范围 | Ki 范围 | Kd 范围 | 说明 |
|---------|--------|--------|--------|------|
| 底盘速度环 | 10-50 | 0.1-1 | 0-10 | 取决于机械特性 |
| 云台角度环 | 50-200 | 0.5-5 | 10-50 | 响应要求高 |
| 发射机构 | 5-20 | 0.1-0.5 | 0-5 | 相对独立 |
| 拨弹电机 | 15-30 | 0.2-1 | 0-5 | 需要快速响应 |

### 三、底盘运动控制

#### （一）运动学模型

底盘运动控制需要建立机器人运动学模型，将期望的线速度和角速度转换为各轮组的转速指令。

麦克纳姆轮之所以能横着走，是因为轮毂周围有一圈呈 45° 角安装的辊子。当轮子转动时，产生的力是斜向的。通过组合 4 个轮子的力，可以合成任意方向的运动。

对于麦克纳姆轮底盘，需要考虑轮组的特殊运动学关系，实现全向移动能力。运动学解算需要考虑轮组布局、轮子直径、减速比等参数。

```c
typedef struct
{
    float vx;
    float vy;
    float vw;
    
    float wheel_speed[4];
    float wheel_position[4];
    
    float wheel_radius;
    float chassis_radius;
} Mecanum_Chassis_t;

void Mecanum_Calc_Speed(Mecanum_Chassis_t *chassis)
{
    float A = chassis->vx;
    float B = chassis->vy;
    float C = chassis->vw * chassis->chassis_radius;
    
    chassis->wheel_speed[0] = A + B + C;
    chassis->wheel_speed[1] = A - B + C;
    chassis->wheel_speed[2] = A - B - C;
    chassis->wheel_speed[3] = A + B - C;
    
    for(int i = 0; i < 4; i++)
    {
        chassis->wheel_speed[i] /= chassis->wheel_radius;
    }
}
```

#### （二）功率限制

RoboMaster 赛事对机器人功率有限制，以维护比赛公平性和安全性。底盘功率限制通常包括峰值功率限制和持续功率限制两个维度。

功率控制算法需要实时监测电机电流和电压，计算瞬时功率，通过调整电机输出实现功率约束。

```c
typedef struct
{
    float chassis_power;
    float chassis_power_buffer;
    float chassis_power_max;
    float bullet_speed;
    
    float current_sum;
    float current_max;
} Power_Control_t;

void Power_Control(Power_Control_t *power, Motor_Feedback_t *motor, int16_t *current)
{
    power->current_sum = 0;
    
    for(int i = 0; i < 4; i++)
    {
        power->current_sum += abs(motor[i].current);
    }
    
    if(power->current_sum > power->current_max)
    {
        float scale = power->current_max / power->current_sum;
        
        for(int i = 0; i < 4; i++)
        {
            current[i] = (int16_t)(current[i] * scale);
        }
    }
    
    power->chassis_power = motor[0].speed * motor[0].current +
                          motor[1].speed * motor[1].current +
                          motor[2].speed * motor[2].current +
                          motor[3].speed * motor[3].current;
}
```

#### （三）斜坡规划

底盘运动控制中的斜坡规划器用于实现平滑的速度变化，避免阶跃输入导致的机械冲击和打滑现象。

斜坡规划器在机器人需要快速启动、精准减速或复杂地形通过时发挥重要作用，能够有效提升底盘的运动品质和稳定性。

```c
typedef struct
{
    float target;
    float current;
    float step;
    float max_step;
} Ramp_Filter_t;

void Ramp_Init(Ramp_Filter_t *ramp, float step_max)
{
    ramp->current = 0;
    ramp->target = 0;
    ramp->step = 0;
    ramp->max_step = step_max;
}

float Ramp_Calculate(Ramp_Filter_t *ramp, float target)
{
    ramp->target = target;
    float error = target - ramp->current;
    
    if(error > ramp->max_step)
        ramp->step = ramp->max_step;
    else if(error < -ramp->max_step)
        ramp->step = -ramp->max_step;
    else
        ramp->step = error;
    
    ramp->current += ramp->step;
    
    return ramp->current;
}
```

### 四、云台控制策略

#### （一）6020 角度双环控制

6020 角度双环控制由两个反馈环组成：角度环和速度环。

角度环（外环）：角度环的核心任务是控制电机的最终位置。依据比较目标角度和实际角度的差值，角度环 PID 控制器计算出期望的转速。

速度环（内环）：速度环接收角度环的输出作为目标转速，与实际转速比较后，通过速度环 PID 控制器计算出期望的电流值。

```c
typedef struct
{
    PID_Controller_t angle_pid;
    PID_Controller_t speed_pid;
    
    float yaw_angle;
    float yaw_speed;
    float pitch_angle;
    float pitch_speed;
} Gimbal_Control_t;

void Gimbal_Control(Gimbal_Control_t *gimbal, 
                    float target_yaw, float target_pitch,
                    float current_yaw, float current_pitch,
                    float current_yaw_speed, float current_pitch_speed)
{
    float yaw_speed_target = PID_Calculate(&gimbal->angle_pid, target_yaw, current_yaw);
    float yaw_current = PID_Calculate(&gimbal->speed_pid, yaw_speed_target, current_yaw_speed);
    
    float pitch_speed_target = PID_Calculate(&gimbal->angle_pid, target_pitch, current_pitch);
    float pitch_current = PID_Calculate(&gimbal->speed_pid, pitch_speed_target, current_pitch_speed);
    
    Motor_Send_Control(&hcan1, (int16_t)yaw_current, (int16_t)pitch_current, 0, 0);
}
```

#### （二）小陀螺战术实现

小陀螺战术是 RoboMaster 步兵机器人的标志性技术。其核心思想是实现底盘旋转与云台稳定的解耦控制，使机器人能够以任意角度持续旋转的同时保持对固定目标的瞄准。

小陀螺战术的实现分为三步：获取底盘与云台的相对角度、建立坐标转换关系、实现解耦控制。关键在于理解云台坐标和底盘坐标的转换数学模型。

当底盘相对于初始姿态旋转角度为 θ 时，云台需要向相反方向旋转 θ 加上目标角度，以实现绝对角度的稳定控制。

```c
typedef struct
{
    float gimbal_yaw_angle;
    float chassis_yaw_angle;
    float relative_angle;
    
    float absolute_yaw_target;
} Top_Gyro_t;

void Top_Gyro_Init(Top_Gyro_t *top)
{
    top->gimbal_yaw_angle = 0;
    top->chassis_yaw_angle = 0;
    top->relative_angle = 0;
    top->absolute_yaw_target = 0;
}

float Top_Gyro_Get_Relative_Angle(Top_Gyro_t *top)
{
    top->relative_angle = top->gimbal_yaw_angle - top->chassis_yaw_angle;
    return top->relative_angle;
}

void Top_Gyro_Control(Top_Gyro_t *top, float chassis_yaw, float gimbal_yaw, float target_absolute)
{
    top->chassis_yaw_angle = chassis_yaw;
    top->gimbal_yaw_angle = gimbal_yaw;
    
    float relative_target = target_absolute - chassis_yaw;
    
    if(relative_target > 180)
        relative_target -= 360;
    if(relative_target < -180)
        relative_target += 360;
    
    top->absolute_yaw_target = relative_target;
}
```

#### （三）云台姿态稳定

云台控制需要消除机器人整体运动对射击精度的影响。关键技术包括：陀螺仪数据融合实现精确姿态估计、PID 控制实现角度快速收敛、摩擦补偿消除非线性因素影响。

高性能云台控制需要综合运用前馈控制、自适应控制和抗扰动控制等技术。

### 五、视觉目标跟踪

#### （一）目标识别算法

RoboMaster 视觉系统需要实现敌方机器人的自动识别和定位。常用算法包括传统图像处理方法（颜色分割、形状检测）和深度学习方法（CNN 目标检测）。

视觉算法运行在机载电脑（如 NVIDIA Jetson 系列）上，通过串口或网络与主控板通信。

#### （二）目标跟踪与预测

视觉系统输出目标位置信息后，需要进行目标运动预测以补偿通信延迟和控制滞后。

常用方法包括卡尔曼滤波、扩展卡尔曼滤波和神经网络预测。目标预测能够显著提升射击命中率，是高性能视觉系统的核心技术。

```c
typedef struct
{
    float x;
    float y;
    float vx;
    float vy;
    float last_x;
    float last_y;
} Target_Track_t;

void Target_Predict(Target_Track_t *track, float measurement_x, float measurement_y, float dt)
{
    track->last_x = track->x;
    track->last_y = track->y;
    
    track->vx = (measurement_x - track->last_x) / dt;
    track->vy = (measurement_y - track->last_y) / dt;
    
    track->x = measurement_x + track->vx * dt;
    track->y = measurement_y + track->vy * dt;
}

void Target_Smooth(Target_Track_t *track, float measurement_x, float measurement_y, float alpha)
{
    track->x = alpha * measurement_x + (1 - alpha) * track->x;
    track->y = alpha * measurement_y + (1 - alpha) * track->y;
}
```

---

## 第五篇：开源项目分析与学习指南

### 一、开源项目分析方法论

#### （一）代码学习流程

学习开源项目应该遵循由浅入深、理论与实践相结合的原则。建议按照以下流程进行学习：

**阶段一：整体把握（1-2 周）**

阅读项目 README 文档，了解项目背景、功能特性和技术架构。浏览项目目录结构，理解代码组织方式。运行官方示例程序，建立直观认识。查阅相关技术博客和视频教程。

**阶段二：核心模块深入（2-4 周）**

分析主程序入口，理解系统启动流程。研究关键数据结构和算法实现。追踪核心函数调用链，理解模块间交互。尝试修改简单参数，观察运行效果变化。

**阶段三：实践应用（持续）**

将学到的技术应用到自己的项目中。尝试实现类似功能模块。参与开源社区讨论，向其他开发者学习。贡献代码改进，反馈社区。

#### （二）代码结构分析方法

拿到一个开源项目后，首先需要理解其整体架构：

**目录结构分析**：识别各目录的功能定位。RoboMaster 电控项目通常包含以下目录：

- `Application`：应用层代码
- `BSP`：板级支持包，硬件抽象层
- `Driver`：外设驱动代码
- `Algorithm`：算法实现
- `Middleware`：中间件组件
- `Config`：配置文件

**核心文件识别**：找到系统初始化入口文件、主循环文件、中断处理文件。识别核心数据结构定义。追踪关键函数的定义和调用关系。

**数据流追踪**：从输入到输出，追踪数据处理流程。理解各模块之间的数据交互接口。识别关键的状态变量和控制标志。

### 二、优秀开源项目详解

#### （一）RoboRTS-Firmware 官方固件

RoboRTS-Firmware 是一个开源的步兵机器人控制固件，专为 RoboMaster 机器人比赛设计。该项目提供了完整的软件栈，包括实时操作系统 FreeRTOS、标准 CMSIS-RTOS 接口、完整的电机控制和传感器驱动。

**项目特点**：

- 标准化软件架构，模块划分清晰
- 完整的电机控制实现，包括三环 PID
- 支持多种传感器驱动
- 提供调试接口和日志系统

**核心模块**：

```
RoboRTS-Firmware/
├── APP/                    # 应用层
│   ├── chassis_task.c      # 底盘任务
│   ├── gimbal_task.c      # 云台任务
│   ├── shoot_task.c       # 发射任务
│   └── referee_task.c     # 裁判系统任务
├── BSP/                    # 板级支持
│   ├── bsp_can.c          # CAN 总线驱动
│   ├── bsp_imu.c          # IMU 驱动
│   └── bsp_uart.c         # 串口驱动
├── Driver/                  # 驱动层
│   ├── motor_driver.c     # 电机驱动
│   └── referee_driver.c   # 裁判系统驱动
├── Algorithm/              # 算法层
│   ├── pid.c              # PID 算法
│   ├── chassis_control.c  # 底盘控制算法
│   └── gimbal_control.c   # 云台控制算法
└── FreeRTOS/              # 操作系统配置
```

#### （二）河北工业大学山海 Mas 战队开源

河北工业大学山海 Mas 战队在 2024 赛季开放了超级对抗赛麦轮步兵电控源代码。开源内容包括步兵电控代码（分为底盘和云台双板控制）、硬件接线图、完整速控功率模型。

**学习重点**：

- 双板通信协议实现
- 功率控制算法设计
- 麦轮运动学解算
- 代码注释和文档规范

#### （三）中国科学技术大学 RoboWalker 战队开源

中国科学技术大学 RoboWalker 战队在 2025 赛季开放了电控教学资料。开源内容包括若干大小技术点，覆盖力控底盘、功率控制等核心技术。

**学习重点**：

- 力控底盘实现原理
- 功率限制算法设计
- 参数整定方法论
- 新手入门教学设计

#### （四）北京工业大学 PIP 战队开源

北京工业大学 PIP 战队在 2024 赛季开放了平衡步兵完整开源仓库，整合了机械、电控、仿真工程等多方面资料。

**学习重点**：

- 平衡控制算法
- 机械结构设计文档
- 仿真环境搭建
- 完整的项目开发流程

#### （五）辽宁科技大学 COD 战队开源

辽宁科技大学 COD 战队开源了基于 STM32H723VGT6 的电控通用控制系统（COD-H7-Template）。该项目针对达妙 MC02 开发板进行了深度优化，采用 FreeRTOS 实时操作系统，支持多任务调度和 CAN 总线通信。

**项目特点**：

- 基于高性能 STM32H7 平台，处理能力更强
- 支持达妙 MC02 电机开发板
- 模块化设计，便于功能扩展
- 完整的电机驱动和传感器数据采集

**核心模块**：

```
COD-H7-Template/
├── Core/                    # 核心代码
│   ├── Inc/                 # 头文件
│   └── Src/                 # 源文件
├── Drivers/                 # 驱动层
│   ├── STM32H7xx_HAL_Driver/ # HAL库
│   └── BSP/                 # 板级支持包
├── Middlewares/             # 中间件
│   ├── FreeRTOS/            # 实时操作系统
│   └── CAN/                 # CAN总线驱动
└── Applications/            # 应用层
    ├── chassis/             # 底盘控制
    ├── gimbal/              # 云台控制
    └── shoot/               # 发射控制
```

**学习重点**：

- STM32H7 高性能 MCU 开发
- FreeRTOS 多任务调度
- 达妙电机开发板驱动
- 模块化电控架构设计

#### （六）青岛大学未来战队开源

青岛大学未来战队提供了嵌入式（qdu-rm-mcu）和视觉 AI（qdu-rm-ai）两套开源代码库。嵌入式代码基于 STM32 平台，实现了完整的底盘控制和云台稳定功能；视觉 AI 代码基于深度学习框架，实现了装甲板检测和目标跟踪算法。

**嵌入式代码特点**：

- 完整的底盘运动控制
- 云台稳定控制算法
- 功率限制实现
- 模块化设计

**视觉 AI 代码特点**：

- 基于 YOLO 的目标检测
- 装甲板识别算法
- 目标跟踪与预测
- 实时推理部署

**学习重点**：

- 嵌入式与视觉算法协同
- 深度学习在边缘设备的部署
- 实时目标检测优化

#### （七）北京交通大学通用机器人框架

北京交通大学开发的通用 RoboMaster 机器人系统工程开发框架，其论文已被第 38 届中国控制与决策会议（CCDC 2026）接收。该框架采用模块化设计理念，支持多种机器人类型的快速开发。

**项目特点**：

- 通用化设计，支持多种机器人类型
- 模块化架构，易于扩展
- 标准化接口定义
- 完善的文档支持

**学习重点**：

- 系统工程设计方法
- 模块化架构设计
- 标准化接口定义

#### （八）华南理工大学华南虎战队机械结构开源

华南理工大学华南虎战队开源了空中机器人的机械结构设计，包括完整的三维图纸（STEP 格式）、PCB 底板设计文件、零件加工图纸等。

**开源内容**：

- 三维整机模型（STEP 格式）
- PCB 底板设计文件
- 零件加工图纸
- 装配说明文档

**学习重点**：

- 空中机器人机械设计
- 轻量化结构设计
- 动力系统布局

#### （九）XJTLU GMaster 战队视觉算法开源

西交利物浦大学 GMaster 战队开源的 2023 RoboMaster Armor Keypoints Detection 项目，基于 YOLO 目标检测框架实现了装甲板四点模型、能量机关五点模型以及区域赛视觉识别板检测模型。

**项目特点**：

- 基于 YOLO 目标检测框架
- 丰富的数据集支持
- 完整的训练和推理代码
- 实时部署优化

**核心技术**：

- 装甲板关键点检测
- 能量机关识别
- 目标跟踪算法
- 边缘推理优化

**学习重点**：

- 深度学习目标检测
- 关键点检测算法
- 实时视觉识别

#### （十）基于 RT-Thread 的电控框架

基于 RT-Thread 实时操作系统的 RoboMaster 电控框架具有稳定高效的内核、丰富的文档教程和活跃的社区支持。

**框架特点**：

- RT-Thread 实时操作系统
- 设备驱动框架
- Kconfig 配置系统
- 日志系统支持

**学习重点**：

- RT-Thread 操作系统开发
- 模块化驱动设计
- 系统配置与调试

#### （十一）河北科技大学哨兵导航项目

河北科技大学机器人战队 Actor&Thinker 在 Gitee 开源了 RM2023 哨兵导航代码（KDRobot_RM2023Sentry_Navigation），包含完整的 SLAM 以及路径规划部分。本项目基于 ROS Noetic 开发，实现了哨兵机器人的自主导航功能。

**项目特点**：

- 基于 ROS Noetic 框架
- 完整的 SLAM 建图与定位
- 路径规划算法实现
- 哨兵机器人自主导航逻辑

**核心模块**：

```
KDRobot_RM2023Sentry_Navigation/
├── slam/                    # SLAM模块
│   ├── cartographer/        # Cartographer建图
│   ├── gmapping/            # GMapping建图
│   └── localization/        # 定位模块
├── navigation/              # 导航模块
│   ├── move_base/           # 路径规划
│   ├── costmap/             # 代价地图
│   └── planner/             # 规划器
├── perception/              # 感知模块
│   ├── lidar/               # 激光雷达处理
│   └── camera/              # 视觉感知
└── control/                 # 控制模块
    ├── base_controller/     # 底盘控制
    └── gimbal_controller/   # 云台控制
```

**学习重点**：

- ROS 导航框架使用
- SLAM 建图与定位
- 路径规划算法
- 哨兵机器人自主决策

#### （十二）辽宁战队雷达视觉开源项目

辽宁科技大学 COD 战队开源了基于深度学习的雷达视觉检测系统，支持装甲板检测、目标识别和威胁评估功能。该项目基于 PyTorch 框架，实现了实时目标检测和跟踪算法。

**项目特点**：

- 基于 PyTorch 深度学习框架
- 支持 YOLO 系列目标检测算法
- 实时目标跟踪与预测
- 雷达数据与视觉数据融合

**核心技术**：

- YOLOv5/YOLOv8 目标检测
- 装甲板识别算法
- 多目标跟踪（MOT）
- 威胁等级评估

**学习重点**：

- 深度学习目标检测
- 边缘推理部署
- 多传感器数据融合
- 实时视觉处理

#### （十三）华中科技大学雷达目标识别项目

华中科技大学 RoboMaster 战队开源了雷达目标识别系统，实现了基于视觉的敌方机器人检测和分类。该项目支持多种目标类型识别，包括步兵、英雄、工程等机器人类型。

**项目特点**：

- 基于 OpenCV 的传统视觉算法
- 支持多种目标类型识别
- 实时目标定位与跟踪
- 敌方机器人威胁评估

**核心模块**：

```
radar_detection/
├── preprocessing/           # 图像预处理
├── feature_extraction/      # 特征提取
├── target_detection/        # 目标检测
├── target_tracking/         # 目标跟踪
└── threat_assessment/       # 威胁评估
```

**学习重点**：

- 传统视觉目标检测
- 图像特征提取
- 目标分类算法
- 实时图像处理优化

#### （十四）深圳北理莫斯科大学北极熊战队导航系统

深圳北理莫斯科大学北极熊战队（SMBU-PolarBear）在 2025 赛季开源了完整的哨兵导航系统，包括仿真环境和真实机器人导航代码。该项目使用 Livox Mid360 激光雷达与 IMU 融合，实现了高精度的自主导航功能。

**项目仓库**：

- 导航仿真环境：[pb_rm_simulation](https://gitee.com/SMBU-POLARBEAR/pb_rm_simulation)
- 哨兵导航模块：[pb2025_sentry_nav](https://github.com/SMBU-PolarBear-Robotics-Team/pb2025_sentry_nav)
- 自动哨兵上位机：[RM2024_SMBU_auto_sentry_ws](https://gitee.com/SMBU-POLARBEAR/RM2024_SMBU_auto_sentry_ws)

**算法架构详解**：

该导航系统采用分层架构设计，包含感知层、定位层、规划层和控制层四个核心层次：

```
┌─────────────────────────────────────────────────────────────┐
│                    决策层（决策模块）                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 状态机管理 · 行为决策 · 任务调度 · 威胁评估            │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ 目标点 / 路径请求
┌────────────────────────────▼────────────────────────────────┐
│                    规划层（路径规划）                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 全局路径规划 · 局部避障 · 动态路径重规划              │  │
│  │ 算法：A* / Dijkstra / DWA / TEB                      │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ 速度指令
┌────────────────────────────▼────────────────────────────────┐
│                    控制层（运动控制）                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 底盘运动学解算 · 速度跟踪 · 姿态稳定 · 功率限制        │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ 执行命令
┌────────────────────────────▼────────────────────────────────┐
│                    感知层（传感器融合）                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │ 激光雷达   │  │   IMU     │  │ 视觉相机  │  │ 里程计  │ │
│  │ Mid360    │  │ 六轴/九轴 │  │ RGB/D    │  │ 编码器  │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘ │
│        │              │              │               │      │
│        └──────────────┼──────────────┴───────────────┘      │
│                       ▼                                     │
│              ┌───────────────┐                              │
│              │ 传感器融合    │                              │
│              │ 扩展卡尔曼滤波 │                              │
│              │ 状态估计      │                              │
│              └───────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

**核心算法模块详解**：

**1. SLAM 定位模块**

采用 LiDAR-IMU 紧耦合融合方案：

```c
typedef struct {
    // 激光特征
    pcl::PointCloud<pcl::PointXYZIRT>::Ptr scan;
    pcl::PointCloud<pcl::PointXYZIRT>::Ptr local_map;
    
    // IMU 数据
    Eigen::Vector3d angular_velocity;
    Eigen::Vector3d linear_acceleration;
    
    // 位姿状态
    Eigen::Isometry3d pose;
    Eigen::Vector3d velocity;
    Eigen::Matrix<double, 15, 15> covariance;
    
    // 特征提取
    std::vector<Eigen::Vector3d> edge_features;
    std::vector<Eigen::Vector3d> plane_features;
} SlamState_t;

void LidarImuFusion(SlamState_t *state) {
    // 1. IMU 预积分
    IntegrateIMUMsg(state);
    
    // 2. 激光特征提取
    ExtractFeatures(state);
    
    // 3. 特征匹配
    MatchFeatures(state);
    
    // 4. 位姿优化
    OptimizePose(state);
    
    // 5. 滑动窗口边缘化
    Marginalization(state);
}
```

**2. 路径规划模块**

采用分层规划策略：

```c
typedef struct {
    // 全局路径
    std::vector<Eigen::Vector2d> global_path;
    
    // 局部路径
    std::vector<Eigen::Vector2d> local_path;
    
    // 代价地图
    nav_msgs::OccupancyGrid costmap;
    
    // 当前目标
    Eigen::Vector2d target_point;
    
    // 规划状态
    enum {IDLE, PLANNING, EXECUTING, REPLANNING} status;
} PathPlanner_t;

void GlobalPlanner(PathPlanner_t *planner) {
    // A* 算法寻找最优路径
    planner->global_path = AStarSearch(planner->costmap, 
                                      GetCurrentPosition(),
                                      planner->target_point);
}

void LocalPlanner(PathPlanner_t *planner) {
    // DWA 动态窗口法进行局部避障
    planner->local_path = DynamicWindowApproach(planner->global_path,
                                                planner->costmap,
                                                GetCurrentVelocity());
}
```

**3. 决策模块**

基于有限状态机的行为决策：

```c
typedef enum {
    STATE_IDLE,
    STATE_PATROL,
    STATE_CHASE,
    STATE_DEFEND,
    STATE_ESCAPE,
    STATE_RECHARGE
} SentryState_t;

void DecisionFSM(SentryState_t *state, SensorData_t *sensors) {
    switch(*state) {
        case STATE_PATROL:
            if(DetectEnemy(sensors)) {
                *state = STATE_CHASE;
                SetTarget(GetEnemyPosition(sensors));
            }
            else if(IsLowPower(sensors)) {
                *state = STATE_RECHARGE;
                SetTarget(GetRechargePoint());
            }
            break;
            
        case STATE_CHASE:
            if(LostEnemy(sensors)) {
                *state = STATE_PATROL;
                SetPatrolRoute();
            }
            else if(EnemyTooClose(sensors)) {
                *state = STATE_DEFEND;
                StartShooting();
            }
            break;
            
        // ... 其他状态处理
    }
}
```

**4. 仿真环境架构**

基于 ROS2-Gazebo 的仿真框架：

```
pb_rm_simulation/
├── launch/                  # 启动文件
│   ├── simulation.launch.py
│   └── navigation.launch.py
├── worlds/                  # 仿真地图
│   ├── rmuc_world.world
│   └── rmul_world.world
├── models/                  # 机器人模型
│   ├── sentry/              # 哨兵机器人
│   └── obstacles/           # 障碍物
├── config/                  # 配置文件
│   ├── slam.yaml
│   ├── planner.yaml
│   └── controller.yaml
└── scripts/                 # 辅助脚本
    ├── map_generator.py
    └── data_recorder.py
```

**项目特点**：

- **Sim2Real 设计理念**：仿真环境与真实机器人参数一致，便于算法迁移
- **多传感器融合**：LiDAR + IMU + 视觉多模态数据融合
- **模块化架构**：感知、定位、规划、控制分层解耦
- **可扩展性强**：支持 RMUC/RMUL 多种比赛地图

**学习重点**：

- LiDAR-IMU 紧耦合 SLAM
- 分层路径规划算法（全局+局部）
- 有限状态机决策系统
- ROS2-Gazebo 仿真框架使用
- Sim2Real 迁移策略

### 三、开源平台资源导航

#### （一）Gitee RoboMaster 专题

Gitee RoboMaster 专题（https://gitee.com/explore/topic/RoboMaster）是获取国内战队开源代码的主要渠道。该平台汇聚了大量 RoboMaster 战队开源代码和教学资料，国内访问速度快，社区活跃。

**推荐资源类型**：

- 战队完整开源仓库
- 电控教学系列教程
- 硬件设计参考资料
- 仿真工程示例

#### （二）GitHub RoboMaster 相关

GitHub 平台收录了 RoboMaster 官方开源项目和部分国际队伍代码，可作为补充参考。

**官方仓库**：

- RoboMaster/RoboRTS-Firmware：官方固件框架
- RoboMaster/robomaster-sdk：开发工具包
- RoboMaster/robomaster-engine：仿真引擎

#### （三）CSDN 技术博客

CSDN 博客平台有大量技术文章，涵盖从入门教程到高级开发的各个方面。

**推荐搜索关键词**：

- "RoboMaster 电控"
- "STM32 FreeRTOS"
- "CAN 总线电机控制"
- "PID 参数整定"
- "麦克纳姆轮解算"

### 四、代码复现与改进实践

#### （一）基础功能复现

建议从以下基础功能开始，逐步复现开源项目中的核心代码：

**CAN 通信驱动**：实现电机数据的发送和接收，理解 CAN 数据帧格式。

```c
void CAN_Test(void)
{
    Motor_Control_t control[4] = {0};
    
    while(1)
    {
        for(int i = 0; i < 4; i++)
        {
            control[i].current = i * 1000;
        }
        
        Motor_Send_Control(&hcan1, 
                           control[0].current, 
                           control[1].current,
                           control[2].current,
                           control[3].current);
        
        HAL_Delay(1);
        
        printf("Motor1: angle=%d, speed=%d, current=%d\n",
               motor_feedback[0].angle,
               motor_feedback[0].speed,
               motor_feedback[0].current);
    }
}
```

**基础 PID 控制**：实现单环 PID 控制，理解 PID 各参数的作用。

**串级 PID 控制**：实现角度环-速度环-电流环三层控制结构。

**底盘运动控制**：实现麦轮运动学解算和功率限制。

#### （二）功能改进方向

在完成基础功能复现后，可以尝试以下改进方向：

**性能优化**：优化 PID 计算效率，降低控制周期。优化 CAN 通信数据处理，减少中断响应时间。

**功能扩展**：添加云台控制功能，实现小陀螺战术。添加发射机构控制，实现自动射击。添加裁判系统对接，获取游戏状态信息。

**算法改进**：实现自适应 PID 参数调整。添加前馈控制提升响应速度。实现多传感器数据融合。

---

## 第六篇：裁判系统与比赛规范

### 一、裁判系统组成

#### （一）主控模块

裁判系统主控模块负责整体数据处理、状态显示和违规判定。主控内置陀螺仪和气压计用于监测机器人运动状态和高度信息。

#### （二）装甲模块

装甲模块安装于机器人四周，用于检测弹丸命中事件。装甲灵敏度可调节，需要通过信号处理算法区分真实命中和环境干扰。

#### （三）RFID 模块

RFID 模块用于读取场地机关标签，判断机器人所处区域和触发的机关类型。

#### （四）图传模块

VT03 和 VT13 图传模块负责实时视频传输至操作员界面。视频延迟要求控制在 100ms 以内。

### 二、弹丸规格与射击限制

| 弹丸类型 | 直径 | 重量 | 初速限制 | 典型应用 |
|---------|------|------|---------|---------|
| 17mm 标准弹 | 17mm | 约 3.2g | 10-18 m/s | 步兵、空中机器人 |
| 42mm 大弹 | 42mm | 约 13g | 8-15 m/s | 英雄机器人 |

### 三、犯规类型与处罚措施

#### （一）常见违规行为

超时违规指操作时间超出规定限制；越界违规指机器人进入双方禁区；物理接触违规指禁止的身体接触行为；装备违规指使用未经批准的设备。

#### （二）处罚等级

轻微违规处罚包括口头警告和少量扣血；一般违规处罚为罚时处理；严重违规处罚为扣血加罚时双重处理；重大违规将导致取消比赛资格。

---

## 第七篇：硬件设计实战指南

### 一、系统架构设计

#### （一）分层控制架构设计

```
┌─────────────────────────────────────────┐
│            操作员界面（上位机）            │
│         无线通信 / 图传链路              │
└───────────────────┬─────────────────────┘
                    │
┌───────────────────▼─────────────────────┐
│              主控制器（C 板）              │
│     STM32F4 主控 + 内置 IMU              │
│     决策协调 · 传感器融合                │
└───────────────────┬─────────────────────┘
                    │ CAN 总线
        ┌───────────┼───────────┐
        │           │           │
┌───────▼────┐ ┌───▼────┐ ┌───▼──────┐
│   底盘控制   │ │  云台   │ │  发射    │
│   （A 板）   │ │  （C 板）│ │  （A 板） │
│  ·运动解算  │ │ ·姿态   │ │ ·拨弹    │
│  ·功率限制  │ │ ·跟踪   │ │ ·摩擦轮  │
└─────────────┘ └────────┘ └──────────┘
```

#### （二）集中式 vs 分布式架构选择

集中式架构采用单一主控处理所有控制逻辑，适合中小型机器人和入门级开发。分布式架构将控制任务分配到多个控制器，通过 CAN 总线协同工作。

### 二、电源系统设计

#### （一）电源树设计

```
                    ┌──────────┐
                    │   电池   │
                    │  4S LiPo │
                    └────┬─────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
  ┌─────▼─────┐    ┌────▼────┐    ┌────▼─────┐
  │  DC-DC    │    │  DC-DC  │    │  DC-DC   │
  │   12V     │    │   5V    │    │   5V     │
  │ 传感器供电 │    │ 舵机供电 │    │ 主控供电  │
  └───────────┘    └─────────┘    └─────────┘
```

#### （二）电源设计要点

主回路和各个分支回路都需要配置保险丝进行过流保护。电源输入输出端应放置滤波电容消除高频噪声。

### 三、PCB 设计规范

#### （一）分区布局原则

电源区（输入、转换、输出）应与信号区适当隔离，避免电源纹波干扰敏感信号。控制区（主控芯片最小系统）应放置在板面中心位置。

#### （二）布线要点

电源线需要加粗降低阻抗，信号线应避免平行走线产生串扰，保持地平面完整性保证回流路径。

### 四、线束设计

#### （一）集成化原则

神经线束配合总线架构可减少线束总量 40% 至 60%。95% 以上的线缆应经内部通道和中空轴布置，杜绝外部磨损和缠绕风险。

#### （二）连接器选型建议

| 应用场景 | 推荐连接器 | 说明 |
|---------|-----------|------|
| 电机连接 | XT30/XT60/JST | 大电流连接器 |
| 传感器接口 | JST PH/Molex | 紧凑型连接器 |
| 板间连接 | 排针排母/FFC | 灵活连接方案 |
| 外部接口 | DB9/USB Type-C | 标准化接口 |

---

## 第八篇：调试与优化实战

### 一、CAN 通信调试

#### （一）常见问题排查

**电机不转的排查步骤**：检查 CAN 接线是否正确，检查电机 ID 配置是否匹配，检查控制指令格式和数值范围，检查电调指示灯状态。

**电机抖动的排查步骤**：检查编码器反馈信号质量，降低控制增益增加系统稳定性，增加微分控制抑制振荡。

**通信丢包的排查步骤**：检查 CAN 总线终端电阻配置是否正确，检查系统接地是否良好，降低 CAN 波特率进行测试。

#### （二）CAN 调试工具

USB-CAN 分析仪是 CAN 总线调试的必备工具。示波器用于观察 CAN_H 和 CAN_L 信号波形。逻辑分析仪可捕获高速数字信号。

### 二、性能优化策略

#### （一）控制周期优化

精简中断处理代码，减少中断嵌套层级。使用 DMA 传输减少 CPU 负担。优化 PID 计算算法，避免浮点运算瓶颈。

#### （二）功率控制优化

建立准确的功率预测模型，实时估算系统功率消耗。设计平滑的功率限制算法，避免控制输出突变。

---

## 第九篇：文档更新机制与资源导航

### 一、文档自我更新指南

#### （一）官方资源获取

**RoboMaster 官方网站**：https://www.robomaster.com

**RoboMaster 社区论坛**：https://bbs.robomaster.com

#### （二）开源社区资源

**Gitee RoboMaster 专题**：https://gitee.com/explore/topic/RoboMaster

**GitHub RoboMaster 相关**：https://github.com/RoboMaster

**CSDN RoboMaster 专栏**：https://blog.csdn.net/nav/robomaster

### 二、资源获取建议

#### （一）入门学习路径

建议新手按以下顺序学习：阅读官方规则文档理解比赛形式、研究官方开源项目框架、学习嵌入式开发基础和 STM32 编程、掌握 CAN 总线通信和电机控制原理、实现简单的底盘运动控制、逐步添加云台控制、发射机构等模块、学习视觉识别和目标跟踪技术。

#### （二）进阶提升方向

对于已有基础的队伍，建议深入以下方向：优化控制算法提升机器人性能、完善功率控制策略、开发高级视觉算法、实现多机器人协同控制、进行系统仿真和硬件在环测试。

### 三、更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| V1.0.0 | 2026-05-27 | 初始版本，包含规则详解、硬件架构、通信协议、开源资源等内容 |
| V1.1.0 | 2026-05-27 | 扩展电控系统架构、FreeRTOS 应用、串级 PID 控制、开源项目分析方法论 |
| V1.2.0 | 2026-05-27 | 新增辽宁科技大学 COD 战队、青岛大学未来战队、北京交通大学通用框架、华南理工大学华南虎战队、XJTLU GMaster 战队、RT-Thread 电控框架等开源项目详细分析 |

---

## 附录

### A. 术语表

| 术语 | 英文全称 | 说明 |
|------|---------|------|
| PID | Proportional-Integral-Derivative | 比例-积分-微分控制器 |
| CAN | Controller Area Network | 控制器局域网络 |
| IMU | Inertial Measurement Unit | 惯性测量单元 |
| PWM | Pulse Width Modulation | 脉宽调制 |
| ADC | Analog-to-Digital Converter | 模数转换器 |
| GPIO | General Purpose Input/Output | 通用输入输出 |
| MCU | Microcontroller Unit | 微控制单元 |
| ESC | Electronic Speed Controller | 电子调速器 |
| RMS | Rate Monotonic Scheduling | 速率单调调度 |
| RTOS | Real-Time Operating System | 实时操作系统 |
| HAL | Hardware Abstraction Layer | 硬件抽象层 |

### B. 参考链接汇总

**官方资源**

- RoboMaster 官方网站：https://www.robomaster.com
- RoboMaster 社区论坛：https://bbs.robomaster.com
- RoboMaster GitHub：https://github.com/RoboMaster
- RoboMaster Gitee：https://gitee.com/robomaster

**开源项目**

- RoboRTS-Firmware：RoboMaster 官方固件框架
- 河北工业大学山海 Mas 战队开源：步兵电控代码和硬件资料
- 中国科学技术大学 RoboWalker 战队开源：电控教学资料
- 北京工业大学 PIP 战队开源：平衡步兵完整资料

**技术社区**

- CSDN RoboMaster 专栏：大量技术博客文章
- 知乎 RoboMaster 话题：技术讨论和经验分享
- Gitee RoboMaster 专题：开源代码仓库汇总

**学习资源**

- STM32 官方技术手册
- FreeRTOS 官方文档
- CAN 总线协议规范
- ROS/ROS2 官方教程

---

**文档版本**：V1.1.0
**适用赛季**：RoboMaster 2026
**最后更新**：2026 年 5 月
**维护建议**：建议每赛季开始前根据官方发布的最新规则文档和技术规范进行更新和补充
