<template>
  <footer class="footer">
    <div class="footer-inner">
      <!-- Brand & Tagline -->
      <div class="footer-header">
        <div class="footer-brand">
          <span style="font-size: 15px">⚽</span>
          <span class="footer-brand-name">TeamFlow</span>
        </div>
        <p class="footer-tagline">O melhor do futebol, na sua camisa.</p>
      </div>

      <!-- Main Grid -->
      <div class="footer-grid">
        <!-- Loja -->
        <div class="footer-col">
          <p class="footer-col-title">Loja</p>
          <nav class="footer-nav">
            <router-link to="/" class="footer-link">
              <i class="pi pi-shopping-cart" aria-hidden="true"></i> Produtos
            </router-link>
            <!-- <a href="#" class="footer-link" @click.prevent>
              <i class="pi pi-tag" aria-hidden="true"></i> Promoções
            </a> -->
          </nav>
        </div>

        <!-- Conta -->
        <div class="footer-col">
          <p class="footer-col-title">Conta</p>
          <nav class="footer-nav">
            <template v-if="isAuthenticated">
              <router-link to="/account" class="footer-link">
                <i class="pi pi-user" aria-hidden="true"></i> Minha conta
              </router-link>
              <button class="footer-link footer-logout-btn" @click="handleLogout">
                <i class="pi pi-sign-out" aria-hidden="true"></i> Sair
              </button>
            </template>
            <template v-else>
              <router-link to="/login" class="footer-link">
                <i class="pi pi-sign-in" aria-hidden="true"></i> Entrar
              </router-link>
              <router-link to="/register" class="footer-link">
                <i class="pi pi-user-plus" aria-hidden="true"></i> Criar conta
              </router-link>
            </template>
          </nav>
        </div>

        <!-- Atendimento (com ícones sociais) -->
        <div class="footer-col">
          <p class="footer-col-title">Atendimento</p>
          <nav class="footer-nav">
            <a :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i class="pi pi-whatsapp" aria-hidden="true"></i> WhatsApp
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i class="pi pi-instagram" aria-hidden="true"></i> Instagram
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i class="pi pi-tiktok" aria-hidden="true"></i> TikTok
            </a>
            <a href="mailto:contato@teamflow.com" class="footer-link">
              <i class="pi pi-envelope" aria-hidden="true"></i> E-mail
            </a>
            <a href="#" class="footer-link" @click.prevent>
              <i class="pi pi-question-circle" aria-hidden="true"></i> FAQ
            </a>
          </nav>
        </div>

        <!-- Desenvolvedor -->
        <div class="footer-col">
          <p class="footer-col-title">Desenvolvedor</p>
          <nav class="footer-nav">
            <a href="https://v1ctorvinicius.github.io" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i class="pi pi-code" aria-hidden="true"></i> Portfolio
            </a>
            <a href="https://github.com/v1ctorvinicius" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i class="pi pi-github" aria-hidden="true"></i> GitHub
            </a>
            <a href="https://www.linkedin.com/in/victorvssantos" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i class="pi pi-linkedin" aria-hidden="true"></i> LinkedIn
            </a>
            <a :href="devWhatsappLink" target="_blank" rel="noopener noreferrer" class="footer-link">
              <i class="pi pi-whatsapp" aria-hidden="true"></i> WhatsApp (Dev)
            </a>
          </nav>
        </div>

        <!-- Links Legais -->
        <div class="footer-col">
          <p class="footer-col-title">Legal</p>
          <nav class="footer-nav">
            <a href="#" class="footer-link" @click.prevent>
              <i class="pi pi-file-pdf" aria-hidden="true"></i> Termos
            </a>
            <a href="#" class="footer-link" @click.prevent>
              <i class="pi pi-shield" aria-hidden="true"></i> Privacidade
            </a>
            <a href="#" class="footer-link" @click.prevent>
              <i class="pi pi-info-circle" aria-hidden="true"></i> Cookies
            </a>
          </nav>
        </div>
      </div>

      <!-- Divider -->
      <div class="footer-divider"></div>

      <!-- Bottom Section (sem os ícones sociais) -->
      <div class="footer-bottom">
        <div class="footer-bottom-left">
          <span class="footer-copy">© 2025 TeamFlow. Todos os direitos reservados.</span>
          <span class="footer-credit">Desenvolvido por <strong>Victor Santos</strong></span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated, user } = storeToRefs(authStore)

const WHATSAPP_NUMBER = '5598986281919';
const whatsappLink = computed(() => `https://wa.me/${WHATSAPP_NUMBER}`)

const DEV_WHATSAPP = '5598986281919';
const devWhatsappLink = computed(() => `https://wa.me/${DEV_WHATSAPP}`)

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
:root {
  --bg-surface: #080b0f;
  --bg-secondary: #0f1419;
  --border: #30363d;
  --border-sub: #21262d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --blue: #58a6ff;
  --blue-bg: rgba(88, 166, 255, 0.1);
}

.footer {
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  padding: 40px 16px 32px;
  margin-top: 60px;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
}

/* Header */
.footer-header {
  margin-bottom: 32px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
}

.footer-brand-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.footer-tagline {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

/* Main Grid */
.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  margin-bottom: 28px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-col-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0;
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 4px 0;
  transition: all 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.footer-link:hover {
  color: var(--blue);
  transform: translateX(4px);
}

.footer-link i {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.8;
}

.footer-link:hover i {
  opacity: 1;
}

.footer-logout-btn {
  font-family: inherit;
  width: 100%;
}

/* Divider */
.footer-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
  margin: 28px 0;
}

/* Bottom Section */
.footer-bottom {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.footer-bottom-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.footer-copy {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
}

.footer-credit {
  font-size: 11px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.footer-credit strong {
  color: var(--blue);
  font-weight: 600;
}

.footer-credit:hover {
  color: var(--blue);
}

/* Responsive */
@media (min-width: 640px) {
  .footer {
    padding: 48px 16px 40px;
  }

  .footer-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }

  .footer-bottom {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .footer-bottom-left {
    flex-direction: row;
    gap: 20px;
    align-items: center;
  }
}

@media (min-width: 1024px) {
  .footer-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .footer-link:hover {
    transform: translateX(6px);
  }
}
</style>