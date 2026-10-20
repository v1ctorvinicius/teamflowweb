<template>
  <div class="notifications-page">
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="back-link">
          <i class="pi pi-arrow-left" /> Voltar
        </router-link>
        <h1 class="brand">Notificações</h1>
        <div class="spacer" />
      </div>
    </header>

    <main class="main">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Notificações</h1>
          <p class="page-sub">
            {{ unreadCount }} não {{ unreadCount === 1 ? 'lida' : 'lidas' }}
          </p>
        </div>
        <div class="header-actions">
          <button v-if="unreadCount > 0" class="btn-secondary" @click="markAllRead" :disabled="loading">
            <i class="pi pi-check-circle" />
            Marcar todas como lidas
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <ProgressSpinner strokeWidth="3" />
        <p>Carregando notificações...</p>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <span class="empty-icon">🔔</span>
        <p class="empty-title">Nenhuma notificação</p>
        <p class="empty-sub">Quando houver novidades, elas aparecerão aqui.</p>
        <router-link to="/" class="btn-primary">Voltar para a loja</router-link>
      </div>

      <div v-else class="notifications-list">
        <div v-for="notif in notifications" :key="notif.id" class="notification-item" :class="{ 'unread': !notif.read }"
          @click="markAsRead(notif.id)">
          <div class="notif-icon" :class="`notif-icon--${notif.type}`">
            <i :class="iconForType(notif.type)" />
          </div>
          <div class="notif-content">
            <p class="notif-title">{{ notif.title }}</p>
            <p class="notif-text" v-html="formatMessageWithLinks(notif.body)"></p>
            <span class="notif-date">{{ formatDate(notif.created_at) }}</span>
          </div>
          <span v-if="!notif.read" class="unread-dot" />
        </div>
      </div>
    </main>

    <a :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="whatsapp-fab" title="Falar com o suporte">
      <i class="pi pi-whatsapp" />
      <span>Falar com admin</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { notificationsService, type Notification } from '@/services/notifications'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(true)

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5598996281919'
const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`

const iconForType = (type: string) => {
  switch (type) {
    case 'new_product': return 'pi pi-tag'
    case 'admin_message': return 'pi pi-user'
    case 'order': return 'pi pi-shopping-cart'
    default: return 'pi pi-info-circle'
  }
}

const formatDate = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} minuto${minutes !== 1 ? 's' : ''} atrás`
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours} hora${hours !== 1 ? 's' : ''} atrás`
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function loadNotifications() {
  loading.value = true
  try {
    const result = await notificationsService.getNotifications()
    notifications.value = result.data
    unreadCount.value = result.unreadCount
  } catch (error) {
    console.error('Failed to load notifications:', error)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível carregar as notificações.',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

async function markAsRead(id: string) {
  const notif = notifications.value.find(n => n.id === id)
  if (notif?.read) return

  try {
    await notificationsService.markAsRead(id)
    notif!.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (error) {
    console.error('Failed to mark as read:', error)
  }
}

async function markAllRead() {
  try {
    await notificationsService.markAllAsRead()
    notifications.value.forEach(n => n.read = true)
    unreadCount.value = 0
    toast.add({
      severity: 'success',
      summary: 'Atualizado',
      detail: 'Todas as notificações foram marcadas como lidas.',
      life: 2000,
    })
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível marcar todas como lidas.',
      life: 3000,
    })
  }
}

function formatMessageWithLinks(text: string): string {
  if (!text) return ''

  const urlRegex = /(https?:\/\/[^\s]+)/g

  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="notif-link">${url}</a>`
  })
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadNotifications()
})
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: #0d1117;
  color: #f0f6fc;
}

.navbar {
  background: #161b22;
  border-bottom: 1px solid #2d3748;
  height: 52px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8b949e;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.back-link:hover {
  color: #f0f6fc;
}

.brand {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.spacer {
  width: 72px;
}

.main {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.page-sub {
  font-size: 12px;
  color: #8b949e;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid #2d3748;
  color: #8b949e;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  border-color: #388bfd;
  color: #388bfd;
  background: #0d2240;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: #8b949e;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 0;
  gap: 12px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #f0f6fc;
  margin: 0;
}

.empty-sub {
  font-size: 13px;
  color: #8b949e;
  margin: 0;
}

.btn-primary {
  display: inline-block;
  padding: 10px 20px;
  background: #388bfd;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
}

.btn-primary:hover {
  background: #1c7cef;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: #161b22;
  border: 1px solid #2d3748;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  position: relative;
}

.notification-item:hover {
  background: #1c2330;
  border-color: #3d4f68;
}

.notification-item.unread {
  background: #0d2240;
  border-color: #1f4280;
}

.notif-icon {
  width: 40px;
  height: 40px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.notif-icon--info {
  background: #1c2330;
  color: #8b949e;
}

.notif-icon--new_product {
  background: #0a2522;
  color: #3fb950;
}

.notif-icon--admin_message {
  background: #1f1635;
  color: #a371f7;
}

.notif-icon--order {
  background: #0d2240;
  color: #388bfd;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-size: 14px;
  font-weight: 600;
  color: #f0f6fc;
  margin: 0 0 4px;
}

.notif-text {
  font-size: 13px;
  color: #8b949e;
  margin: 0 0 6px;
  line-height: 1.4;
}

.notif-date {
  font-size: 11px;
  color: #484f58;
}

.unread-dot {
  width: 10px;
  height: 10px;
  background: #388bfd;
  border-radius: 10px;
  flex-shrink: 0;
  margin-top: 6px;
}

/* WhatsApp FAB */
.whatsapp-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #16a34a;
  color: #fff;
  border-radius: 40px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: background 0.15s, transform 0.15s;
}

.whatsapp-fab:hover {
  background: #15803d;
  transform: scale(1.02);
}

.whatsapp-fab i {
  font-size: 20px;
}

@media (max-width: 640px) {
  .whatsapp-fab span {
    display: none;
  }

  .whatsapp-fab {
    padding: 12px;
    border-radius: 50%;
  }
}

.notif-text :deep(.notif-link) {
  color: #60a5fa;
  text-decoration: none;
  word-break: break-all;
}

.notif-text :deep(.notif-link:hover) {
  text-decoration: underline;
  color: #93c5fd;
}
</style>