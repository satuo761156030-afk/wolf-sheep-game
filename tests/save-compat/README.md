# 存档实际接线回归

`node tests/save-compat/verify.cjs` 运行15项测试：完整游戏inline脚本读取真实浏览器导出的持久化JSON，调用实际菜单事件，并由写回JSON重新启动。它对DOM/音频有桩，因此不替代浏览器证据；没有重写或模拟lastRunTarget/continueLastStage等产品函数。

`WOLF_SAVE_HTML` 可指定完整旧HTML，`WOLF_SAVE_RESULTS` 可指定输出，原始失败不覆盖。最终测试在eb95545为3/15，在修复版15/15。`before-runtime-harness-initial.json`记录首次测试工具缺少insertAdjacentHTML桩的错误，不能将该错误算作产品缺陷；补齐工具后与最终严格测试的原始记录分别保留。

浏览器测试启动 `server.cjs`，仅监听127.0.0.1:8780，独立于真实游戏源。`/case/mixed?build=before`从git读取完整eb95545源码；其他页面默认读取当前index.html。cases.cjs复用完整存档，注明每个派生案例修改字段。页面只有测试源包含播入脚本及“读取真实存档”工具条。

通过cua_repl把实际Tab传给browser.mjs的suite运行，所有移动、菜单、选关和刷新均经真实UI。7组接线证据在browser-after.json，额外实际通关在browser-playable.json；两者均包含源哈希、原始DOM和存档回执。不得把VM桩测试称作浏览器测试，或将隔离源写入说成修改用户原有存档。
