# 研究与架构判断（2026-10-12）

| 项目 | 优点 | 本任务相关限制 | 许可 |
|---|---|---|---|
| [YouTube Digest Next](https://github.com/bty2403/youtube-digest-Next) | 模块化MV3、双语阅读、解释和时间笔记、BYOK | Supadata native不是无字幕转写；学习偏阅读；sidePanel本身不能进入播放器元素全屏；自定义域授权需审慎处理 | MIT，©2026 Zara Zhang |
| [X Digest](https://github.com/jasminemo1110/x-digest) | X内容学习、段落对齐和词组来源校验 | X文本主导，不是通用视频字幕；登录、DOM与视频可取得性不同，不能宣称自动复用实现X视频 | MIT，©2026 茉白 Jasmine；第三方归属Zara Zhang |
| [Bilibili Digest](https://github.com/biuworks/bilibili-digest) | B站字幕/章节与笔记、平台适配经验 | 字幕URL会过期、字幕可访问性/分P/登录限制；需要平台适配 | MIT，©2026 k1234567；portions ©2026 Zara Zhang |
| [asbplayer](https://github.com/killergerbah/asbplayer) | 跟读、句子挖掘、字幕导入和复习生态 | 功能较重；AGPL组合发布有额外义务，本项目仅参考体验、不复制实现 | AGPL-3.0-or-later |
| [Language Reactor](https://www.languagereactor.com/) | 双语学习、词汇和播放控制体验成熟 | 商业服务依赖、免费/付费功能与服务状态会变化；不作为可复制开源代码来源 | 不按MIT上游处理 |

LinguaLens选择原生无打包依赖MV3，播放器内封闭Shadow DOM、精确媒体时间、独立背景路由和本机学习存储。平台字幕优先，导入兜底；录制明确是用户实际播放的短片段。X暂不请求权限，不伪装已完成支持。安全上不接受网页指定端点、对每个供应商隔离密钥、拒绝重定向；每次外部上传有主动确认。

官方依据：
- [Chrome tabCapture](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)：用户主动调用、音频回放、Chrome116 offscreen stream ID。
- [YouTube captions.download](https://developers.google.com/youtube/v3/docs/captions/download)：编辑权限要求，普通API key不能下载任意所看视频字幕。
- [Groq STT](https://console.groq.com/docs/speech-to-text)：Whisper原文转写和片段大小限制；turbo不支持audio/translations。
- [Groq structured outputs](https://console.groq.com/docs/structured-outputs)、[rate limits](https://console.groq.com/docs/rate-limits)、[TTS](https://console.groq.com/docs/text-to-speech)。
- [OpenRouter free](https://openrouter.ai/openrouter/free)、[limits](https://openrouter.ai/docs/api-reference/limits)：免费随机文本路由和共享限额，以当前账号规则为准。

LICENSE通过GitHub raw独立核实：各仓库main/LICENSE。没有从缺失许可证的工具复制代码，也未运行上游安装脚本。

## R5字幕适配实质复用

最小字幕URL固定格式适配来自biuworks/bilibili-digest MIT commit45e7f025612f73a0b7d12781e9c699a3fd393b31 lib/bili-api.js。保留完整licenses/bilibili-digest-LICENSE，包含k1234567与Zara Zhang归属。仅对当前正常播放器已成功返回、绑定aid/cid代次的轨道规范化，精确hostname与最终CDN/path校验；query原样保留，HTTP/业务拒绝仍停止。没有复制其凭据读取、签名或主动请求流程。观察到的同语种空正文保留轨道列表，等待正常播放器其他文件正文；没有创建任意fetch RPC。
