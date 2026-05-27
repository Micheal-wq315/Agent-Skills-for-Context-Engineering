---
name: RoboMaster 通讯协议
description: 提供 RoboMaster 通讯协议完整详解，包括 CAN 总线物理层设计、帧格式与 ID 分配、CAN 初始化与收发代码、双板 UART 协议和裁判系统串口接口规范
version: 2.0.0
author: RoboMaster技术团队
tags:
  - RoboMaster
  - CAN 总线
  - 通讯协议
  - 裁判系统
---

# RoboMaster 通讯协议

## 一、CAN 总线通信

### CAN 总线基础

CAN (Controller Area Network) 是 RoboMaster 电机控制的核心通信总线，具有以下特点：

| 特性 | 说明 |
|------|------|
| **多主控制** | 多节点可同时发送，通过 ID 仲裁 |
| **优先级机制** | ID 越小优先级越高 |
| **错误检测** | CRC 校验、位错误、填充错误、ACK 错误 |
| **速率** | 最高 1Mbps（RM 标准） |
| **帧类型** | 数据帧、远程帧、错误帧、过载帧 |

### C 型板 CAN 引脚映射

| CAN 通道 | TX 引脚 | RX 引脚 | 复用功能 |
|---------|---------|---------|---------|
| **CAN1** | PB8 / PA12 | PB9 / PA11 | AF9 |
| **CAN2** | PB12 / PB5 | PB13 / PB6 | AF9 |

### CAN 总线物理连接

```
MCU(C型板) ──► CAN Transceiver(SN65HVD230) ──► CAN_H ──┬── CAN_H ──► 电调1
                                                     │
                                                  120Ω 终端电阻
                                                     │
                                                      ├── CAN_H ──► 电调2
                                                      │
                                                    CAN_L ─┬── CAN_L ──► 电调1
                                                           │
                                                           ├── CAN_L ──► 电调2
```

**关键**：总线两端必须有 120Ω 终端电阻。如果电调已内置，MCU 端也需一个。

### CAN 初始化代码

```c
CAN_HandleTypeDef hcan1;

void CAN1_Init(void) {
    hcan1.Instance = CAN1;
    hcan1.Init.Prescaler = 6;          // 42MHz / 6 = 7MHz
    hcan1.Init.Mode = CAN_MODE_NORMAL;
    hcan1.Init.SyncJumpWidth = CAN_SJW_1TQ;
    hcan1.Init.TimeSeg1 = CAN_BS1_6TQ;  // 6TQ
    hcan1.Init.TimeSeg2 = CAN_BS2_2TQ;  // 2TQ
    // 波特率 = 7MHz / (1+6+2) = 1Mbps ✓
    hcan1.Init.TimeTriggeredMode = DISABLE;
    hcan1.Init.AutoBusOff = ENABLE;
    hcan1.Init.AutoWakeUp = DISABLE;
    hcan1.Init.AutoRetransmission = DISABLE;
    hcan1.Init.ReceiveFifoLocked = DISABLE;
    hcan1.Init.TransmitFifoPriority = DISABLE;
    HAL_CAN_Init(&hcan1);

    // 配置过滤器：接收所有 CAN 消息
    CAN_FilterTypeDef sFilterConfig;
    sFilterConfig.FilterBank = 0;
    sFilterConfig.FilterMode = CAN_FILTERMODE_IDMASK;
    sFilterConfig.FilterScale = CAN_FILTERSCALE_32BIT;
    sFilterConfig.FilterIdHigh = 0x0000;
    sFilterConfig.FilterIdLow  = 0x0000;
    sFilterConfig.FilterMaskIdHigh = 0x0000;
    sFilterConfig.FilterMaskIdLow  = 0x0000;
    sFilterConfig.FilterFIFOAssignment = CAN_FILTER_FIFO0;
    sFilterConfig.FilterActivation = ENABLE;
    HAL_CAN_ConfigFilter(&hcan1, &sFilterConfig);

    HAL_CAN_Start(&hcan1);
    HAL_CAN_ActivateNotification(&hcan1, CAN_IT_RX_FIFO0_MSG_PENDING);
}
```

### CAN 发送代码

```c
CAN_TxHeaderTypeDef   TxHeader;
uint8_t               TxData[8];
uint32_t              txMailbox;

void Motor_Send_Control(int16_t c1, int16_t c2, int16_t c3, int16_t c4) {
    TxHeader.StdId = 0x200;          // 发送 ID
    TxHeader.ExtId = 0;
    TxHeader.DLC   = 0x08;           // 数据长度 8 字节
    TxHeader.IDE   = CAN_ID_STD;     // 标准帧
    TxHeader.RTR   = CAN_RTR_DATA;   // 数据帧
    TxHeader.TransmitGlobalTime = DISABLE;

    // 四个电机电流值（大端）
    TxData[0] = c1 >> 8;    TxData[1] = c1 & 0xFF;
    TxData[2] = c2 >> 8;    TxData[3] = c2 & 0xFF;
    TxData[4] = c3 >> 8;    TxData[5] = c3 & 0xFF;
    TxData[6] = c4 >> 8;    TxData[7] = c4 & 0xFF;

    HAL_CAN_AddTxMessage(&hcan1, &TxHeader, TxData, &txMailbox);
}
```

### CAN 接收回调

```c
CAN_RxHeaderTypeDef   RxHeader;
uint8_t               RxData[8];
Motor_Feedback_t      motor_feedback[8];

void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan) {
    HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &RxHeader, RxData);
    uint32_t id = RxHeader.StdId;

    if(id >= 0x201 && id <= 0x208) {
        uint8_t index = id - 0x201;
        motor_feedback[index].angle    = (RxData[0] << 8) | RxData[1];
        motor_feedback[index].speed    = (int16_t)((RxData[2] << 8) | RxData[3]);
        motor_feedback[index].current  = (int16_t)((RxData[4] << 8) | RxData[5]);
        motor_feedback[index].temperate = RxData[6];
    }
}
```

### CAN 数据帧格式

#### 发送帧（主控 → 电调，ID: 0x200）

| 字节 | 位[15:8] | 位[7:0] | 含义 |
|------|----------|---------|------|
| Byte 0-1 | 电流高字节 | 电流低字节 | 电机 1 电流指令 (-16384~16384) |
| Byte 2-3 | 电流高字节 | 电流低字节 | 电机 2 电流指令 |
| Byte 4-5 | 电流高字节 | 电流低字节 | 电机 3 电流指令 |
| Byte 6-7 | 电流高字节 | 电流低字节 | 电机 4 电流指令 |

#### 接收帧（电调 → 主控，ID: 0x201-0x208）

| 字节 | 含义 | 范围 |
|------|------|------|
| Byte 0-1 | 转子机械角度 | 0 ~ 8191 (0°~360°) |
| Byte 2-3 | 转子转速 (rpm) | -32768 ~ 32767 |
| Byte 4-5 | 实际转矩电流 | -16384 ~ 16384 |
| Byte 6 | 电机温度 (°C) | 0 ~ 255 |
| Byte 7 | 保留 | - |

### 电机 CAN ID 分配表

| 电机编号 | 发送 ID | 接收 ID | 位置 |
|---------|---------|---------|------|
| 电机 1 | 0x200 | 0x201 | 底盘右前 |
| 电机 2 | 0x200 | 0x202 | 底盘左前 |
| 电机 3 | 0x200 | 0x203 | 底盘左后 |
| 电机 4 | 0x200 | 0x204 | 底盘右后 |
| 电机 5 | 0x1FF | 0x205 | 云台 Yaw |
| 电机 6 | 0x1FF | 0x206 | 云台 Pitch |
| 电机 7 | 0x1FF | 0x207 | 拨弹电机 |
| 电机 8 | 0x1FF | 0x208 | 摩擦轮电机 |

---

## 二、串口通信 (UART)

### 双板通信协议（底盘 ↔ 云台）

```
┌──────────────┐      UART 115200bps      ┌──────────────┐
│   底盘板     │ ◄──────────────────────► │   云台板     │
│  (A型板)    │                           │  (C型板)    │
└──────────────┘                           └──────────────┘

数据包格式：
┌──────┬────────┬────────┬─────────┬──────┬──────┐
│ 帧头 │ 数据ID │ 数据长度│ 数据内容 │ 校验 │ 帧尾 │
│ 0xA5 │ 1Byte  │ 1Byte  │ N Bytes │ CRC8 │ 0x5A │
└──────┴────────┴────────┴─────────┴──────┴──────┘

底盘 → 云台：底盘角度、IMU 姿态、轮速
云台 → 底盘：目标方位角、射击指令、视觉坐标
频率：200Hz (每 5ms 一包)
```

### 视觉通信协议（机载电脑 → 电控）

```
协议选择：UART 串口 (常用) / USB 虚拟串口 / Ethernet UDP
波特率：921600bps 或 115200bps

数据内容：
- 视觉 → 电控：目标 x, y, z 坐标、距离、置信度、目标类型
- 电控 → 视觉：机器人状态、当前模式、IMU 数据

频率：30-60Hz
```

---

## 三、裁判系统接口

### 数据内容

| 类型 | 数据 | 用途 |
|------|------|------|
| **机器人状态** | 血量、等级、位置 | 实时监控 |
| **比赛状态** | 时间、阶段、比分 | 战术决策 |
| **场地信息** | 机关状态、补给站 | 资源规划 |
| **ID 识别** | 红/蓝方、机器人编号 | 身份判定 |

### 通信参数

| 参数 | 值 |
|------|----|
| **接口** | USART 串口 |
| **波特率** | 115200bps |
| **数据位** | 8 |
| **停止位** | 1 |
| **校验** | 无 |
| **频率** | 10Hz |

---

## 四、CAN 调试常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 电机不反馈 | CAN 物理连接错误 | 检查接线、终端电阻 |
| 数据乱码 | 波特率不匹配 | 确认 1Mbps |
| 偶发丢包 | 终端电阻缺失 | 添加 120Ω 电阻 |
| CAN 中断不触发 | 过滤器配置错误 | 检查过滤器掩码 |
| 电机发热不转 | 电流值超范围 | 限制 [-16384, 16384] |

---

## 五、开源项目参考

| 项目 | 亮点 |
|------|------|
| **RoboRTS-Firmware** | 官方固件 CAN 实现 |
| **山海 Mas 双板通信** | 河北工大 CAN+UART 双板 |
| **COD-H7-Template** | 辽宁科大 H7 CAN 模板 |
| **官方 CAN 协议文档** | DJI 电机 CAN 协议规范 |

**学习资料**：
- DJI RoboMaster 电机 CAN 协议手册
- 《CAN 总线应用层协议》- DS301 规范
- STM32 CAN 外设应用笔记 AN5348