import { test, expect } from '@playwright/test'

test('未登录访问根路径会进入登录页', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '欢迎使用文档智能摘要系统' })).toBeVisible()
  await expect(page.getByRole('button', { name: '登录' }).first()).toBeVisible()
})

test('登录页展示用户名与密码表单', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
  await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
  await expect(page.getByRole('button', { name: '登录' }).last()).toBeVisible()
})
