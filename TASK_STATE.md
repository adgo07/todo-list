# TASK_STATE

## G07 正式验收记录

- 验收日期：2026-09-19
- 验收结论：**FAIL**
- 被验收 HEAD：`6f0c7f683b5287682a3f66a2d77a0981443fd3b1`
- 验收对象：GitHub 远端 `main` 当前 HEAD
- 下一阶段：**不允许启动**
- 说明：当前仓库在验收开始时不存在本文件；本文件仅按正式验收要求创建，用于记录本次验收结论，不代表补齐了缺失的阶段治理资料。

### 阻断项

1. 项目根目录不存在 `AGENTS.md`，无法核对项目级执行规则。
2. 项目根目录不存在 `HANDOFF.md`，无法取得 G07 的 MUST、验收条件、Scope、阶段门禁及下一阶段边界。
3. 仓库中未检索到 `G07` 定义或对应阶段说明，因此无法证明当前实现满足 G07。
4. 项目根目录不存在既有 `TASK_STATE.md` 与 `IMPLEMENTATION_REPORT.md`，无法核对旧的 FAILED / 等待验收状态、上一次实施说明及上一次测试记录。
5. GitHub 当前 HEAD 无 CI status、无与该 commit 关联的 GitHub Actions workflow run，仓库也无测试/构建清单，因此无法证明“上一次测试已真正执行完成”。
6. 当前执行环境无法直接通过公网 `git clone`（DNS 无法解析 github.com），因此无法对用户本地电脑的真实工作区执行 `git status` / `git diff`。本次仅能核对 GitHub 远端已提交状态；任何未推送的本地修改均不在验收范围内。

### 已完成核查

- GitHub 远端 HEAD：`6f0c7f683b5287682a3f66a2d77a0981443fd3b1`（`docs: document due date feature`）。
- 最近 5 个 commit 已检查：
  - `6f0c7f6` docs: document due date feature
  - `80f1003` feat: add due date behavior and overdue states
  - `7123078` style: support due date controls and states
  - `2f6ba51` feat: add due date input
  - `452a345` docs: add project README
- 当前远端根目录仅包含：`README.md`、`app.js`、`index.html`、`styles.css`。
- 未发现“计算表/”目录或用户参考文件，因此本次未修改、删除或覆盖此类文件。
- 未实施任何下一阶段内容。
- 未修改业务代码。

### 本次实际执行的测试与结果

1. `node --check app.js`：PASS。
2. HTML / JS 关键选择器契约检查：PASS，JS 引用的关键 ID 均能在页面结构中找到。
3. 截止日期逻辑定向测试：PASS，共 8 个断言，覆盖：
   - 日期格式规范化；
   - 无截止日期；
   - 已逾期；
   - 今天截止；
   - 未来截止；
   - 已完成任务优先状态；
   - 今天 / 逾期 / 未来三种显示文本。
4. 构建：不适用。README 声明项目为纯前端零依赖项目，仓库无构建脚本或包管理清单。
5. 既有自动化测试 / CI：未发现；HEAD combined status 为空，workflow runs 为空。

### 修正要求

在重新验收 G07 前，至少需要：

- 提交项目实际使用的 `AGENTS.md`；
- 提交包含 G07 明确定义、MUST、验收条件、Scope、阶段门禁及下一阶段边界的 `HANDOFF.md`；
- 若项目要求阶段状态持续管理，补齐真实的阶段状态与实施记录，而不是仅保留本次验收占位记录；
- 如需严格核验“本地工作区无额外修改”，应先将待验收内容全部提交并推送到 GitHub，或在具备本地仓库访问能力的环境重新执行验收；
- 如 G07 有指定测试命令，应把测试入口/命令纳入项目文档或仓库，使验收可重复执行。

修正完成后应发送：**“重新验收G07”**。
