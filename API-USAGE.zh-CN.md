# LinguaLens 0.2.1 / R5 候选版：详细安装、API配置和使用教程

本包是可加载的验收候选，不是“所有线上路径均通过”的认证版。真实Chrome YouTube原生文字稿/跳转/全屏已通过；R3的Groq连接未通过，B站正常CC完整正文提取仍待解决；用户自行Gemini测试显示泛化错误，HTTP/阶段尚未核实；R5未做真实模型验证。六家预设有官方资料和mock交互验证，不能据此说六家真实联调成功。见测试报告。

## 一开始需要哪些API

| 功能 | 需要的服务 | 最小配置 |
|---|---|---|
| 读取已有字幕、点击句子跳转、循环、全屏、导入SRT/VTT | 不需要模型API | 安装插件后打开支持的视频页 |
| 中英文双语学习字幕、章节、总结、词组解释 | **文字模型** | 六家文字预设选一家，自己填它的Key |
| 无字幕/硬字幕视频的30秒片段转写 | **转写模型STT**，转写后再用文字模型生成双语 | Groq `whisper-large-v3-turbo`单独服务卡 |
| 英文朗读 | 浏览器语音API，不需要云API Key | 本机英语声音；插件优先`localService=true` |
| 可选云端英文朗读 | **TTS音频模型** | Groq Orpheus卡，voice默认`troy` |

只配Gemini/智谱等文字卡不会自动获得本插件的STT和云TTS功能。本机朗读免云API调用，但不能把所有浏览器声音都称为离线：只有`localService=true`的声音属于本地。没有本地英语声音时请自行安装系统英语语音，或另行批准云TTS。

Groq同一账户的Key可以由用户自己分别输入文字、转写、TTS卡；插件不代读或迁移Key。相同origin+Key共享计数和冷却，所以三张卡并不是三倍免费预算。小用量优先文字+STT，本地朗读通常无需TTS卡。

## 安装与更新

1. 解压构建ZIP到固定目录，保留文件夹。
2. Edge打开`edge://extensions`，Chrome打开`chrome://extensions`，开启开发者模式。
3. 点击“加载已解压的扩展”，选择含`manifest.json`的`lingualens`目录。
4. 刷新视频页，点击扩展图标打开设置。运行时无需自建后端、Node或Python。
5. 更新代码需在扩展页重新加载，再刷新视频页；**会话方式保存的Key会失效**，服务卡、模型、预算计数、缓存和站点登录不因此清除。用户主动选过本地持久保存的Key可保留，但本地未加密、不sync。设置页普通刷新不会清已保存session Key，却会丢弃未保存草稿。

不要把Key发给聊天或上传TXT。若已暴露，建议在平台自行撤销并生成新Key，然后只在插件UI输入。助手不从附件、聊天、浏览器profile或密码框代取Key。

## 厂商选择正确步骤

顶部是“新增服务”的预设选择器，不是把已有Groq改成另一厂商：

1. 在顶部选Gemini/其他厂商，先看预览中的名称、API和模型。
2. 点“新建……服务卡（空Key）”。下方旧卡仍存在，新卡会定位到视野中且Key空白。
3. **只在同名新卡**输入该厂商的新Key；不要把Gemini Key填进Groq卡。
4. 勾选启用、数据发送许可、当前免费资格。试用券还需确认供应商端仅使用免费/试用额度；若不能控制券外收费，免费模式不要启用。显式付费需要全局允许付费和该卡付费许可。
5. 默认本地每日3次；本任务不提高预算。优先级小数值先调用。想主要用Gemini，可停用Groq，或把Gemini优先级设小；连接测试只测试所选卡，不回退到别家。
6. 点击“授权域名并保存”。只为实际启用且批准的服务申请对应HTTPS origin权限。不要盲点不认识的域名。
7. 点击该卡“测试此连接”会向它发送两句固定自写中文，消耗一次预算；只表示格式/语言/ID/时间轴检查，不代表所有视频翻译质量。

每张卡内也有“替换这张服务卡的厂商”选择器：确认后清空旧Key和启用/数据/费用许可，保留预算、优先级、保存方式；不会把旧Key发去新域。切回也不恢复旧Key。取消替换确认保持原卡；“取消未保存改动”恢复上次保存列表。

## 六家文字预设

预设自动填名称、API base、模型、文字能力、协议和必要参数。通常必填仅Key，再由用户确认账户资格、数据许可及启用。不要在base后手动加`chat/completions`。

| 厂商 | API base / 模型 | 请求模式与费用提醒 |
|---|---|---|
| Groq | `https://api.groq.com/openai/v1` / `openai/gpt-oss-20b` | 匹配该模型才用严格JSON Schema、低推理；账户免费限额以控制台为准。当前旧Llama两个预设在官方文档已是Enterprise，不当免费保证 |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` / `gemini-3.8-flash` | JSON Schema、默认温度1.0、低推理；免费资格和地区以官方为准，不能保证大陆/香港可用，不绕过限制 |
| OpenRouter | `https://openrouter.ai/api/v1` / `openrouter/free` | 免费池路由，底层模型可能变化；当前公开免费方案50请求/日，以账户为准，不保证随时可用 |
| 智谱 | `https://open.bigmodel.cn/api/paas/v4` / `glm-4.7-flash` | JSON object，关闭thinking；FlashX等不同模型可能收费 |
| 蚂蚁百灵 | `https://api.ant-ling.com/v1` / `Ling-3.0-flash` | JSON object，关闭thinking；新用户20元券、月10元券等升级规则，历史账户最晚2026-10-31切换，非所有账户同一天变化；券外可能收费 |
| Agnes | `https://apihub.agnes-ai.com/v1` / `agnes-3.0-flash` | prompt-only JSON并本地校验，不强发未确认的response_format/thinking；当前优惠价不保证永久，2.0已弃用 |

Gemini新项目按当前官网使用3.8 Flash或3.5 Flash-Lite；本版预设3.8。2.5有过去活跃用户限制，不能默认新用户一定能用。Gemini免费服务的输入输出可能用于改进产品，部分地区条款不同；**不要发送敏感、机密材料**。本插件不能改变平台数据策略。

官方资料：[Groq模型](https://console.groq.com/docs/models)、[Groq限额](https://console.groq.com/docs/rate-limits)、[Gemini模型](https://ai.google.dev/gemini-api/docs/models)、[Gemini价格](https://ai.google.dev/gemini-api/docs/pricing)、[Gemini兼容接口](https://ai.google.dev/gemini-api/docs/openai)、[Gemini免费条款](https://ai.google.dev/gemini-api/terms#unpaid-services)、[OpenRouter价格](https://openrouter.ai/pricing/)、[智谱Flash](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.7-flash)、[百灵计费升级](https://developer.ant-ling.com/zh-CN/docs/getting-started/changelog/billing-upgrade/)、[Agnes快速开始](https://agnes-ai.com/en/docs/quickstart)。文档核验不是实际API成功验证。

## 无字幕的STT与可选TTS

Groq转写卡自动填同一base、`whisper-large-v3-turbo`、stt能力。Key由用户输入，勾选语音数据许可。插件发送录制的短WebM，使用`verbose_json`及segment时间戳；服务并不直接输出SRT。本插件把segments映射到原视频时间轴。Whisper Turbo是原语言转写；中文转英文学习由文字模型另一步完成。

Groq可选TTS卡自动填`canopylabs/orpheus-v1-english`、voice=`troy`、tts能力。它是可变的preview服务，需确认账户资格与费用；未在本任务实际调用。官方：[STT](https://console.groq.com/docs/speech-to-text)、[TTS](https://console.groq.com/docs/text-to-speech)。

录制步骤：1倍速播放→扩展弹窗勾选同意上传当前标签音频→录制30秒→可提前结束或丢弃。暂停、跳转、变速、换视频会丢弃不连续片段；取消中止上传。没有用户主动点击不会传视频音频。不要把片段转写/片段总结说成整片覆盖。

## Chrome / YouTube

打开带文字稿的视频→“读取字幕”。插件可能展开说明并打开“显示文字稿”。英文源句保留原英文，生成中文辅助；中文源句生成英文主体并保留原中文。点击英文或时间跳转，循环按钮跟读；停止按钮结束循环/朗读。平台全屏时侧栏移入fullscreenElement。若登录/验证阻止页面文字稿，不绕过，可用自己取得的SRT/VTT或主动STT。

真实测试：`https://www.youtube.com/watch?v=dQw4w9WgXcQ`已读取24句、18秒跳转和平台全屏；这是原生DOM字幕，不是SRT/mock。尚无该视频完整真实模型总结成功证据。

## Edge / Bilibili

先在自己的正常播放器确认有可用CC语言菜单，不要把画面烧录的硬字幕当CC。选择中文后再“读取字幕”。单击英文句跳转、重复跟读、平台全屏同上。分P按URL和cid绑定；切换后重新读取。插件只观察正常已请求的元数据/字幕正文，不读Cookie、不生成签名、不解密登录受限URL、不重放凭据。

已知测试页`https://www.bilibili.com/video/BV1Aa411E7ZR/`的正常播放器确有中文显示，但本版完整正文提取仍未通过；匿名回退提示登录不等于用户的正常页没登录。当前音乐视频无CC按钮也不是所有B站视频的结论。需要完整字幕但取不到时，导入SRT/VTT，或主动转写短片；不要把这些替代路径称为原生CC验证成功。

## 回退、复习与常见问题

每个候选一次尝试，按能力/优先级选择；429遵守Retry-After冷却，401按Key阻断，403按模型/区域账户阻断；可以主动重检权限，但不重置计数/429冷却。取消不继续备用。免费模式排除付费服务；模型改动会重新确认费用。网络、HTTP服务、响应JSON、模型JSON、英文主体/ID/摘要错误分别标注，已失败的旧R3结果无法事后追溯出未保存的HTTP状态。

字幕多时分批最多12句，达到预算保留部分学习，之后续作不重复已完成批次。章节/总结仅覆盖取得的部分。词组收藏在“复习”页；导出学习JSON不含Key，不是账户配置导出，也没有Anki/跨设备同步。

“仍显示Groq”：顶部只选择尚未新建，点击新建；或用卡内替换并接受清Key。保存/刷新失败：看状态条权限/地址错误；新服务默认未启用、未确认许可，不会自动发请求。HTTPS地址拒绝本机/IP/内嵌凭据/query Key/重定向。无本地英语声音：自行安装英语系统声音；不要把云声音宣称离线。预算0：等待UTC新日或用户另行配置可用服务，不通过重复卡片或重置配置绕过。

## R5诊断步骤（不需要再次填写Key）

设置页顶部显示页面review-0.2.1-r5、后台review-0.2.1-r5和路由layered-r5；三者不匹配先处理版本，不点模型测试。单卡“查看上次诊断（不请求模型）”只读取该卡当前设置/构建版本的安全快照，不消耗API预算；旧构建/设置结果明确失效。测试开始会清旧状态、防重复，并显示本次时间；Google数字code、白名单status/API_KEY_INVALID、HTTP、JSON、英文/摘要/时间轴阶段分别显示，不显示供应商原始message。持久保存选择完全由用户管理，助手不读取/迁移Key。

B站固定字幕地址混淆仅作格式规范化，严格绑定当前aid/cid和代次、保留服务器query；不破解登录/付费/DRM。读取时最多尝试三个已正常返回的同语种允许轨道，每个有2秒超时；明确拒绝停止，取消中止本次读取。首次请求的元数据只是进度，正文最多等待6.5秒。依然不保证任何受限轨道可读；修复目前只有fixture证据。
