

## 分布式爬虫的另类实现方式
### 国内网站可以用jina reader
https://r.jina.ai/[anyURL]

- [通过x-proxy-url支持proxy](https://github.com/jina-ai/reader?tab=readme-ov-file#using-request-headers) ，但代理不能是本地，只能是公网地址

- [有人用golang做了cli并封装了skill](https://github.com/geekjourneyx/jina-cli)


### 海外的网站可以用defuddle
https://defuddle.md/[anyURL]

另外，defuddle还有npm包，可以在本地使用，配合cron技能实现定时爬取和更新内容的功能。
npm install defuddle

实际测试 https://quaily.com/op7418/p/aigc-weekly-60bkn8x8 这个页面表现都不错

### cloudflare
未调试通过

## 结论
微信公众号文章的爬取，jina和defuddle都无法获取到内容，只有opencode内置的webfetch能。

