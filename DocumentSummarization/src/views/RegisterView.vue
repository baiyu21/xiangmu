<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleRegister = () => {
  router.push({ name: 'register' })
}
</script>

<template>
  <div>
    <h1>注册</h1>
    <el-button type="primary" @click="handleRegister">注册</el-button>
  </div>
</template>

<style scoped>

</style>
