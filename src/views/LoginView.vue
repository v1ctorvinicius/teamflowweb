<template>
  <div class="auth-page">

    <div class="auth-side">
      <div class="side-content">
        <div class="side-logo">⚽</div>
        <h2 class="side-title">TeamFlow</h2>
        <p class="side-sub">O catálogo oficial de camisetas do seu time</p>
        <div class="side-tags">
          <span class="side-tag">Jogador</span>
          <span class="side-tag">Torcedor</span>
          <span class="side-tag">Exclusivo</span>
        </div>
      </div>
    </div>


    <div class="auth-main">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Entrar</h1>
          <p class="auth-desc">Acesse o catálogo com sua conta</p>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrap">
              <i class="pi pi-envelope input-icon" />
              <input v-model="email" type="email" class="form-input" placeholder="seu@email.com"
                @keyup.enter="handleLogin" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <div class="input-wrap">
              <i class="pi pi-lock input-icon" />
              <input v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input"
                placeholder="••••••••" @keyup.enter="handleLogin" />
              <button type="button" class="toggle-pass" @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
              </button>
            </div>
          </div>

          <div v-if="errorMsg" class="error-alert">
            <i class="pi pi-exclamation-circle" />
            {{ errorMsg }}
          </div>

          <button class="submit-btn" :class="{ loading }" :disabled="loading" @click="handleLogin">
            <span v-if="!loading">Entrar</span>
            <span v-else class="btn-spinner" />
          </button>

          <div class="auth-footer">
            <span>Não tem conta?</span>
            <router-link to="/register" class="auth-link">Cadastre-se</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = 'Preencha todos os campos'
    return
  }
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.go(0)
  } catch {
    errorMsg.value = 'Email ou senha inválidos'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.auth-page {
  display: flex;
  min-height: 100vh;
  background: #060b14;
  font-family: 'DM Sans', sans-serif;
}

/* Painel esquerdo */
.auth-side {
  display: none;
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #0f2044 0%, #0d1a33 50%, #080f20 100%);
  border-right: 1px solid #1e3a5f;
  position: relative;
  overflow: hidden;
}

.auth-side::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -120px;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%);
  border-radius: 50%;
}

.auth-side::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: -80px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%);
  border-radius: 50%;
}

@media (min-width: 900px) {
  .auth-side {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.side-content {
  padding: 48px;
  position: relative;
  z-index: 1;
}

.side-logo {
  font-size: 52px;
  margin-bottom: 20px;
  filter: drop-shadow(0 0 24px rgba(37, 99, 235, 0.5));
}

.side-title {
  font-family: 'Syne', sans-serif;
  font-size: 42px;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -1px;
  margin-bottom: 12px;
}

.side-sub {
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 32px;
}

.side-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.side-tag {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid #1e3a5f;
  background: rgba(37, 99, 235, 0.1);
  color: #60a5fa;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Painel direito / formulário */
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  margin-bottom: 36px;
}

.auth-title {
  font-family: 'Syne', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.auth-desc {
  font-size: 14px;
  color: #64748b;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.2px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #475569;
  font-size: 14px;
  pointer-events: none;
}

.form-input {
  width: 100%;
  background: #0f1a2e;
  border: 1px solid #1e3a5f;
  border-radius: 12px;
  padding: 13px 14px 13px 42px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: #f1f5f9;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-input::placeholder {
  color: #334155;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.toggle-pass {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: color 0.15s;
}

.toggle-pass:hover {
  color: #94a3b8;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 13px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #64748b;
}

.auth-link {
  color: #60a5fa;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s;
}

.auth-link:hover {
  color: #93c5fd;
}
</style>