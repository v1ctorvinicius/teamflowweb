<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="brand">
        <span class="brand-icon">⚽</span>
        <span class="brand-name">TeamFlow</span>
      </router-link>

      <span v-if="isAuthenticated && user?.favoriteTeam" class="team-pill">
        <i class="pi pi-heart" aria-hidden="true" style="font-size: 11px"></i>
        {{ user.favoriteTeam }}
      </span>
      <span v-else class="team-pill guest-pill">
        <i class="pi pi-heart" aria-hidden="true"></i>
        Seu time
      </span>

      <!-- Desktop links -->
      <nav class="nav-links" aria-label="Navegação principal">
        <template v-if="isAuthenticated">
          <router-link v-if="isAdmin" to="/admin" class="admin-lnk">
            <i class="pi pi-cog" style="font-size: 13px"></i> Admin
          </router-link>
          <router-link to="/account" class="account-lnk">
            <i class="pi pi-user" style="font-size: 13px"></i> {{ user?.name?.split(' ')[0] || 'Conta' }}
          </router-link>
          <button class="logout-lnk" @click="handleLogout">
            Sair
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="login-lnk">
            <i class="pi pi-sign-in" style="font-size: 13px"></i> Entrar
          </router-link>
          <router-link to="/register" class="register-lnk">
            Criar conta
          </router-link>
        </template>
      </nav>

      <!-- Hamburguer -->
      <button 
        class="hamburger" 
        :class="{ open: drawerOpen }"
        @click="toggleDrawer"
        :aria-expanded="drawerOpen"
        aria-label="Abrir menu"
      >
        <span></span><span></span><span></span>
      </button>
    </div>

    <!-- Overlay -->
    <div 
      class="drawer-overlay" 
      :class="{ open: drawerOpen }"
      @click="drawerOpen = false"
    ></div>

    <!-- Drawer -->
    <nav class="drawer" :class="{ open: drawerOpen }" aria-label="Menu mobile">
      <div class="drawer-user">
        <div class="drawer-avatar">
          {{ userInitials }}
        </div>
        <div>
          <p class="drawer-username">{{ user?.name || 'Visitante' }}</p>
          <p class="drawer-email">{{ user?.email || 'Faça login para continuar' }}</p>
        </div>
      </div>

      <div class="drawer-section">
        <router-link to="/" class="drawer-item" @click="drawerOpen = false">
          <i class="pi pi-home" aria-hidden="true"></i> Início
        </router-link>
        <router-link to="/account" class="drawer-item drawer-item--primary" @click="drawerOpen = false">
          <i class="pi pi-user" aria-hidden="true"></i> Minha conta
        </router-link>
      </div>

      <div v-if="isAuthenticated" class="drawer-section">
        <router-link v-if="isAdmin" to="/admin" class="drawer-item drawer-item--admin" @click="drawerOpen = false">
          <i class="pi pi-cog" aria-hidden="true"></i> Painel admin
        </router-link>
        <button class="drawer-item drawer-item--danger" @click="handleDrawerLogout">
          <i class="pi pi-sign-out" aria-hidden="true"></i> Sair da conta
        </button>
      </div>

      <div v-else class="drawer-section">
        <router-link to="/login" class="drawer-item drawer-item--primary" @click="drawerOpen = false">
          <i class="pi pi-sign-in" aria-hidden="true"></i> Entrar
        </router-link>
        <router-link to="/register" class="drawer-item" @click="drawerOpen = false">
          <i class="pi pi-user-plus" aria-hidden="true"></i> Criar conta
        </router-link>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)

const drawerOpen = ref(false)

const isAdmin = computed(() => (user.value as any)?.role === 'ADMIN')
const userInitials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function handleDrawerLogout() {
  drawerOpen.value = false
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ── Navbar ──────────────────────────────────────────────── */
.navbar {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  height: 52px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 17px;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

/* Pill do time — centro da navbar */
.team-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--red-bg);
  border: 1px solid var(--red-border);
  color: #ffa19c;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-pill i {
  font-size: 11px;
  flex-shrink: 0;
}

.guest-pill {
  background: var(--bg-elevated);
  border-color: var(--border);
  color: var(--text-muted);
}

/* Hamburguer */
.hamburger {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.hamburger:hover {
  border-color: #3d4f68;
}

.hamburger span {
  display: block;
  width: 16px;
  height: 1.5px;
  background: var(--text-secondary);
  border-radius: 2px;
  transition: transform 0.25s, opacity 0.25s;
}

.hamburger.open span:nth-child(1) {
  transform: translateY(6.5px) rotate(45deg);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: translateY(-6.5px) rotate(-45deg);
}

/* Desktop nav links (hidden on mobile) */
.nav-links {
  display: none;
  align-items: center;
  gap: 6px;
}

.nav-links a,
.nav-links button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}

.nav-links a:hover,
.nav-links button:hover {
  color: var(--text-primary);
  border-color: var(--border);
}

.nav-links .admin-lnk {
  border-color: var(--purple-border);
  color: var(--purple);
}

.nav-links .logout-lnk {
  color: var(--text-muted);
}

.nav-links .logout-lnk:hover {
  color: var(--red);
  border-color: var(--red-border);
}

.nav-links .login-lnk {
  border-color: var(--border);
}

.nav-links .register-lnk {
  background: var(--blue);
  color: #fff;
  border-color: transparent;
}

.nav-links .register-lnk:hover {
  background: #1c7cef;
}

/* Drawer */
.drawer-overlay {
  position: fixed;
  top: 52px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.drawer-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.drawer {
  position: fixed;
  top: 52px;
  right: 0;
  width: 260px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  border-radius: 0 0 0 14px;
  z-index: 95;
  padding: 8px;
  transform: translateX(100%);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer.open {
  transform: translateX(0);
}

.drawer-section {
  padding: 6px 0;
  border-bottom: 1px solid var(--border-sub);
}

.drawer-section:last-child {
  border-bottom: none;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.drawer-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.drawer-item i {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.drawer-item--admin {
  color: var(--purple);
}

.drawer-item--admin:hover {
  background: var(--purple-bg);
}

.drawer-item--danger {
  color: var(--red);
}

.drawer-item--danger:hover {
  background: var(--red-bg);
}

.drawer-item--primary {
  color: var(--blue);
}

.drawer-item--primary:hover {
  background: var(--blue-bg);
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 14px;
  border-bottom: 1px solid var(--border-sub);
  margin-bottom: 6px;
}

.drawer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--blue-bg);
  border: 1px solid var(--blue-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--blue);
}

.drawer-username {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.drawer-email {
  font-size: 10px;
  color: var(--text-muted);
}

/* Desktop */
@media (min-width: 640px) {
  .hamburger {
    display: none;
  }
  .nav-links {
    display: flex;
  }
  .team-pill {
    max-width: none;
  }
}
</style>