<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="status-code">404</div>
      <h1 class="title">Página não encontrada</h1>
      <p class="description">
        A página que você está procurando não existe ou foi removida.
      </p>
      <div class="actions">
        <router-link to="/" class="home-link">
          ← Voltar para a loja
        </router-link>
        <button @click="goBack" class="back-btn">
          Voltar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.status-code {
  font-size: 120px;
  font-weight: 800;
  color: #3b82f6;
  text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
  letter-spacing: -4px;
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.description {
  font-size: 16px;
  color: #94a3b8;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.home-link {
  display: inline-block;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  transition: background 0.2s;
}

.home-link:hover {
  background: #2563eb;
}

.back-btn {
  padding: 12px 24px;
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: #3b82f6;
  color: #60a5fa;
}
</style>