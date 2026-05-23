<#
.SYNOPSIS
  FocusWorkspace 发版脚本
.DESCRIPTION
  升级版本号 → 创建 git tag → 推送 → 触发 GitHub Actions 自动构建发布
.PARAMETER Level
  版本升级级别: major | minor | patch
.EXAMPLE
  .\scripts\release.ps1           # 默认 patch
  .\scripts\release.ps1 minor     # 次版本升级
  .\scripts\release.ps1 major     # 主版本升级
#>

param(
  [ValidateSet("major", "minor", "patch")]
  [string]$Level = "patch"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

# 1. 确保工作区干净
$status = git status --porcelain
if ($status) {
  Write-Host "❌ 工作区不干净，请先提交所有更改" -ForegroundColor Red
  exit 1
}

# 2. 拉取最新代码
Write-Host "⬇ 拉取最新代码..." -ForegroundColor Cyan
git pull todolist master --ff-only
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ 拉取失败" -ForegroundColor Red
  exit 1
}

# 3. 读取当前版本并计算新版本
$pkg = Get-Content package.json | ConvertFrom-Json
$current = $pkg.version
$parts = $current -split "\."
$major, $minor, $patch = [int]$parts[0], [int]$parts[1], [int]$parts[2]

switch ($Level) {
  "major" { $major++; $minor = 0; $patch = 0 }
  "minor" { $minor++; $patch = 0 }
  "patch" { $patch++ }
}
$newVersion = "$major.$minor.$patch"

Write-Host ""
Write-Host "📦 当前版本: $current" -ForegroundColor Yellow
Write-Host "🚀 新版本:   $newVersion   (升级级别: $Level)" -ForegroundColor Green
Write-Host ""

# 4. 确认
$confirm = Read-Host "确认发版? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
  Write-Host "已取消" -ForegroundColor Gray
  exit 0
}

# 5. 更新 package.json
$pkg.version = $newVersion
$pkg | ConvertTo-Json -Depth 10 | Set-Content package.json -Encoding utf8
Write-Host "✅ package.json 版本已更新: $newVersion" -ForegroundColor Green

# 6. 提交版本更新
git add package.json
git commit -m "chore: bump version to v$newVersion"

# 7. 创建 tag
$tag = "v$newVersion"
git tag -a $tag -m "Release $tag"
Write-Host "✅ Tag 已创建: $tag" -ForegroundColor Green

# 8. 推送到远程
Write-Host "⬆ 推送代码和 tag..." -ForegroundColor Cyan
git push todolist master
git push todolist $tag

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Green
Write-Host "🎉 发版完成! v$newVersion" -ForegroundColor Green
Write-Host "🔗 GitHub Actions 将自动构建并发布到 Release 页面" -ForegroundColor Cyan
Write-Host "🔗 查看进度: https://github.com/lipengss/todolist/actions" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Green
