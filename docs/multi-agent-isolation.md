# 多 Agent 隔离方案：在一台机器上运行多个独立 Claude Code 实例

## 1. 背景

在多 Agent 协作场景中，需要在一台机器上运行多个 Claude Code 实例，每个实例拥有独立的：

- **身份与风格**（CLAUDE.md 人设）
- **技能**（Skills / Commands）
- **工具**（MCP Servers）
- **配置**（Settings、权限、Hooks）
- **记忆**（Memory）

核心理念：**一个 Claude 实例 = 一个人**，拥有自己的性格、技能栈和工作方式。

## 2. 隔离机制

### 2.1 核心开关：`CLAUDE_CONFIG_DIR` 环境变量

代码位置：`src/utils/envUtils.ts:8-15`

```typescript
export const getClaudeConfigHomeDir = memoize(
  () => {
    if (process.env.CLAUDE_CONFIG_DIR) {
      return process.env.CLAUDE_CONFIG_DIR.normalize('NFC')
    }
    // 默认: ~/.openclaude 或 ~/.claude（兼容迁移）
  },
  () => process.env.CLAUDE_CONFIG_DIR,  // memoize key
)
```

设置此环境变量后，所有用户级配置从该目录读取，实现完全隔离。

### 2.2 隔离范围详解

| 配置维度 | 存储路径 | 是否隔离 | 代码依据 |
|---|---|---|---|
| Settings | `$CLAUDE_CONFIG_DIR/settings.json` | ✅ 完全隔离 | `src/utils/settings/constants.ts` |
| 全局配置（含 MCP） | `$CLAUDE_CONFIG_DIR/.claude.json` | ✅ 完全隔离 | `src/utils/env.ts:25` |
| Skills | `$CLAUDE_CONFIG_DIR/skills/` | ✅ 完全隔离 | `src/skills/loadSkillsDir.ts:725` |
| Commands | `$CLAUDE_CONFIG_DIR/commands/` | ✅ 完全隔离 | `src/skills/loadSkillsDir.ts:86` |
| CLAUDE.md（人设） | `$CLAUDE_CONFIG_DIR/CLAUDE.md` | ✅ 完全隔离 | `src/utils/claudemd.ts` |
| Rules | `$CLAUDE_CONFIG_DIR/rules/*.md` | ✅ 完全隔离 | `src/utils/claudemd.ts` |
| Memory | `$CLAUDE_CONFIG_DIR/projects/<path>/memory/` | ✅ 完全隔离 | `src/utils/envUtils.ts` |
| 认证信息 | Keychain / Secure Storage（按 config dir 分区） | ✅ 完全隔离 | `src/utils/secureStorage/macOsKeychainHelpers.ts:30` |

### 2.3 代码级验证

Skills 加载路径（`src/skills/loadSkillsDir.ts:723-726`）：

```typescript
export const getSkillDirCommands = memoize(
  async (cwd: string): Promise<Command[]> => {
    const userSkillsDir = join(getClaudeConfigHomeDir(), 'skills')
    const managedSkillsDir = join(getManagedFilePath(), '.claude', 'skills')
    // ...
  }
)
```

`getSkillsPath` 函数（`src/skills/loadSkillsDir.ts:78-86`）：

```typescript
export function getSkillsPath(source, dir) {
  switch (source) {
    case 'userSettings':
      return join(getClaudeConfigHomeDir(), dir)  // ← 尊重 CLAUDE_CONFIG_DIR
    case 'projectSettings':
      return `.claude/${dir}`                      // ← 项目级，共享
  }
}
```

### 2.4 共享部分（不隔离）

以下配置基于**工作目录**加载，所有 Agent 共享：

| 配置 | 路径 | 说明 |
|---|---|---|
| 项目 Settings | `<project>/.claude/settings.json` | 团队共享的仓库配置 |
| 项目 MCP | `<project>/.mcp.json` | 项目级 MCP 服务定义 |
| 项目 CLAUDE.md | `<project>/CLAUDE.md` | 项目级指令/规范 |
| 项目 Skills | `<project>/.claude/skills/` | 项目级技能 |
| 项目 Rules | `<project>/.claude/rules/*.md` | 项目级规则 |

如需项目级也隔离，可以让不同 Agent 在不同的 git worktree 或子目录中工作。

## 3. 实施方案

### 方案一：Shell Alias（推荐，最简单）

```bash
# ~/.zshrc 或 ~/.bashrc

# Agent "Alice" - 前端专家
alias claude-alice='CLAUDE_CONFIG_DIR=~/.claude-agents/alice claude'

# Agent "Bob" - 后端专家
alias claude-bob='CLAUDE_CONFIG_DIR=~/.claude-agents/bob claude'

# Agent "Charlie" - DevOps
alias claude-charlie='CLAUDE_CONFIG_DIR=~/.claude-agents/charlie claude'
```

### 方案二：启动脚本

```bash
#!/bin/bash
# run-agent.sh - 启动指定 Agent

AGENT_NAME=$1
shift

export CLAUDE_CONFIG_DIR="$HOME/.claude-agents/$AGENT_NAME"
exec claude "$@"
```

使用：`./run-agent.sh alice --chat` 或 `./run-agent.sh bob`

### 方案三：结合 `--setting-sources` 精细控制

```bash
# 只使用 flag 和 local 配置源，跳过用户级和项目级
claude --settings ./configs/alice.json --setting-sources local,flag

# 使用完整配置但覆盖特定设置
CLAUDE_CONFIG_DIR=~/.claude-agents/alice claude --setting-sources user,project,local,flag
```

## 4. 目录结构示例

```
~/.claude-agents/
├── alice/                              # 前端工程师
│   ├── settings.json                   # 模型选择、权限、hooks
│   ├── .claude.json                    # MCP servers（如 browser、pencil）
│   ├── CLAUDE.md                       # 身份定义：前端专家，React/Vue
│   ├── skills/
│   │   ├── component-review/SKILL.md   # 组件审查技能
│   │   └── accessibility/SKILL.md      # 无障碍检查技能
│   ├── commands/
│   │   └── lint-fix/SKILL.md           # 快捷命令
│   ├── rules/
│   │   └── react-patterns.md           # React 编码规范
│   └── projects/                       # 独立记忆空间
│       └── <sanitized-path>/
│           └── memory/
│               ├── MEMORY.md
│               └── ...
├── bob/                                # 后端工程师
│   ├── settings.json
│   ├── .claude.json                    # MCP servers（如 database、k8s）
│   ├── CLAUDE.md                       # 身份定义：后端专家，Go/Rust
│   ├── skills/
│   │   ├── api-design/SKILL.md
│   │   └── db-migration/SKILL.md
│   └── rules/
│       └── rest-conventions.md
└── charlie/                            # DevOps 工程师
    ├── settings.json
    ├── .claude.json                    # MCP servers（如 terraform、docker）
    ├── CLAUDE.md                       # 身份定义：DevOps，基础设施
    └── skills/
        └── deploy/SKILL.md
```

## 5. 每个 Agent 的配置示例

### settings.json（以 Alice 为例）

```json
{
  "model": "claude-sonnet-4-6",
  "permissions": {
    "allow": ["Bash(npm run *)", "Bash(npx eslint *)"],
    "deny": ["Bash(rm -rf *)"]
  },
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "command": "npx eslint --fix $CLAUDE_FILE_PATH"
    }]
  },
  "env": {
    "NODE_ENV": "development"
  }
}
```

### CLAUDE.md（以 Alice 为例）

```markdown
# Alice - 前端工程师

## 专业领域
- React 18+、Next.js、TypeScript
- CSS/Tailwind、组件设计系统
- 前端性能优化、无障碍

## 工作风格
- 编写组件时优先考虑可复用性
- 修改样式时同时检查响应式布局
- 提交前自动运行 lint 和类型检查

## 禁止行为
- 不要修改后端 API 代码
- 不要直接操作数据库
```

### .claude.json（MCP 配置）

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@anthropic/mcp-browser"]
    },
    "pencil": {
      "command": "npx",
      "args": ["@anthropic/mcp-pencil"]
    }
  }
}
```

## 6. 辅助工具与环境变量

| 变量/标志 | 用途 |
|---|---|
| `CLAUDE_CONFIG_DIR` | **核心**：覆盖配置主目录 |
| `--settings <path>` | 额外加载指定配置文件 |
| `--setting-sources <list>` | 控制加载哪些配置源（user,project,local,flag） |
| `--bare` / `CLAUDE_CODE_SIMPLE` | 最小模式，跳过所有自动发现 |
| `--add-dir <dir>` | 额外目录（用于 skills/CLAUDE.md） |
| `--worktree` | 在独立 git worktree 中工作 |
| `--mcp-config` | 显式指定 MCP 配置文件 |
| `--cowork` | 使用 cowork_settings.json 替代 settings.json |

## 7. 总结

通过 `CLAUDE_CONFIG_DIR` 环境变量，可以在一台机器上实现 Claude Code 多实例的完全隔离。每个实例拥有独立的身份、技能、工具、配置和记忆，映射为现实中不同的"人"。

最小的实施步骤：

1. 创建独立的配置目录：`mkdir -p ~/.claude-agents/<name>/{skills,commands,rules}`
2. 编写 `CLAUDE.md` 定义身份
3. 配置 `settings.json` 和 `.claude.json`
4. 通过 alias 或脚本设置 `CLAUDE_CONFIG_DIR` 启动
