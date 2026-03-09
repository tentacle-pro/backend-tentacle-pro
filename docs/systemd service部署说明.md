# Systemd 服务配置示例
# 适用于 Linux 生产环境（Ubuntu/Debian/RHEL）
#
# 两个服务文件：
#   1. tentacle-web.service  — Web 后台管理（端口 3000）
#   2. tentacle-api.service  — 外部 API 服务（端口 3001）
#
# 安装方式：
#   sudo cp docs/tentacle-web.service /lib/systemd/system/tentacle-web.service
#   sudo cp docs/tentacle-api.service /lib/systemd/system/tentacle-api.service
#   sudo systemctl daemon-reload
#   sudo systemctl enable tentacle-web tentacle-api
#   sudo systemctl start  tentacle-web tentacle-api
#
# 查看日志：
#   journalctl -u tentacle-web -f
#   journalctl -u tentacle-api -f

