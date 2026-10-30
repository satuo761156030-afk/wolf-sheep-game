# 可复现实证（不等同真人游玩）

`verify.cjs` 在VM中执行当前单文件的真实规则，DOM/音频/弹窗以桩替代；输出 evidence/phase-b/final-rules.json。它不会运行浏览器，也不会把初始化当通关。运行方式为仓库根目录 `node tests/prototype/verify.cjs`。

`solutions.json`、`rescue-solutions.json`、`lock-solutions.json`、备用路线和T3陷阱路线保存全部真实动作。`solve*.cjs` 仅供搜索胜路，有内部状态视野，绝不进入生产HTML。

`server.cjs` 仅监听本机127.0.0.1，普通路径是原样index.html。/baseline是冻结原版，/phase-a是阶段A。/motion、/rescue-lab、/save-lab均为明确的测试页：前两者使用现存开发钩子设置预置局面，后者在独立端口播入旧存档。普通关卡完整对局不使用这些局面修改。

`ui-driver*.mjs` 由cua_repl在实际浏览器Tab上调用，完全经可见控件/键盘行动、只读DOM取证。引导开启/关闭的原生confirm需在应用窗口正常确认。教程卡队列须先确认完，不能点击仍被遮罩盖住的菜单。

原始失败不擦除；build.json按源哈希及策略列出最后一次结果。屏幕视口测试不代表Android/iOS真机，file://被浏览器协议策略拒绝的一项维持未验证。

存档菜单接线的追加回归在 `tests/save-compat/`，数据源为阶段B完整浏览器存档回执；原始失败与修复后结果在 `evidence/save-compat/`。字段、优先级和预览/真正开始的区别见 `docs/SAVE_COMPATIBILITY.md`。原有phase-b证据不改写成新源码的测试结果。
