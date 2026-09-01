<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogin = () => {
  router.push({ name: 'login' })
}

const handleRegister = () => {
  router.push({ name: 'register' })
}
</script>

<template>
  <div>
    <h1>登录</h1>
    <el-button type="primary" @click="handleLogin">登录</el-button>
    <el-button type="primary" @click="handleRegister">注册</el-button>
  </div>
</template>

<style scoped>

</style>
