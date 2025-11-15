# Cloudflare Turnstile 集成指南

本文档介绍了如何在项目中配置和使用 Cloudflare Turnstile 进行安全验证。

## 概述

Cloudflare Turnstile 是一个用户友好的隐私保护验证系统，可以替代传统的 CAPTCHA。本项目已将 Turnstile 集成到登录和注册页面中。

## 已完成的功能

### 1. 客户端集成
- ✅ 安装了 `@marsidev/react-turnstile` 客户端库
- ✅ 创建了 `TurnstileWidget` 组件封装
- ✅ 在登录页面集成 Turnstile 验证
- ✅ 在注册页面集成 Turnstile 验证

### 2. 类型定义
- ✅ 更新了 `LoginFormData` 和 `RegisterFormData` 接口，添加了 `turnstileToken` 字段
- ✅ 更新了认证 store 的 `login` 和 `register` 方法，支持 Turnstile token

### 3. 国际化支持
- ✅ 添加了英文、中文、日文的 Turnstile 相关翻译文本

### 4. 环境配置
- ✅ 在开发和生产环境配置文件中添加了 Turnstile site key

## 配置说明

### 1. 环境变量

在 `.development.env` 和 `.production.env` 文件中配置以下变量：

```env
# Cloudflare Turnstile Configuration
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=your_actual_site_key_here
```

**注意**: 当前使用的是测试密钥 `1x00000000000000000000AA`，在生产环境中请替换为实际的 site key。

### 2. 获取 Turnstile Site Key

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择您的域名
3. 进入 "Turnstile" 部分
4. 创建新的 Site Key
5. 将 Site Key 配置到环境变量中

## 使用方法

### 在登录页面

登录页面已自动集成 Turnstile 验证：

1. 用户输入邮箱和密码
2. 完成 Turnstile 安全验证
3. 点击登录按钮（只有在验证通过后才能点击）
4. 系统会将 Turnstile token 连同登录凭据一起发送到后端

### 在注册页面

注册页面同样集成了 Turnstile 验证：

1. 用户输入用户名、邮箱和密码
2. 完成 Turnstile 安全验证
3. 点击注册按钮（只有在验证通过后才能点击）
4. 系统会将 Turnstile token 连同注册信息一起发送到后端

## 组件 API

### TurnstileWidget Props

```typescript
interface TurnstileWidgetProps {
  siteKey: string                    // Turnstile site key
  onVerify: (token: string) => void // 验证成功回调
  onError?: () => void              // 验证失败回调
  onExpire?: () => void            // 验证过期回调
  className?: string                // 自定义 CSS 类名
  resetKey?: number                // 重置组件的键值
}
```

## 后端集成要求

为了完成 Turnstile 集成，后端需要：

1. 接收前端发送的 `turnstileToken` 字段
2. 使用 Cloudflare Secret Key 验证 token
3. 验证 API 调用示例：

```javascript
const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: `secret=${secret_key}&response=${turnstileToken}`,
});

const result = await response.json();
if (result.success) {
  // 验证成功
} else {
  // 验证失败
}
```

## 错误处理

系统已集成以下错误处理：

- **验证失败**: 显示 "Security verification failed" 错误消息
- **验证过期**: 显示 "Verification expired, please try again" 错误消息
- **网络错误**: 自动重置 Turnstile 组件
- **认证失败**: 重置 Turnstile 组件，要求用户重新验证

## 安全考虑

1. **Token 验证**: 后端必须验证每个 Turnstile token
2. **Token 时效性**: Turnstile token 有时效性，过期后需要重新验证
3. **环境变量**: 确保 Secret Key 安全存储在后端，不要暴露给客户端
4. **错误信息**: 避免泄露敏感信息给用户

## 故障排除

### 常见问题

1. **Turnstile 组件不显示**
   - 检查 site key 是否正确配置
   - 确认网络连接正常
   - 检查浏览器控制台是否有错误信息

2. **验证一直失败**
   - 确认后端验证逻辑正确
   - 检查 Secret Key 是否正确
   - 确认请求参数格式正确

3. **用户体验问题**
   - 确保 Turnstile 组件在表单中的位置合理
   - 添加适当的加载状态
   - 提供清晰的错误提示

## 测试

使用测试密钥 `1x00000000000000000000AA` 可以进行功能测试：

- 总是返回成功验证
- 适用于开发和测试环境
- 不能在生产环境中使用

## 更新日志

- **v1.0.0**: 初始集成，支持登录和注册页面的 Turnstile 验证