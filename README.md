# Agent Skills for Context Engineering（上下文工程的 Agent 技能）

一套全面、开放的 Agent 技能合集，专注于上下文工程与驾驭工程（harness engineering）原则，用于构建生产级 AI Agent 系统。这些技能教授跨越任何 Agent 平台进行上下文策展、Agent 运行循环设计及 Agent 行为评估的艺术与科学。

[DeepWiki：在此了解更多](https://deepwiki.com/muratcankoylan/Agent-Skills-for-Context-Engineering)

## 什么是上下文工程？

上下文工程是管理语言模型上下文窗口的学科。与专注于编写有效指令的提示工程不同，上下文工程处理的是对所有进入模型有限注意力预算的信息进行整体策展：系统提示、工具定义、检索到的文档、消息历史及工具输出。

根本挑战在于，上下文窗口的受限并非源于原始的 token 容量，而是源于注意力机制。随着上下文长度增加，模型会呈现出可预测的退化模式：“中间丢失”现象、U 形注意力曲线以及注意力稀缺。有效的上下文工程意味着找出能最大化预期结果可能性的最小高信号 token 集合。

## 学术认可

本仓库在学术研究中被引为静态技能架构的基础性工作：

> “虽然静态技能已得到广泛认可 [Anthropic, 2025b; Muratcan Koylan, 2025]，但 MCE 是最早动态演化这些技能的框架之一，它桥接了手工技能工程与自主自我改进。”
1. [Meta Context Engineering via Agentic Skill Evolution](https://arxiv.org/pdf/2601.21557)，北京大学通用人工智能国家重点实验室（2025）
2. [Agent Harness Engineering: A Survey](https://openreview.net/pdf/f358711a95aaaf61fdeffd4ef3fc60fba9b8da57.pdf)，CMU、耶鲁、JHU、东北大学、杜兰、UAB、俄亥俄州立、弗吉尼亚理工及亚马逊（2026）

## 技能概览

### 基础技能

这些技能为所有后续上下文工程工作建立必要的基础理解。

| 技能 | 描述 |
|-------|-------------|
| [context-fundamentals](skills/context-fundamentals/) | 理解什么是上下文、它为何重要，以及 Agent 系统中上下文的构成 |
| [context-degradation](skills/context-degradation/) | 识别上下文失效模式：中间丢失、投毒、分心与冲突 |
| [context-compression](skills/context-compression/) | 为长时间会话设计并评估压缩策略 |

### 架构技能

这些技能涵盖构建高效 Agent 系统的模式与结构。

| 技能 | 描述 |
|-------|-------------|
| [multi-agent-patterns](skills/multi-agent-patterns/) | 掌握编排器、对等及分层多 Agent 架构 |
| [memory-systems](skills/memory-systems/) | 设计短期、长期及图式记忆架构 |
| [tool-design](skills/tool-design/) | 构建 Agent 可有效使用的工具 |
| [filesystem-context](skills/filesystem-context/) | 使用文件系统进行动态上下文发现、工具输出卸载与计划持久化 |
| [hosted-agents](skills/hosted-agents/) | **全新** 构建带沙盒化虚拟机、预构建镜像、多人支持及多客户端接口的后台编码 Agent |

### 运营技能

这些技能处理 Agent 系统的持续运行与优化。

| 技能 | 描述 |
|-------|-------------|
| [context-optimization](skills/context-optimization/) | 应用压缩、掩码与缓存策略 |
| [latent-briefing](skills/latent-briefing/) | 当 worker 运行时可控且模型兼容时，通过任务引导的 KV 缓存压缩与 worker 共享编排器状态 |
| [evaluation](skills/evaluation/) | 为 Agent 系统构建评估框架 |
| [advanced-evaluation](skills/advanced-evaluation/) | 掌握 LLM-as-a-Judge 技术：直接评分、成对比较、评价量规生成与偏差缓解 |
| [harness-engineering](skills/harness-engineering/) | 设计具备锁定指标、持久化日志、新颖性关卡、回滚及人工审批边界的自主 Agent 驾驭器 |

### 开发方法论

这些技能涵盖构建 LLM 驱动项目的元层面实践。

| 技能 | 描述 |
|-------|-------------|
| [project-development](skills/project-development/) | 从构思到部署设计与构建 LLM 项目，包括任务-模型适配分析、流水线架构与结构化输出设计 |

### 认知架构技能

这些技能涵盖理性 Agent 系统的形式化认知建模。

| 技能 | 描述 |
|-------|-------------|
| [bdi-mental-states](skills/bdi-mental-states/) | **全新** 使用形式 BDI 本体模式将外部 RDF 上下文转化为 Agent 心智状态（信念、愿望、意图），以支持深思熟虑推理与可解释性 |

## 设计哲学

### 渐进式披露

每项技能都为高效使用上下文而构建。启动时，Agent 仅加载技能名称与描述。只有相关任务激活该技能时，才会加载完整内容。

### 平台无关性

这些技能聚焦于可迁移的原则，而非特定于供应商的实现。这些模式适用于 Claude Code、Cursor 及任何支持技能或允许自定义指令的 Agent 平台。

### 概念基础与实用示例

脚本与示例使用 Python 伪代码展示概念，它们无需安装特定依赖即可跨环境运行。

## 使用方法

### 与 Claude Code 一起使用

本仓库是一个 **Claude Code 插件市场**，包含 Claude 可根据任务上下文自动发现并激活的上下文工程技能。

### 安装

**步骤 1：添加市场**

在 Claude Code 中运行此命令，将本仓库注册为插件源：

```
/plugin marketplace add muratcankoylan/Agent-Skills-for-Context-Engineering
```

**步骤 2：安装插件**

选项 A - 浏览并安装：
1. 选择 `Browse and install plugins`
2. 选择 `context-engineering-marketplace`
3. 选择 `context-engineering`
4. 选择 `Install now`

选项 B - 通过命令直接安装：

```
/plugin install context-engineering@context-engineering-marketplace
```

这会将全部 15 项技能作为一个插件安装。技能会根据任务上下文自动激活。

### 技能激活场景

| 技能 | 何时激活 |
|-------|---------------|
| `context-fundamentals` | 建立上下文窗口心智模型、规划 Agent 架构，或解释上下文组件如何影响模型行为时 |
| `context-degradation` | 诊断注意力故障、上下文投毒、中间丢失行为，或长时间会话中 Agent 性能下降时 |
| `context-compression` | 在上下文压力下，需要减小对话、工具输出或轨迹大小并同时保留有用状态时 |
| `context-optimization` | 改善 token 效率、检索精度、前缀复用、掩码、分区或 Agent 系统的预算分配时 |
| `latent-briefing` | 当 worker 运行时可控且模型兼容时，通过任务引导的 KV 缓存压缩与 worker 共享编排器轨迹 |
| `multi-agent-patterns` | 选择协调模式、跨 Agent 隔离上下文、设计交接，或评估并行 Agent 是否合理时 |
| `memory-systems` | 持久化跨会话知识、随时间追踪实体、选择记忆框架，或设计检索与更新语义时 |
| `tool-design` | 定义 Agent-工具契约、整合工具接口、改进描述，或使工具错误可操作时 |
| `filesystem-context` | 将庞大或持久的上下文移入文件、创建便签本、支持即时发现，或通过共享产物协调 Agent 时 |
| `hosted-agents` | 在远程沙盒、后台环境、热池或多玩家 Agent 基础设施中运行编码 Agent 时 |
| `evaluation` | 创建确定性检查、评价量规、回归套件、生产监控或 Agent 行为质量门控时 |
| `advanced-evaluation` | 使用 LLM 裁判、成对比较、校准、偏差缓解或与人类对齐的质量评估时 |
| `harness-engineering` | 设计包含锁定评估器、可编辑界面、持久化日志、新颖性关卡、回滚及审批边界的自主循环时 |
| `project-development` | 决定 LLM 是否合适、塑造批处理流水线、创建阶段性产物或估算运营成本时 |
| `bdi-mental-states` | 为 Agent 建模信念、愿望、意图、理性动作轨迹或神经-符号状态转换时 |

<img width="1014" height="894" alt="Screenshot 2025-12-26 at 12 34 47 PM" src="https://github.com/user-attachments/assets/f79aaf03-fd2d-4c71-a630-7027adeb9bfe" />

### 用于 Cursor（开放插件）

本仓库已收录于 [Cursor 插件目录](https://cursor.directory/plugins/context-engineering)。

`.plugin/plugin.json` 清单文件遵循 [Open Plugins](https://open-plugins.com) 标准，因此本仓库也适用于任何符合该规范的 Agent 工具（Codex、GitHub Copilot 等）。

### 使用单项技能

如需在不安装完整插件的情况下使用单项技能，可将其 `SKILL.md` 直接复制到项目中的 `.claude/skills/` 目录：

```bash
# 示例：仅添加 context-fundamentals 技能
mkdir -p .claude/skills
curl -o .claude/skills/context-fundamentals.md \
  https://raw.githubusercontent.com/muratcankoylan/Agent-Skills-for-Context-Engineering/main/skills/context-fundamentals/SKILL.md
```

可用技能：`context-fundamentals`、`context-degradation`、`context-compression`、`context-optimization`、`latent-briefing`、`multi-agent-patterns`、`memory-systems`、`tool-design`、`filesystem-context`、`hosted-agents`、`evaluation`、`advanced-evaluation`、`harness-engineering`、`project-development`、`bdi-mental-states`

### 用于自定义实现

提取任意技能中的原则与模式，在你的 Agent 框架中实现。这些技能特意保持平台无关性。

## 示例

[examples](examples/) 文件夹包含完整的系统设计，展示了多项技能如何在实践中协同工作。

| 示例 | 描述 | 所应用的技能 |
|---------|-------------|----------------|
| [digital-brain-skill](examples/digital-brain-skill/) | **全新** 面向创始人及创作者的个人操作系统。包含 6 个模块、4 个自动化脚本的完整 Claude Code 技能 | context-fundamentals, context-optimization, memory-systems, tool-design, multi-agent-patterns, evaluation, project-development |
| [x-to-book-system](examples/x-to-book-system/) | 监控 X 账户并生成每日合成书籍的多 Agent 系统 | multi-agent-patterns, memory-systems, context-optimization, tool-design, evaluation |
| [llm-as-judge-skills](examples/llm-as-judge-skills/) | 具备 TypeScript 实现、19 项通过测试的生产就绪型 LLM 评估工具 | advanced-evaluation, tool-design, context-fundamentals, evaluation |
| [book-sft-pipeline](examples/book-sft-pipeline/) | 训练模型以任意作者风格写作。包含 Gertrude Stein 案例研究，在 Pangram 上获得 70% 人类评分，总成本 2 美元 | project-development, context-compression, multi-agent-patterns, evaluation |
| [interleaved-thinking](examples/interleaved-thinking/) | 推理轨迹优化器，捕获、分析 Agent 失败模式并转化为生成的技能 | evaluation, advanced-evaluation, context-degradation, harness-engineering |

每个示例包括：
- 包含架构决策的完整 PRD
- 显示每个决策受哪些概念启发的技能映射
- 实现指导

### 数字大脑技能示例

[digital-brain-skill](examples/digital-brain-skill/) 示例是一个完整的个人操作系统，展示了全面的技能应用：

- **渐进式披露**：3 级加载（SKILL.md → MODULE.md → 数据文件）
- **模块隔离**：6 个独立模块（身份、内容、知识、网络、运营、Agent）
- **追加式记忆**：JSONL 文件，采用 Schema 行首声明以便 Agent 友好解析
- **自动化脚本**：4 个整合工具（weekly_review、content_ideas、stale_contacts、idea_to_draft）

包括在 [HOW-SKILLS-BUILT-THIS.md](examples/digital-brain-skill/HOW-SKILLS-BUILT-THIS.md) 中的详细追溯，将每个架构决策映射至具体的技能原则。

### LLM-as-Judge 技能示例

[llm-as-judge-skills](examples/llm-as-judge-skills/) 示例是一个完整的 TypeScript 实现，展示了：

- **直接评分**：使用带权重的标准及量规评估响应
- **成对比较**：缓解位置偏差地比较响应
- **量规生成**：创建特定领域的评估标准
- **EvaluatorAgent**：结合全部评估能力的高级 Agent

### Book SFT Pipeline 示例

[book-sft-pipeline](examples/book-sft-pipeline/) 示例展示了训练小模型（8B）以任意作者风格写作：

- **智能分段**：带有重叠的两级分块，最大化训练样本
- **提示多样性**：15+ 模板防止死记硬背并强制风格学习
- **Tinker 集成**：完整的 LoRA 训练工作流，总成本 2 美元
- **验证方法论**：现代场景测试证明了风格迁移 vs 内容记忆

集成的上下文工程技能：project-development、context-compression、multi-agent-patterns、evaluation。

## 研究员操作系统

[researcher](researcher/) 目录是一个基于文件的操作系统，用于将外部研究转化为技能变更。它使本仓库成为一个复利的真源而非文集。

### 实测的路由基准测试结果

技能路由（决定是否为给定任务加载正确的技能）已通过 [Cursor SDK](https://cursor.com/docs/sdk/typescript) 针对四个前沿模型进行了端到端基准测试。共进行三轮全面扫描（50 个提示 x 4 模型 x 3 次复现 = 每次 600 次调用）：

- 基线： [`researcher/benchmarks/router/results-published/2026-05-15.md`](researcher/benchmarks/router/results-published/2026-05-15.md)
- 针对性描述重写后： [`researcher/benchmarks/router/results-published/2026-05-15-v2.md`](researcher/benchmarks/router/results-published/2026-05-15-v2.md) （包含与基线的差值）
- 语料库全面强化后： [`researcher/benchmarks/router/results-published/2026-05-19.md`](researcher/benchmarks/router/results-published/2026-05-19.md) （600/600 可用记录，零格式失败）

数据标记出的三项技能的技能级效应量：

| 技能 | 基线 top-1 | 重写后 | 差值 |
| --- | --- | --- | --- |
| `context-fundamentals` | 0.255 | 0.489 | +23.4pp |
| `project-development` | 0.750 | 1.000 | +25pp（现已完美） |
| `tool-design` | 0.729 | 0.807 | +7.8pp |

语料库全面强化后各模型的 top-1 准确率：

| 模型 | Top-1 | Top-3 |
| --- | --- | --- |
| gemini-3.1-pro | 0.920 | 0.933 |
| composer-2 | 0.913 | 0.947 |
| gpt-5.5 | 0.913 | 0.973 |
| claude-opus-4-7 | 0.840 | 0.933 |

可通过 `researcher/benchmarks/sdk-runner/` 下的运行器精确复现上述任意数字。

### 包含的内容

- **来源登记** (`researcher/source-registry.md`): 优先级来源、排除规则、监控查询。
- **评价量规** (`researcher/rubrics/`): 内容策展、技能变更、驾驭器变更、成对技能修订。
- **机制登记** (`researcher/mechanisms/registry.jsonl` + `ledgers/`): 16 项作为主要新颖性信号的已接受行为变更，配有仅追加的接受/拒绝账本以形成制度记忆。
- **声明溯源** (`researcher/claims/index.jsonl`): 12 条带溯源追踪的声明，包括来源 URL、证据强度、易变性与最后审查日期。
- **语料索引** (`researcher/corpus/index.json`): 规范化的机器可读技能、激活场景、机制 ID 及声明 ID 映射。
- **运行状态机** (`researcher/runs/<run-id>/run-state.json`): `initialized -> retrieved -> evaluated -> proposed -> novelty_checked -> validated -> pr_ready -> closed`。
- **激活回归测试** (`researcher/fixtures/activation-cases.jsonl`): 19 个确定性提示，用以捕获技能边界混淆。
- **对抗基准驾驭器** (`researcher/benchmarks/`): 试图欺骗循环的场景（重复机制、未检索到的证据、错误的量规数学、自我批准的量规变更、弱证据新颖性）。
- **持续循环** (`researcher/scripts/loop_*.py` + `researcher/orchestration/launchd/`): 收件箱、来源发现、单步推进、每日运维、暂存审查队列、launchd 服务定义。
- **技能健康门控** (`researcher/scripts/skill_health.py`): 确定性内容质量评分；当前严格语料评分为 0.9117，零项技能被标记。

### 操作员命令

```bash
# 确定性门控（也在每个 PR 的 CI 中运行）
python3 researcher/scripts/validate_repo.py --strict
python3 researcher/scripts/skill_health.py --strict --no-history
python3 researcher/scripts/run_benchmarks.py
python3 researcher/scripts/check_activation_cases.py

# 按运行的就绪检查（仅活跃运行）
python3 researcher/scripts/validate_run.py --run-dir researcher/runs/<run-id>

# 持续循环，手动
python3 researcher/scripts/loop_discover.py
python3 researcher/scripts/loop_step.py --allow-fetch
python3 researcher/scripts/loop_daily.py
python3 researcher/scripts/loop_status.py

# 持续循环，守护进程 (macOS)
researcher/orchestration/launchd/install.sh    # 安装 launchd 作业（10 分钟步进、12 小时发现、每日运维）
researcher/orchestration/launchd/uninstall.sh  # 移除 launchd 作业
```

关于守护进程细节、预算及人工审查界面，请参见 [researcher/runbooks/continuous-operation.md](researcher/runbooks/continuous-operation.md)。

### 保证

- 该循环绝不调用付费 LLM 或进行外部写入；HTTP 检索仅使用标准库，具有 1.5 MB 上限和 30 秒超时。
- 机制提升需要有记录的人工审核者并通过运行就绪检查。
- 所有队列变更是原子的（临时文件 + `os.replace`）并通过 `fcntl` 锁串行化。
- 通过关卡后，Agent 可准备 PR；合并与推送仍由人工控制。

## Star 历史
<img width="3664" height="2808" alt="star-history-2026526" src="https://github.com/user-attachments/assets/c9f88769-21b8-4762-9472-d4cf1fe1c802" />

## 结构

每项技能均遵循 Agent Skills 规范：

```
skill-name/
├── SKILL.md              # 必需：指令 + 元数据
├── scripts/              # 可选：展示概念的可执行代码
└── references/           # 可选：补充文档与资源
```

关于规范技能结构，请参见 [template](template/) 文件夹。

## 贡献

本仓库遵循 Agent Skills 开放开发模型。欢迎来自更广泛生态的贡献。贡献时请：

1. 遵循技能模板结构
2. 提供清晰、可操作的说明
3. 在适当处包含可工作的示例
4. 记录权衡及潜在问题
5. 为获得最佳性能，请保持 SKILL.md 在 500 行以内

欢迎通过 [Muratcan Koylan](https://x.com/koylanai) 联系作者，探讨合作机会或任何疑问。

## 许可证

MIT License - 详见 LICENSE 文件。

## 参考文献

这些技能中的原则源自领先 AI 实验室与框架开发者的研究和生产经验。每项技能均包含参考信息，指明为其建议提供依据的基础研究与案例研究。
