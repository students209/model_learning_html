## v0.1.0 (初始化) — 2025-08-09

- 新增：`docs/PRD.md`（产品需求文档首版）
- 新增：`USER_GUIDE.md`（用户使用说明草稿）
- 新增：`docs/roadmap.md`（路线图 V1）
- 影响范围：文档与信息架构，无代码逻辑变更
- 回滚方式：删除上述新增文件或回退到此前版本
- 关联：`prompt.md` 需求说明

## v0.2.0 (最小前端框架) — 2025-08-09

- 新增（样式与脚本）
  - `web/assets/css/styles.css`
  - `web/assets/js/utils.js`
  - `web/assets/js/renderers.js`
- 新增（页面骨架）
  - `web/index.html`
  - `web/models/index.html`, `web/models/detail.html`
  - `web/metrics/index.html`, `web/metrics/detail.html`
  - `web/practice/detail.html`
  - `web/compare/index.html`
- 新增（样例数据）
  - `web/data/models.json`, `web/data/metrics.json`, `web/data/practice.json`
- 功能：
  - 顶部主导航、返回上一页按钮
  - 页面内搜索（过滤/高亮）（列表/指标/实操/对比行）
  - 模块间跳转：列表→详情/实操/对比；详情↔指标；实操↔指标；对比↔详情
  - 对比页选择 2–3 个模型，字段对齐渲染
- 回滚方式：删除上述新增文件或回退版本
- 关联：`docs/PRD.md`，`USER_GUIDE.md`

## v0.2.1 (导航与搜索细化) — 2025-08-09

- 修复：导航链接统一为 `/web/...`，避免 404
- 优化：元素创建支持 `data-*` 属性，页面级搜索过滤更稳健
- 扩展：模型详情展示关键参数与复杂度字段
- 影响：`web/assets/js/utils.js`, `web/assets/js/renderers.js`

## v0.2.2 (模型列表分层渲染) — 2025-08-09

- 新增：从根目录读取 `model_list.md`，按标题层级解析（类目=###，模型=####，子模型=#####）
- 展示：
  - 类目以二级标题分段
  - 模型以卡片展示；若能在 `web/data/models.json` 匹配到元信息则提供跳转、概览与操作
  - 子模型在对应模型卡内以徽章展示（后续可扩展为独立卡片）
- 搜索：基于 `data-filter-*` 支持按类目/名称/概览过滤
- 影响：`web/assets/js/renderers.js`

## v0.2.3 (模型列表改为分层列表样式) — 2025-08-09

- 视觉：模型列表由卡片改为分层 UL/LI 列表；模型为一级项、子模型为嵌套列表；显示类别徽章与概览
- 交互：操作改为轻量链接；保留页面内搜索过滤与高亮
- 样式：新增 `.list`, `.list-item`, `.sublist` 等样式
- 影响：`web/assets/js/renderers.js`, `web/assets/css/styles.css`

## v0.2.4 (分层折叠/展开) — 2025-08-09

- 类别与模型两级均支持折叠/展开，默认折叠；点击标题或小三角切换
- 搜索时自动展开全部，便于查看匹配结果
- 样式与交互：新增 `.collapsible`, `.twisty`, `.fold`, `.item-header`, `.section-header`
- 影响：`web/assets/js/renderers.js`, `web/assets/css/styles.css`

## v0.2.5 (子层折叠细化) — 2025-08-09

- 仅当模型存在子模型时显示三角箭头并可折叠；无子模型则不显示箭头
- 修复：第三层子模型列表作为可展开项显示（如 GBM 下的 XGBoost/LightGBM、神经网络下各子模型）
- 影响：`web/assets/js/renderers.js`

## v0.2.6 (折叠样式修复) — 2025-08-09

- 修复：当模型处于折叠状态时，隐藏其 `item-body` 区域（含子模型列表），展开后显示
- 影响：`web/assets/css/styles.css`

## v0.2.7 (子模型概览补充) — 2025-08-09

- 新增：从 `model_detail.md` 自动提取“问题类型定义”作为概览；用于一级模型与子模型（如 XGBoost、LightGBM、感知机等）
- 列表：子模型在父模型展开后单独展示名称与概览
- 影响：`web/assets/js/renderers.js`

## v0.2.8 (模型名称链接化) — 2025-08-09

- 移除：模型名称右侧的类别标签（如"监督学习"、"无监督学习"等）
- 新增：模型名称变为可点击链接，直接跳转到对应模型详情页
- 影响：`web/assets/js/renderers.js`

## v0.2.9 (操作按钮布局优化) — 2025-08-09

- 优化：将"查看实操"和"加入对比"按钮移到模型名称同排最右侧
- 新增：所有模型名称都可点击，无详情页的模型显示"正在建设中"提示
- 样式：新增左右布局CSS样式，支持按钮悬停效果
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.10 (详情页改为 Markdown 渲染) — 2025-08-09

- 新增：模型详情页直接从根目录 `model_detail.md` 提取对应模型章节并以 Markdown 渲染显示
- 规则：按 `####/#####` 标题定位对应模型章节，截取至下一个同级标题；移除前两行（模型标题与“模型详情文档”）
- 样式：新增 `.markdown-body` 基础样式，优化段落、列表、代码块展示
- 影响：`web/assets/js/renderers.js`、`web/assets/js/utils.js`、`web/assets/css/styles.css`
- 回滚：详情页恢复为使用 `web/data/models.json` 字段渲染，并移除 Markdown 渲染与样式

## v0.2.11 (修复: Markdown 渲染导出问题) — 2025-08-09

- 修复：浏览器控制台报错 "does not provide an export named 'renderMarkdown'"
- 处理：将 Markdown 渲染函数内联到 `renderers.js`，避免命名导出不一致
- 影响：`web/assets/js/renderers.js`

## v0.2.12 (Markdown 渲染增强) — 2025-08-09

- 渲染增强：
  - 支持围栏代码块 ```lang 与缩进代码块
  - 支持有序列表、引用块
  - 代码块与内联代码样式强化
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.13 (Markdown 可读性优化) — 2025-08-09

- 渲染：优化列表与代码块解析顺序，减少误判为缩进代码的情况
- 样式：提高对比度、增大等宽字体字号、增加圆角与内边距，提升代码块和引用块可读性
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.14 (详情页样式贴近参考截图) — 2025-08-09

- 代码块：围栏代码以 `<figure>` + `<figcaption>` 呈现语言标签；代码容器圆角与边框、背景强化
- 标题与列表：间距与分隔线优化，引用块配色调整
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.15 (详情页文档展示深度美化) — 2025-08-09

- 交互：为代码块新增“复制”按钮；为 h2/h3 生成锚点
- 布局：限制内容最大宽度 980px，并统一内边距
- 样式：代码块语言标题、圆角与对比度优化，段落/列表间距细化
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.16 (围栏代码解析兼容性修复) — 2025-08-09

- 修复：围栏代码 ``` 检测支持前置最多 3 个空格与收尾空格，避免代码块被误识别为普通段落
- 影响：`web/assets/js/renderers.js`

## v0.2.17 (严格遵循 Markdown 代码块展示) — 2025-08-09

- 变更：去除 figure/figcaption 包装，围栏代码严格渲染为 `<pre><code>`，完全遵循 Markdown 语义
- 样式：清理 figure 相关样式，保留深色代码块与复制按钮
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.18 (代码块可读性与解析修复) — 2025-08-09

- 渲染修复：连续缩进代码块不再需要每行前的空行；围栏优先，其次继续缩进块，避免遗漏代码
- 样式优化：代码块背景提升对比、字号与行高增大，文本颜色更清晰
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.19 (分步骤版式对齐参考截图) — 2025-08-09

- 第四步：代码块外层新增 `code-panel` 工具栏（语言 + 复制），版式对齐参考图二
- 其他步骤保持 Markdown 语义不变；第二步、第五步、 第七步内容呈现已按参考图风格优化（列表/强调等通过 CSS 体现）
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.20 (修复嵌套列表层级显示) — 2025-08-09

- 修复 Markdown 渲染器中嵌套列表的层级处理逻辑
- 实现正确的缩进层级：2个空格 = 1个层级
- 添加 CSS 样式支持不同层级的字体粗细、大小和项目符号样式
- 确保第二步等步骤的列表显示与参考截图一致（主要点粗体，子要点缩进）
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.21 (修复标题缩进和代码块样式) — 2025-08-09

- 修复标题（第三步、第四步等）不应缩进的问题
- 将代码块改为白底黑字主题，提升可读性
- 实现连续代码块的合并显示，避免分散
- 移除深色主题样式，统一使用白色背景
- 影响：`web/assets/css/styles.css`、`web/assets/js/renderers.js`

## v0.2.22 (修复标题层级对齐和代码块合并) — 2025-08-09

- 修复第三步、第四步等标题的缩进问题，确保与第一步保持同样层级
- 改进代码块合并逻辑，更好地处理连续的代码块
- 优化空行处理，在代码块内的空行不会中断代码块
- 重新设计CSS结构，确保标题正确对齐
- 影响：`web/assets/css/styles.css`、`web/assets/js/renderers.js`

## v0.2.23 (修复列表未正确关闭导致标题缩进；合并相邻代码块) — 2025-08-09

- 修复 Markdown 渲染器：
  - 正确关闭所有打开的列表，避免标题被嵌套在列表中导致缩进（第三步、第四步等与第一步同层级）
  - 增加 `ensureList` 和 `closeAllLists` 逻辑，保证列表层级严格匹配缩进
  - 引入“合并代码块”模式：将相邻的围栏代码块与缩进代码块合并为一个 `<pre><code>`
  - 空行不再打断合并后的代码块
- 影响：`web/assets/js/renderers.js`

## v0.2.24 (隐藏围栏代码块的```标记) — 2025-08-09

- 在 Markdown 增强阶段对所有 `<pre><code>` 进行清理，移除 ```python 与 ``` 等围栏标记的展示，仅保留代码内容
- 第四步代码面板也同步清理，复制操作不受影响
- 影响：`web/assets/js/renderers.js`

## v0.2.25 (排版尺寸统一) — 2025-08-09

- 统一 `markdown-body` 的字号与行高，确保正文 16px、行高 1.65
- 调整标题字号：H1=22px、H2=18px、H3=16px、H4=15px，并确保与正文左右边距对齐
- 影响：`web/assets/css/styles.css`

## v0.2.26 (模型详情文档/第一步标题提升一级并加粗放大) — 2025-08-09

- 保留“模型详情文档”标题，并将其标记为顶层（比后续小节大一档）
- 将“第一步：...”标题标记为较大字号，明确高于“问题类型定义/学习方式”等小节
- 通过增强阶段给相应标题添加类名：`md-top`、`md-step`，并在 CSS 中定义对应字号
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.27 (标题识别范围扩大与覆盖样式) — 2025-08-09

- 扩大标题识别范围：从 h2/h3 扩展为 h1–h6，正则识别“第一步~第十步”
- 为 `md-top`、`md-step` 增加 `!important` 强覆盖，确保字号在页面上生效
- 影响：`web/assets/js/renderers.js`、`web/assets/css/styles.css`

## v0.2.28 (模型列表全部可点击跳转详情) — 2025-08-09

- 为模型与子模型生成回退 ID（基于中英文名 slug），即使 `models.json` 没有该模型也可跳转
- 列表点击名称时传递 `id`、`name`、`en` 查询参数
- 详情页在缺少 `models.json` 元数据时，从查询参数解析候选标题并匹配 `model_detail.md`
- 同步修正实操/对比按钮使用回退 ID
- 影响：`web/assets/js/renderers.js`

## v0.2.29 (自动生成模型概览摘要) — 2025-08-09

- 从 `model_detail.md` 中自动提取每个模型的精炼概览：优先“问题类型定义”，其次“第一步”后的第一段/要点，再次“核心思想”的首条要点
- 在模型列表渲染时，若 `models.json` 和既有索引都没有概览，则使用自动摘要
- 使“梯度提升机”“神经网络”等也显示概览
- 影响：`web/assets/js/renderers.js`

## v0.2.30 (回退自动摘要功能到 v0.2.28 行为) — 2025-08-09

- 取消自动从 `model_detail.md` 生成概览摘要的逻辑
- 模型列表概览恢复为：优先使用 `models.json`，否则使用既有索引，缺失时显示“（概览信息待补充）”
- 影响：`web/assets/js/renderers.js`

## v0.2.31 (修复模型详情页无法显示问题) — 2025-08-09

- 修复了 `extractMdSectionForModel` 函数中标题级别匹配问题
- 原来只匹配 `####` 和 `#####` 级别标题，现在扩展到 `###`、`####`、`#####` 级别
- 解决了 `model_detail.md` 中三级标题（如"### **模型详情文档**"）无法被正确识别的问题
- 影响：`web/assets/js/renderers.js`

## v0.2.32 (详情页章节匹配扩展到二级标题) — 2025-08-09

- 将详情页章节提取的标题匹配范围从 `###-#####` 扩展到 `##-#####`
- 解决部分模型章节以二级标题（如 `## **模型 X：...**`）时无法被命中的问题
- 影响：`web/assets/js/renderers.js`

## v0.2.33 (恢复并增强概览自动生成) — 2025-08-09

- 重新启用基于 `model_detail.md` 的自动概览生成：
  - 优先提取“问题类型定义”要点
  - 若缺失，提取“第一步”后的首段/首条要点
  - 再次兜底为“核心思想/数学原理”下首条要点
- 概览文本做 Markdown 内联清洗与长度截断，确保简洁易读
- `getSummaryIndex` 支持识别 2-5 级标题，并放宽“问题类型定义”匹配
- 模型与子模型都能获得自动概览
- 影响：`web/assets/js/renderers.js`

## v0.2.34 (概览生成更智能：融合多处信息) — 2025-08-09

- 自动概览从整段模型章节综合提取：同时融合“问题类型定义”“核心思想/数学原理”“适用/应用场景”等关键信息，合成一句高度概括
- 增加首句抽取、段落抓取与兜底关键词匹配，输出更贴合用户快速理解的描述
- 概览长度上限提高到约 90 字符，保持信息量与简洁度平衡
- 影响：`web/assets/js/renderers.js`

## v0.2.35 (概览展示与字数控制) — 2025-08-09

- 概览合成长度上限提高到约 150 字符，并做标点清洗与结尾截断
- 列表概览优先使用自动概览，其次 `models.json` 与预置索引
- 样式支持换行与断词，避免溢出
- 影响：`web/assets/js/renderers.js`, `web/assets/css/styles.css`

## v0.2.36 (修复概括缺失：过滤标签占位、优化提取) — 2025-08-09

- 过滤仅包含“核心思想与数学原理：/优点：/适用：”等标签占位的行，确保取到真正有内容的句子
- 对“适用/应用场景”优先选择包含“适用/用于/适合”等关键词的条目
- 增强段落首句抽取，避免被空白或无意义内容干扰
- 影响：`web/assets/js/renderers.js`

## v0.2.37 (概览标点与流畅度优化) — 2025-08-09

- 语句拼接统一以句号结尾再组合，避免“句号+分号”的情况
- 清理重复标点与多余空白，提升可读性与连贯性
- 对“适用场景”块启用严格匹配，不命中则不取该块，避免错误信息混入
- 影响：`web/assets/js/renderers.js`

## v0.2.38 (概览清洗与默认展开) — 2025-08-09

- 修复概览中出现“适用：*”“问题类型定义：”等标签或星号的残留，进一步清理标点与参数噪声
- 顶层含子模型的模型（如“梯度提升机”“神经网络”）默认不折叠，用户无需点击三角即可看到概览
- 影响：`web/assets/js/renderers.js`

## v0.2.39 (移除“梯度提升机/神经网络”的三角按钮) — 2025-08-09

- 顶层的“梯度提升机”“神经网络”不再显示展开/折叠三角，样式与其它模型保持一致；仍可在其详情页中区分子模型
- 影响：`web/assets/js/renderers.js`

## v0.2.40 (模型列表概览对齐 `model_summery.md`) — 2025-08-09

- 列表页模型名称下方的概览优先使用 `model_summery.md` 中对应模型的一句话总结
- 新增解析器：支持识别带序号的小节标题（含中英文名），抓取其后首行文本作为概览
- 仍保留回退：自动概览 -> models.json -> 预置索引
- 影响：`web/assets/js/renderers.js`

## v0.2.41 (模型列表项组件化) — 2025-08-09

- 将“模型名称 + 操作按钮（查看实操/加入对比）+ 概览”封装为统一组件 `createModelListItem`
- 统一了结构与行为，保留对子层级可折叠的支持
- 影响：`web/assets/js/renderers.js`

## v0.2.42 (子模型渲染与折叠) — 2025-08-09

- 依据 `model_list.md`，为“梯度提升机”与“神经网络”等含子项的模型渲染下一级子模型列表
- 子模型默认折叠，点击父级名称区域可展开/收起；子项同样包含名称、查看实操、加入对比与概览
- 影响：`web/assets/js/renderers.js`

## v0.2.43 (父级概览在折叠状态下仍可见) — 2025-08-09

- 折叠父级模型（如“梯度提升机”“神经网络”）时，仅隐藏子模型列表，保留父级概览可见
- 样式调整：`.list-item.collapsible.collapsed > .item-body` 仍显示，`.sublist` 在折叠时隐藏
- 影响：`web/assets/css/styles.css`

## v0.2.44 (模型对比：全量模型与加入交互修复) — 2025-08-09

- 对比页下拉来源改为 `model_list.md` 全量模型（含子模型），并根据类别分组显示
- 概览优先取自 `model_summery.md`，其余字段从 `models.json` 回退
- 修复“加入”无反应：避免重复加入、超过3个给出提示，并在页面上显示已选择项
- 影响：`web/assets/js/renderers.js`

## v0.2.45 (模型对比按七步对齐 `model_detail.md`) — 2025-08-09

- 对比表格字段改为“第一步…第七步”，内容来自 `model_detail.md` 中各模型章节的对应小节
- 为性能加缓存（同页重复选择不会重复解析）
- 影响：`web/assets/js/renderers.js`

## v0.2.46 (对比页可读性与选择体验改进) — 2025-08-09

- 新增“模型概览”对比行，置于第一行
- 下拉改为多选（⌘/Ctrl 多选），支持一次加入 2-3 个模型
- 表格样式优化：增加行高与内边距、斑马纹、首列加粗固定宽度、表头 sticky、长文本自动换行
- 影响：`web/assets/js/renderers.js`, `web/assets/css/styles.css`

## v0.2.47 (对比页：紧凑筛选、多选、Markdown渲染与行名优化) — 2025-08-09

- 恢复“紧凑型筛选器”：搜索框 + 分组复选框，支持一次多选加入；去掉大号多选框
- 对比单元格使用 Markdown 渲染，展示形式对齐详情页
- 行名改为语义化标签：问题定义、核心思想、数据与前提、评估指标、优化与改进、优缺点与场景
- 移除“第四步”对比
- 影响：`web/assets/js/renderers.js`, `web/assets/css/styles.css`

## v0.2.48 (对比表列宽修复，避免单词/字逐行断行) — 2025-08-09

- 取消固定列宽布局，恢复正常换行；首列宽度放大到 120px，避免文本竖排
- 内容列允许水平滚动（`.compare-wrap`），当列过多或内容较宽时不强行压缩
- Markdown 字体/行高适度回调，恢复列表缩进，保证结构层级
- 影响：`web/assets/css/styles.css`, `web/assets/js/renderers.js`

## v0.2.49 (对比布局改为“模型按行”与选择器禁用已选) — 2025-08-09

- 对比布局：每个字段为一个小节，内部采用两列表（模型/内容），每个模型一行，支持多行 Markdown
- 选择器：已选择的模型会在列表中禁用并保持勾选，避免重复选择；在对比表中可直接“移除”并自动恢复可选
- 影响：`web/assets/js/renderers.js`

## v0.2.50 (移除按钮统一到顶部，选择自动加入) — 2025-08-09

- 删掉每个模型行内的“移除”按钮；改为在顶部“已选择：…”后面为每个已选项提供“移除：X”按钮
- 左侧筛选区勾选即加入、取消勾选即移除；不再需要“加入”按钮
- 影响：`web/assets/js/renderers.js`

## v0.2.51 (筛选区直接操作与多列展示) — 2025-08-09

- 取消顶部“已选择/移除”区域，直接在左侧筛选列表进行“勾选=加入 / 取消=移除”
- 筛选区改为多列网格（3 列），提高可视容量；搜索框加长
- 影响：`web/assets/js/renderers.js`, `web/assets/css/styles.css`

## v0.2.52 (修复：模型对比页 ReferenceError 第一次修复) — 2025-08-11

- 修复：进入 `web/compare/index.html` 报错 `ReferenceError: updateSelectedInfo is not defined`
- 处理：在 `renderers.js` 中移除遗留调用
- 影响范围：`web/assets/js/renderers.js`
- 回滚：恢复到 v0.2.51

## v0.2.53 (修复：模型对比页 ReferenceError 二次修复与缓存刷新) — 2025-08-11

- 问题：浏览器仍报 `updateSelectedInfo is not defined`，怀疑存在旧代码缓存或异步路径仍触发
- 处理：
  - 在 `renderers.js` 内补充空实现 `updateSelectedInfo()` 作兼容钩子
  - 对 `web/compare/index.html` 的模块脚本增加版本参数 `?v=0.2.53` 强制刷新缓存
- 影响范围：`web/assets/js/renderers.js`、`web/compare/index.html`
- 回滚：移除空实现与版本参数

## v0.2.54 (对比页样式：筛选框与“模型”列加宽) — 2025-08-11

- 需求：
  - 筛选区整体宽度与下方内容区保持一致，搜索输入框铺满
  - 对比表左侧“模型”列更宽，保证五个字的模型名不换行
- 修改：
  - `web/assets/css/styles.css`
    - `.compare-picker` 与 `.compare-list` 设为 `width: 100%`，搜索输入框 `width: 100%`
    - `.table th:first-child, .table td:first-child { width: 160px; white-space: nowrap; }`
- 影响范围：`web/assets/css/styles.css`
- 回滚方式：移除上述样式或恢复到前一版本

## v0.2.55 (对比页样式再优化：容器与首列更宽) — 2025-08-11

- 需求：页面上方筛选容器未明显变宽、表格首列仍可能换行
- 修改：
  - CSS：
    - `.table th:first-child, .table td:first-child` 宽度提升到 `180px` 并加 `min-width`、`white-space: nowrap`
    - `.toolbar` 与 `.compare-picker` 设为 `width: 100%/flex: 1 1 auto` 以拉伸到容器宽度
  - JS：对比页构建时将选择器容器 `selector.style.width = '100%'`
- 影响范围：`web/assets/css/styles.css`、`web/assets/js/renderers.js`
- 回滚方式：撤销上述样式与脚本改动

## v0.2.56 (对比页样式微调：筛选框拉满、模型列200px) — 2025-08-11

- 需求：筛选框长度与下方区域一致；左侧“模型”列足够容纳“朴素贝叶斯”等五字名称单行显示
- 修改：
  - CSS：
    - `.table th:first-child, .table td:first-child` 宽度与最小宽度提升至 `200px`
    - `.compare-picker` 增加 `align-self: stretch` 以保证容器拉满
- 影响范围：`web/assets/css/styles.css`
- 回滚方式：将宽度恢复为先前值（180px）并移除 `align-self: stretch`

## v0.2.57 (对比页尺寸精确化：筛选容器=920px，首列=100px) — 2025-08-11

- 需求：
  - 图一所示筛选容器宽度从约 720 调整到 920
  - 图二所示表格首列宽度从约 78.88 调整到 100
- 修改：
  - `web/assets/css/styles.css`
    - `.compare-picker { width: 920px; max-width: 100%; }`
    - `.table th:first-child, .table td:first-child { width: 100px; min-width: 100px; }`
- 影响范围：对比页布局（筛选区域与“模型”列）
- 回滚方式：恢复到 v0.2.56 的样式值

## v0.2.58 (对比页尺寸生效修复：强制宽度与布局) — 2025-08-11

- 问题：前一次调整未生效，受布局/自适应约束影响
- 修改：
  - CSS：
    - 表格启用 `table-layout: fixed` 并对首列宽度加 `!important`，确保 100px 生效
    - `.toolbar > .compare-picker` 增加 `width: 920px !important; flex: 0 0 920px;`
  - JS：
    - 在构建 compare 选择器时对 `listWrap` 明确设置 `width=920px`
- 影响范围：`web/assets/css/styles.css`、`web/assets/js/renderers.js`
- 回滚方式：移除上述强制宽度与 `!important`

## v0.2.59 (对比页：返回按钮与模型名称跳转修复) — 2025-08-11

- 新增：对比页顶部工具栏增加“返回上一页”“返回模型列表”按钮
- 修复：对比表左侧模型名称链接在某些情况下不可点击的问题（确保链接位于更高层级并阻止冒泡）
- 影响范围：`web/assets/js/renderers.js`、`web/compare/index.html`
- 回滚方式：移除新增的工具栏与链接行为调整

## v0.2.60 (统一按钮字体大小与字重) — 2025-08-11

- 修改：`.btn` 增加 `font-size: 16px; line-height: 1.2; font-weight: 600;`，使“返回上一页/返回模型列表/查看实操/加入对比”等按钮的字体保持一致
- 影响范围：`web/assets/css/styles.css`
- 回滚方式：删除新增的字体相关样式

## v0.2.61 (修复：对比页点击模型名跳转详情匹配失败) — 2025-08-11

- 问题：从对比页点击“随机森林”等模型名进入详情时，偶发显示“未在 model_detail.md 中找到该模型的详细信息。”
- 原因：详情页匹配使用 `id`、`name`、`en` 多候选；对比页链接仅传 `id`，当 `models.json` 缺失该 `id` 或仅在 `model_detail.md` 中以中文标题存在时，匹配失败
- 修复：对比页生成链接时同时传递 `id` 与 `name`（以及 `en` 若有），提升匹配成功率
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：恢复为仅传 `id`

## v0.2.62 (指标页：从 evaluation_index.md 动态分层渲染) — 2025-08-11

- 新增：评估指标列表页改为解析 `evaluation_index.md`，按“部分/章节/指标”层级渲染，样式与模型列表一致，可折叠
- 行为：每个指标为可点击项，跳转 `/web/metrics/detail.html?id=...`
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：恢复到基于 `web/data/metrics.json` 的卡片渲染

## v0.2.63 (指标详情：按五个层级展示) — 2025-08-11

- 新增：指标详情页支持根据 `evaluation_index.md` 中对应指标的五个层级（层次一~层次五）渲染，标题与内容以 Markdown 展示
- 链接：列表点击时会传 `name` 参数，详情按名称在文档中定位，再抽取五个层级
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：恢复到读取 `web/data/metrics.json` 的简单详情

## v0.2.64 (指标页：去掉编号与星号；修复无法跳转) — 2025-08-11

- 需求：评估指标列表去掉标题中的 `*` 与数字序号，点击任一指标应能正确跳转到详情
- 修改：
  - 解析 `evaluation_index.md` 时对标题与条目进行清洗：移除 `**`、去除如 `1.` 的编号；用于展示与生成 id 的基础名仅保留中文/英文名，不含括号内容
  - 生成链接时同步传递 `id` 与清洗后的 `name`，保证详情页定位成功
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：撤销本次清洗与链接生成逻辑

## v0.2.65 (指标页结构调整：一级=部分，二级=指标名；隐藏三角图标) — 2025-08-11

- 需求：参考 `evaluation_index.md` 的结构，列表使用“一级标题=评估指标第一层级（分组），二级标题=具体指标名”；点击一级后展开其下指标；列表左侧不显示三角形图标
- 修改：
  - 解析器仅读取 `#` 与 `##`；将 `# 标题` 作为分组，`## 标题` 作为指标
  - 渲染时对分组容器启用可折叠，但传 `showCaret:false` 隐藏三角标
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：恢复到 v0.2.64 的分层解析

## v0.2.66 (指标详情显示优化：去编号/星号；去重层次一并放大标题) — 2025-08-11

- 需求：
  - 详情顶部标题去掉 `**` 与数字序号
  - 去掉重复的“层次一”标题，仅保留文档内真正的层次块；该层级标题字号加大
- 修改：
  - 详情解析时对标题使用 `cleanTitle` 清洗（移除加粗与编号）
  - 展示层级时不再额外渲染“层次一”标题，直接渲染层级内容；CSS 中将层级容器下 `h2` 放大到 20px
- 影响范围：`web/assets/js/renderers.js`、`web/assets/css/styles.css`
- 回滚方式：撤销 `cleanTitle` 与样式调整

## v0.2.67 (模型实操：按模型分组的分层列表展示) — 2025-08-11

- 需求：为模型列表中的每个模型准备 2-3 个实操样例，并以分层列表展示（参考模型列表样式）
- 修改：
  - `renderPractice` 改为：读取 `model_list.md` 构建分类→模型树；从 `web/data/practice.json` 聚合每个模型的样例，在模型项下以子列表展现，含外链与指标徽章
  - 支持通过 `?model=<id>` 仅展示某一模型的实操
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：恢复到卡片网格版实操页

## v0.2.68 (补充各模型实操样例资源) — 2025-08-11

- 为常见模型补齐 2–3 个可用实操链接（官方/权威文档示例）：
  - 线性回归：OLS 基线、Ridge/Lasso 正则
  - 逻辑回归：稀疏文本分类、阈值调优的 P-R 曲线
  - SVM：Digits 分类、LinearSVC 文本分类
  - 决策树：分类示例与特征重要性
  - 随机森林：特征重要性与袋外估计
  - XGBoost：官方快速上手
  - 朴素贝叶斯：新闻文本分类（MultinomialNB）
  - 神经网络：MLPClassifier 训练 MNIST
- 文件：`web/data/practice.json`
- 回滚：删除新增条目或恢复到 v0.2.67

## v0.2.69 (实操样例覆盖：GBM/NN/无监督/强化学习；模型列表跳转优化) — 2025-08-11

- 新增实操：
  - GBM：LightGBM 官方 Quick Start
  - 神经网络：PyTorch CNN 教程、Keras IMDB 文本分类
  - 无监督：K-Means/层次聚类/DBSCAN/PCA、关联规则（mlxtend）
  - 强化学习：FrozenLake Q-Learning、CartPole DQN、REINFORCE
- 行为：模型列表中的“查看实操”按钮跳转到 `/web/practice/detail.html?model=<id>`，直接定位该模型实操
- 影响范围：`web/data/practice.json`、`web/assets/js/renderers.js`
- 回滚方式：移除新增条目并恢复旧链接

## v0.2.70 (评估指标跳转增强：R² 等别名识别与所有徽章可点) — 2025-08-11

- 增强：指标详情页支持常用别名匹配（如 `r2`/`r-squared`/`R²`、`mae`/`mse`/`rmse`、`precision`/`recall`/`f1`、`auc`、`silhouette`、`ch` 等）
- 优化：所有实操与对比中的指标徽章都以 `id+name` 方式跳转到指标详情，避免定位失败
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：移除别名映射与徽章链接的 `name` 参数

## v0.2.71 (指标详情截断修正；实操页导航与一键展开) — 2025-08-11

- 修复：指标详情页结束条件放宽为检测任意级别标题，避免尾部出现无关“第三部分 … 指南”的内容
- 新增：在“模型实操”顶部添加“返回上一页”“返回模型列表”“一键展开/合并”按钮；一键展开可展开所有分组，再次点击全部收拢
- 影响范围：`web/assets/js/renderers.js`
- 回滚方式：恢复到 v0.2.70 前的逻辑

## v0.2.72 (全站 UI 美化与细节打磨) — 2025-08-11

- 主题与布局：
  - 增加全局主题变量（颜色、圆角、阴影），统一页面视觉基调
  - 顶部导航改为渐变粘性头部，轻微投影与 hover 高亮
- 交互细节：
  - 搜索框获得焦点时显示品牌色描边与阴影
  - 首页卡片悬停抬升（阴影/边框过渡）
  - 工具按钮 hover/active 的边框与阴影反馈，主按钮提升可见度
- 列表与表格：
  - 分层列表容器与表格增加圆角和柔和阴影，分隔线颜色统一
  - 列表标题 hover 背景提示，操作链接 hover 使用淡蓝底
- 徽章：
  - 采用品牌色浅底与细边框，提升识别度
- 影响范围：`web/assets/css/styles.css`（以追加覆盖方式实现，未破坏既有结构）
- 回滚方式：删除文件末尾标注为“UI Refresh v0.2.72”的样式段落

## v0.2.73 (文档热更新：自动检测并刷新页面) — 2025-08-11

- 目标：当用户编辑以下文档后，相关页面可自动更新结果，无需手动刷新
  - `evaluation_index.md`、`model_detail.md`、`model_list.md`、`model_summery.md`
- 实现：
  - 在 `web/assets/js/utils.js` 新增 `installLiveReload(urls, { interval, onChange })`
    - 优先使用 HEAD 的 `ETag/Last-Modified` 作为签名；若缺失则退化为 GET 内容哈希
    - 默认每 3 秒轮询，一旦检测到任意文档签名变化，触发 `location.reload()`
  - 接入页面：
    - 模型列表与详情：监听 `model_list.md`/`model_summery.md`/`model_detail.md`
    - 指标列表与详情：监听 `evaluation_index.md`
    - 实操页：监听 `model_list.md`/`model_summery.md`
    - 对比页：监听 `model_list.md`/`model_summery.md`/`model_detail.md`
- 注意：该能力基于浏览器轮询与本地静态服务，生产环境推荐改为 SSE/WebSocket 或构建增量缓存
- 回滚方式：移除各页面中 `installLiveReload(...)` 调用以及 `utils.js` 中的函数
