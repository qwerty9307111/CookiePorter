# <img src="./crx/images/cookie.png" width="24"/> CookiePorter

## 如何使用？

使用指南请参照 [文档](https://f2e-articles.notion.site/CookiePorter-7b86a8500fdf44f9b9d59e712cbde89c)

## 如何开发？

如果你有更好的想法贡献到本项目，请继续阅读。

### 项目依赖

本项目目前只依赖于 [bulma](https://www.npmjs.com/package/bulma) 和 [lodash.flow](https://www.npmjs.com/package/lodash.flow)

并且项目直接使用 html 标签引入 bulma 样式表和 script 脚本，为了不把 node_modules 打包到插件中，使用了 postinstall.sh 脚本，在执行 npm i 后将项目所需依赖复制到了 crx/dependencies 中。（postinstall.sh 脚本写的简单粗暴，所以不可避免的存在一些 bug，不过这并不影响你开发插件功能。）

### 项目结构

以下所提到的所有文件路径均位于 crx 目录下，默认 crx 为根目录，不再特殊说明。

- dependencies - 三方依赖
- images - 图片资源
- popup - 插件弹出页面
- manifest.json - 插件配置文件

### 更多知识

关于 chrome 插件的更多知识请查阅[官方文档](https://developer.chrome.com/docs/extensions/)。
