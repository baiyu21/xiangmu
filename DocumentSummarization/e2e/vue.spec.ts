import { test, expect } from '@playwright/test'

test('未登录访问根路径会进入登录页', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '欢迎使用文档智能摘要系统' })).toBeVisible()
  await expect(page.getByRole('button', { name: '登录' }).first()).toBeVisible()
})

test('mock 登录后可进入个人中心', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('请输入密码').fill('demo-pass')
  await page.getByRole('button', { name: '登录' }).last().click()
  await expect(page.getByRole('heading', { name: '个人中心' })).toBeVisible()
})
