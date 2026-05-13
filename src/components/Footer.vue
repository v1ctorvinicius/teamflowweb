<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span style="font-size: 15px">⚽</span>
        <span class="footer-brand-name">TeamFlow</span>
      </div>
      <p class="footer-tagline">O melhor do futebol, na sua camisa.</p>

      <div class="footer-grid">
        <div>
          <p class="footer-col-title">Loja</p>
          <router-link to="/" class="footer-link">
            <i class="pi pi-shopping-cart" aria-hidden="true"></i> Camisetas
          </router-link>
          <router-link to="/?featured=true" class="footer-link">
            <i class="pi pi-star" aria-hidden="true"></i> Destaques
          </router-link>
          <a href="#" class="footer-link" @click.prevent>
            <i class="pi pi-tag" aria-hidden="true"></i> Promoções
          </a>
        </div>

        <div>
          <p class="footer-col-title">Conta</p>
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
        </div>

        <div>
          <p class="footer-col-title">Atendimento</p>
          <a :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="footer-link">
            <i class="pi pi-whatsapp" aria-hidden="true"></i> WhatsApp
          </a>
          <a href="mailto:contato@teamflow.com" class="footer-link">
            <i class="pi pi-envelope" aria-hidden="true"></i> E-mail
          </a>
          <a href="#" class="footer-link" @click.prevent>
            <i class="pi pi-question-circle" aria-hidden="true"></i> FAQ
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        <span class="footer-copy">© 2025 TeamFlow. Todos os direitos reservados.</span>
        <div class="footer-social">
          <a href="#" class="social-btn" aria-label="Instagram" @click.prevent>
            <i class="pi pi-instagram" aria-hidden="true"></i>
          </a>
          <a href="#" class="social-btn" aria-label="TikTok" @click.prevent>
            <i class="pi pi-tiktok" aria-hidden="true"></i>
          </a>
          <a :href="whatsappLink" target="_blank" class="social-btn" aria-label="WhatsApp">
            <i class="pi pi-whatsapp" aria-hidden="true"></i>
          </a>
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

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5598900000000'
const whatsappLink = computed(() => `https://wa.me/${WHATSAPP_NUMBER}`)

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.footer {
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  padding: 28px 16px 24px;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
}

.footer-brand-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.footer-tagline {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.footer-col-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 10px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 3px 0;
  transition: color 0.15s;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
}

.footer-link:hover {
  color: var(--text-primary);
}

.footer-link i {
  font-size: 13px;
  flex-shrink: 0;
}

.footer-logout-btn {
  background: none;
  font-family: inherit;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--border-sub);
  flex-wrap: wrap;
  gap: 8px;
}

.footer-copy {
  font-size: 11px;
  color: var(--text-muted);
}

.footer-social {
  display: flex;
  gap: 6px;
}

.social-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-muted);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.social-btn:hover {
  border-color: #3d4f68;
  color: var(--text-secondary);
}

/* Desktop */
@media (min-width: 640px) {
  .footer-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>