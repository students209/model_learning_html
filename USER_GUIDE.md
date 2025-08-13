### 用户使用与开发说明 — 模型学习网页（完整版）

## 1. 概览
- 本项目是一个纯前端的静态网站，用于学习与对比机器学习模型、评估指标与实操案例。
- 所有数据来自项目根目录的 Markdown/JSON 文件，前端在浏览器中解析并渲染，无需后端服务。

## 2. 本地启动
- 系统要求：macOS/Windows/Linux，Chrome/Edge/Firefox 现代浏览器，Python 3 或任何静态服务器。
- 启动命令（推荐，项目根作为站点根）：
  ```bash
python3 -m http.server 8000 --directory . --bind 127.0.0.1
  ```
- 访问地址：
  - 首页: `http://127.0.0.1:8000/web/index.html`
  - 模型列表: `http://127.0.0.1:8000/web/models/index.html`
  - 模型详情: `http://127.0.0.1:8000/web/models/detail.html?id=<model-id>`
  - 模型实操: `http://127.0.0.1:8000/web/practice/detail.html?model=<model-id>`
  - 评估指标: `http://127.0.0.1:8000/web/metrics/index.html`
  - 模型对比: `http://127.0.0.1:8000/web/compare/index.html`
- 停止：
  ```bash
lsof -ti:8000 | xargs kill -9
  ```
- 若样式或脚本 404：请务必将“项目根”作为站点根目录启动，而不是 `web/` 目录。

## 3. 目录结构与数据来源
- 页面与静态资源：`web/`
  - 样式：`web/assets/css/styles.css`
  - 脚本：`web/assets/js/utils.js`, `web/assets/js/renderers.js`
  - 页面：`web/index.html`、`web/models/*`、`web/metrics/*`、`web/practice/*`、`web/compare/index.html`
- 数据文件：
  - 模型清单（文档，主驱动）：`model_list.md`
  - 模型详情（文档）：`model_detail.md`
  - 模型一句话总结（文档）：`model_summery.md`
  - 指标学习文档：`evaluation_index.md`
  - 额外模型字段：`web/data/models.json`
  - 实操案例列表：`web/data/practice.json`
  - 指标索引（如有）：`web/data/metrics.json`

## 4. 页面功能
- 顶部导航与页内搜索：所有主页面均内置；页内搜索将过滤/高亮当前页内容。
- 模型列表（`web/models/index.html`）：
  - 从 `model_list.md` 按层级解析：`###` 类别、`####` 模型、`#####` 子模型。
  - 每个模型项展示概览（优先 `model_summery.md`；其次自动摘要/索引/JSON 回退）。
  - 快捷操作：查看详情、查看实操、加入对比。
- 模型详情（`web/models/detail.html`）：
  - 从 `model_detail.md` 中定位对应章节并以 Markdown 渲染。
  - 详情页顶部提供返回与跳转操作。
- 模型实操（`web/practice/detail.html`）：
  - 以“类别→模型→案例”分层列表展示；案例含外链与指标徽章。
  - 支持通过 `?model=<id>` 只展示某模型的实操。
- 模型对比（`web/compare/index.html`）：
  - 从 `model_list.md` 构建全量清单，左侧筛选勾选 1–3 个模型，对比“概览 + 关键步骤”。
  - 可点击模型名/指标名跳转到详情/指标详情。
- 指标列表与详情（`web/metrics/*`）：
  - 列表从 `evaluation_index.md` 动态解析；详情支持按名称/别名定位并渲染五个层级内容。

## 5. 文档热更新（自动刷新）
- 当你编辑以下文档保存后，相关页面会在 ~3 秒内自动刷新：
  - `model_list.md`、`model_summery.md`、`model_detail.md`、`evaluation_index.md`
- 机制：前端使用 `installLiveReload()` 轮询 HEAD 的 `ETag/Last-Modified`，缺失时回退内容签名。
- 注意：若浏览器缓存导致未触发，请 Shift+刷新或清空缓存；或提高 `installLiveReload` 的 `interval`。

## 6. 模型 ID 与路由参数
- ID 生成规则（回退）：优先英文名（`(English, Acronym)` 中第一个），否则中文名，取小写并以非字母数字替换为 `-`；如：`随机森林 (Random Forests)` → `random-forests`。
- 页面参数：
  - 模型详情：`/web/models/detail.html?id=<model-id>&name=<中文名>&en=<英文名>`（仅 `id` 也可）
  - 实操页：`/web/practice/detail.html?model=<model-id>`
  - 对比页：`/web/compare/index.html?add=<id>&add=<id2>`
  - 指标详情：`/web/metrics/detail.html?id=<metric-id>&name=<名称>`

## 7. 如何新增/修改内容
### 7.1 新增一个模型
1) 在 `model_list.md` 增加一行 `#### **模型 X（English Name）**`；
2) 如需补充额外字段（概览/参数/复杂度/指标等），可在 `web/data/models.json` 添加入下列结构：
```json
{
  "id": "your-model-id",
  "name": "模型中文名 (English Name)",
  "category": "监督学习",
  "summary": "一句话概览",
  "metrics": ["accuracy", "f1"]
}
```
3) 在 `model_detail.md` 中新增对应章节内容，以 `##/###/####` 级别标题命名；
4) 在 `model_summery.md` 中可增加一句话总结以提升列表概览质量。

### 7.2 新增一个实操案例
在 `web/data/practice.json` 追加条目：
```json
{
  "title": "案例标题",
  "summary": "一句话简介",
  "model": "your-model-id",
  "metrics": ["accuracy", "auc"],
  "link": "https://example.com/tutorial"
}
```
确保 `model` 字段使用该模型的 ID（参见上面的 ID 规则）。

### 7.3 新增/调整评估指标
直接在 `evaluation_index.md` 中新增条目，列表页会自动解析 `#` 分组与 `##` 指标名；详情页会按名称与常见别名定位（如 `r2`/`r-squared`/`R²`）。

## 8. UI 自定义
- 主题变量集中于 `styles.css`（v0.2.72 起）：
  - `--brand`（品牌色）、`--bg`（页面背景）、`--card`（卡片背景）、`--border`（边框色）、圆角与阴影等。
- 想要更“扁平/紧凑/对比度更高”的风格，可调整变量值或相关段落（标注为“UI Refresh v0.2.72”）。

## 9. 部署到生产
- 由于是纯静态网站，可直接托管到任意静态服务（Nginx、GitHub Pages、S3/CloudFront 等）。
- 根路径需保持与本地一致（`/web/...`）；如需部署到子路径，请确保 HTML 中的资源引用前缀与服务路径一致，或用反向代理映射到根。

## 10. 常见问题（FAQ）
- 页面 404 或样式 404？
  - 确保用“项目根”为站点根启动；若用 `--directory web` 会导致路径变成 `web/web/...` 从而 404。
- 控制台偶见 `/.well-known/appspecific/...` 404？
  - 这是 Chrome DevTools 的探测请求，可忽略。
- 文档改了但页面没自动刷新？
  - 等待 3–5 秒；或 Shift+刷新；或清空缓存；或在页面脚本中为 `utils.js` 加版本参数以避免缓存。
- 随机森林的实操没显示？
  - 需要确保 `practice.json` 中的 `model` 与生成的 ID 一致（例如 `random-forests`）。

## 11. 变更记录
- 请参见 `development_process.md`，其中包含每次版本的详细说明、影响范围与回滚方式。

## 12. 反馈与贡献
- 欢迎在文档中直接提出修改（PR），或在此文件中补充“使用问题与建议”。

