<!-- src/views/RegisterView.vue -->
<template>
  <div class="auth-page">
    <!-- Painel esquerdo decorativo -->
    <div class="auth-side">
      <div class="side-content">
        <div class="side-logo">⚽</div>
        <h2 class="side-title">TeamFlow</h2>
        <p class="side-sub">Crie sua conta e acompanhe o catálogo completo de camisetas</p>
        <div class="side-tags">
          <span class="side-tag">Jogador</span>
          <span class="side-tag">Torcedor</span>
          <span class="side-tag">Exclusivo</span>
        </div>
      </div>
    </div>

    <!-- Formulário -->
    <div class="auth-main">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Criar Conta</h1>
          <p class="auth-desc">Preencha os dados abaixo para começar</p>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <div class="input-wrap">
              <i class="pi pi-user input-icon" />
              <input
                v-model="name"
                type="text"
                class="form-input"
                :class="{ 'input-error': errors.name }"
                placeholder="Seu nome"
              />
            </div>
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrap">
              <i class="pi pi-envelope input-icon" />
              <input
                v-model="email"
                type="email"
                class="form-input"
                :class="{ 'input-error': errors.email }"
                placeholder="seu@email.com"
              />
            </div>
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <div class="input-wrap">
              <i class="pi pi-lock input-icon" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ 'input-error': errors.password }"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                class="toggle-pass"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              >
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
              </button>
            </div>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>

          <!-- Time do coração: select em vez de input livre -->
          <div class="form-group">
            <label class="form-label">
              Time do Coração
              <span class="label-optional">(opcional)</span>
            </label>
            <div class="input-wrap select-wrap">
              <i class="pi pi-heart input-icon input-icon-heart" />

              <!-- Estado de carregamento -->
              <select
                v-if="clubsLoading"
                class="form-input form-select"
                disabled
              >
                <option>Carregando times…</option>
              </select>

              <!-- Erro ao carregar times (fallback gracioso) -->
              <input
                v-else-if="clubsError"
                v-model="favoriteTeam"
                type="text"
                class="form-input"
                placeholder="Ex: Flamengo, São Paulo…"
              />

              <!-- Select normal -->
              <select
                v-else
                v-model="favoriteTeam"
                class="form-input form-select"
              >
                <option value="">— Selecione seu time —</option>
                <option
                  v-for="club in clubs"
                  :key="club.id"
                  :value="club.name"
                >
                  {{ club.name }}
                </option>
              </select>

              <i class="pi pi-chevron-down select-chevron" v-if="!clubsLoading && !clubsError" />
            </div>
            <span v-if="clubsError" class="field-hint field-hint-warn">
              Não foi possível carregar os times. Digite manualmente.
            </span>
            <span v-else class="field-hint">
              Produtos do seu time serão destacados no catálogo
            </span>
          </div>

          <div v-if="serverError" class="error-alert">
            <i class="pi pi-exclamation-circle" />
            {{ serverError }}
          </div>

          <button
            class="submit-btn"
            :disabled="loading"
            @click="handleRegister"
          >
            <span v-if="!loading">Criar Conta</span>
            <span v-else class="btn-spinner" />
          </button>

          <div class="auth-footer">
            <span>Já tem conta?</span>
            <router-link to="/login" class="auth-link">Faça login</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { clubsService, type Club } from '@/services/clubs'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const favoriteTeam = ref('')
const loading = ref(false)
const showPassword = ref(false)
const errors = ref<Record<string, string>>({})
const serverError = ref('')

// Estado dos times
const clubs = ref<Club[]>([])
const clubsLoading = ref(true)
const clubsError = ref(false)

onMounted(async () => {
  try {
    clubs.value = await clubsService.list()
  } catch {
    clubsError.value = true
  } finally {
    clubsLoading.value = false
  }
})

const validate = () => {
  const e: Record<string, string> = {}
  if (!name.value.trim()) e.name = 'Nome é obrigatório'
  if (!email.value.trim()) {
    e.email = 'Email é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    e.email = 'Email inválido'
  }
  if (!password.value) {
    e.password = 'Senha é obrigatória'
  } else if (password.value.length < 8) {
    e.password = 'Senha deve ter no mínimo 8 caracteres'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

const handleRegister = async () => {
  serverError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
      favoriteTeam: favoriteTeam.value || undefined,
    })
    router.go(0);
  } catch (error: any) {
    serverError.value = error.response?.data?.message || 'Erro ao cadastrar. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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
  .auth-side { display: flex; align-items: center; justify-content: center; }
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
  max-width: 440px;
}

.auth-header {
  margin-bottom: 32px;
}

.auth-title {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
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
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-optional {
  font-weight: 400;
  color: #475569;
  font-size: 12px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* Select específico */
.select-wrap {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 11px 16px 11px 40px;
  background: #0d1a33;
  border: 1px solid #1e3a5f;
  border-radius: 10px;
  color: #f1f5f9;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input::placeholder {
  color: #334155;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.input-error {
  border-color: #f43f5e !important;
}

/* Estilos específicos do select */
.form-select {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  padding-right: 36px; /* espaço para o chevron */
}

.form-select option {
  background: #0d1a33;
  color: #f1f5f9;
}

.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-chevron {
  position: absolute;
  right: 12px;
  font-size: 11px;
  color: #475569;
  pointer-events: none;
}

.input-icon {
  position: absolute;
  left: 13px;
  font-size: 14px;
  color: #475569;
  pointer-events: none;
  z-index: 1;
}

.input-icon-heart {
  color: #f43f5e;
  opacity: 0.7;
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
}

.toggle-pass:hover {
  color: #94a3b8;
}

.field-error {
  font-size: 12px;
  color: #f43f5e;
}

.field-hint {
  font-size: 12px;
  color: #475569;
}

.field-hint-warn {
  color: #f59e0b;
}

.error-alert {
  padding: 12px 16px;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.25);
  border-radius: 10px;
  color: #f43f5e;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  background: #2563eb;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  to { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
  font-size: 13px;
  color: #475569;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.auth-link {
  color: #60a5fa;
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>