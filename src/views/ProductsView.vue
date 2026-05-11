<!-- src/views/ProductsView.vue -->
<template>
  <div class="page">
    <header class="navbar">
      <div class="navbar-inner">
        <div class="brand"><span class="brand-icon">⚽</span><span class="brand-name">TeamFlow</span></div>
        <div class="nav-right">
          <template v-if="isAuthenticated">
            <span v-if="user?.favoriteTeam" class="favorite-pill">❤️ {{ user.favoriteTeam }}</span>
            <span class="user-name">{{ user?.name }}</span>
            <router-link v-if="isAdmin" to="/admin" class="admin-btn"><i class="pi pi-cog" /> Admin</router-link>
            <button class="logout-btn" @click="handleLogout">Sair</button>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-auth-btn nav-auth-btn--outline">Entrar</router-link>
            <router-link to="/register" class="nav-auth-btn nav-auth-btn--solid">Criar conta</router-link>
          </template>
        </div>
      </div>
    </header>

    <div v-if="!isAuthenticated" class="guest-banner">
      <span class="guest-banner-text">🎽 Crie uma conta grátis para ver estoque por tamanho, filtrar pelo seu time e muito mais</span>
      <router-link to="/register" class="guest-banner-cta">Criar conta</router-link>
    </div>

    <main class="main">
      <!-- SEÇÃO DESTAQUES -->
      <section v-if="featured.length" class="featured-section">
        <div class="section-header">
          <h2 class="section-title">⭐ Destaques</h2>
          <span class="section-sub">Seleção especial da loja</span>
        </div>
        <div class="featured-grid">
          <ProductCard
            v-for="product in featured"
            :key="product.id"
            :product="product"
            :user-favorite-team="user?.favoriteTeam"
            :is-authenticated="isAuthenticated"
            @view-details="handleViewDetails"
          />
        </div>
        <div class="section-divider" />
      </section>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">Camisetas</h1>
          <span v-if="!loading" class="product-count">{{ pagination.total }} produto{{ pagination.total !== 1 ? 's' : '' }}</span>
        </div>
        <div class="filters">
          <div class="search-wrap">
            <i class="pi pi-search search-icon" />
            <input v-model="clubFilter" type="text" placeholder="Buscar por clube..." class="search-input" @input="onClubInput" />
            <button v-if="clubFilter" class="clear-btn" @click="clubFilter = ''; fetchProducts(1, true)"><i class="pi pi-times" /></button>
          </div>
          <div class="type-filters">
            <button v-for="opt in typeOptions" :key="opt.value ?? 'all'" class="type-chip" :class="{ active: typeFilter === opt.value }" @click="typeFilter = opt.value; fetchProducts(1, true)">{{ opt.label }}</button>
          </div>
          <div class="my-team-wrap" :title="!isAuthenticated ? 'Crie uma conta para usar este filtro' : ''">
            <button class="type-chip my-team-btn" :class="{ active: myTeamFilter, 'chip-disabled': !isAuthenticated }" :disabled="!isAuthenticated" @click="toggleMyTeamFilter">
              ⭐ Meu time
              <span v-if="isAuthenticated && myTeamCount > 0 && !myTeamFilter" class="team-count-badge">{{ myTeamCount }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <ProgressSpinner strokeWidth="3" />
        <p>Carregando camisetas...</p>
      </div>

      <div v-else-if="products.length" class="products-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          :user-favorite-team="user?.favoriteTeam"
          :is-authenticated="isAuthenticated"
          @view-details="handleViewDetails"
        />
      </div>

      <div v-else class="empty-state">
        <span class="empty-icon">👕</span>
        <p class="empty-title">Nenhuma camiseta encontrada</p>
        <p class="empty-sub">Tente ajustar os filtros</p>
        <button class="reset-btn" @click="resetFilters">Limpar filtros</button>
      </div>

      <div v-if="!loading && pagination.totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="pagination.page <= 1" @click="fetchProducts(pagination.page - 1, true)"><i class="pi pi-chevron-left" /> Anterior</button>
        <span class="page-info">Página {{ pagination.page }} de {{ pagination.totalPages }}</span>
        <button class="page-btn" :disabled="pagination.page >= pagination.totalPages" @click="fetchProducts(pagination.page + 1, true)">Próxima <i class="pi pi-chevron-right" /></button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { productsService } from '@/services/products'
import ProgressSpinner from 'primevue/progressspinner'
import ProductCard from '@/components/ProductCard.vue'
import type { Product } from '@/types'

const router    = useRouter()
const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)
const isAdmin = computed(() => (user.value as any)?.role === 'ADMIN')

const products   = ref<Product[]>([])
const featured   = ref<Product[]>([])
const loading    = ref(true)
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const clubFilter   = ref('')
const typeFilter   = ref<'PLAYER' | 'FAN' | undefined>(undefined)
const myTeamFilter = ref(false)
const myTeamCount  = ref(0)

const typeOptions = [
  { label: 'Todos',    value: undefined },
  { label: 'Torcedor', value: 'FAN'    as const },
  { label: 'Jogador',  value: 'PLAYER' as const },
]

let debounceTimer: ReturnType<typeof setTimeout>

function onClubInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (myTeamFilter.value) myTeamFilter.value = false
    fetchProducts(1, true)
  }, 400)
}

function toggleMyTeamFilter() {
  if (!isAuthenticated.value) return
  myTeamFilter.value = !myTeamFilter.value
  if (myTeamFilter.value) clubFilter.value = ''
  fetchProducts(1, true)
}

async function fetchProducts(page = 1, reset = false) {
  if (reset) loading.value = true
  try {
    const filters: Record<string, any> = { page, limit: 20 }
    if (typeFilter.value) filters.type = typeFilter.value
    if (myTeamFilter.value && user.value?.favoriteTeam) {
      filters.club = user.value.favoriteTeam
    } else if (clubFilter.value.trim()) {
      filters.club = clubFilter.value.trim()
    }
    const response = await productsService.list(filters)
    console.log('🔍 Produtos carregados:', response.data[0])
    products.value   = response.data
    pagination.value = response.pagination
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

async function fetchMyTeamCount() {
  if (!isAuthenticated.value || !user.value?.favoriteTeam) return
  try {
    const r = await productsService.list({ club: user.value.favoriteTeam, limit: 1, page: 1 })
    myTeamCount.value = r.pagination.total
  } catch { /* silencioso */ }
}

function resetFilters() {
  clubFilter.value = ''; typeFilter.value = undefined; myTeamFilter.value = false
  fetchProducts(1, true)
}

function handleViewDetails(id: string) { router.push(`/products/${id}`) }
async function handleLogout() { await authStore.logout(); router.push('/login') }

watch(user, (n, o) => {
  if (n?.favoriteTeam !== o?.favoriteTeam) { products.value = [...products.value]; fetchMyTeamCount() }
})

onMounted(async () => {
  await Promise.all([
    fetchProducts(1, true),
    productsService.getFeatured().then((f) => { featured.value = f }).catch(() => {}),
    fetchMyTeamCount(),
  ])
})

function normalizeProduct(rawProduct: any): Product {
  let sizes = rawProduct.sizes
  let stock = rawProduct.stockBySize
 
  // Converte string de tamanhos para array se necessário
  if (typeof sizes === 'string') {
    sizes = sizes
      .replace(/[{}]/g, '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
  }
 
  // Converte stockBySize se vier como string
  if (typeof stock === 'string') {
    try {
      stock = JSON.parse(stock)
    } catch {
      stock = {}
    }
  }
 
  return {
    ...rawProduct,
    sizes: sizes || [],
    stockBySize: stock || {},
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #0f172a; color: #f1f5f9; }
.navbar { background: #1e293b; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 50; }
.navbar-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 8px; }
.brand-icon { font-size: 22px; }
.brand-name { font-size: 18px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.3px; }
.nav-right { display: flex; align-items: center; gap: 12px; }
.favorite-pill { background: #450a1e; border: 1px solid #f43f5e; color: #fda4af; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.user-name { font-size: 14px; color: #94a3b8; }
.logout-btn { background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 6px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; }
.logout-btn:hover { border-color: #ef4444; color: #ef4444; }
.admin-btn { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 8px; border: 1px solid #7c3aed; color: #a78bfa; font-size: 13px; font-weight: 600; text-decoration: none; }
.nav-auth-btn { font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 8px; text-decoration: none; }
.nav-auth-btn--outline { border: 1px solid #334155; color: #94a3b8; }
.nav-auth-btn--solid { background: #2563eb; color: #fff; border: 1px solid transparent; }
.guest-banner { background: linear-gradient(90deg, #0f2044, #1a1040); border-bottom: 1px solid #1e3a5f; padding: 10px 24px; display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
.guest-banner-text { font-size: 13px; color: #94a3b8; }
.guest-banner-cta { padding: 5px 16px; background: #2563eb; color: #fff; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; }
.main { max-width: 1280px; margin: 0 auto; padding: 28px 24px 48px; }
.featured-section { margin-bottom: 8px; }
.section-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; }
.section-title { font-size: 20px; font-weight: 800; color: #f1f5f9; margin: 0; }
.section-sub { font-size: 13px; color: #64748b; }
.featured-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.section-divider { border: none; border-top: 1px solid #1e293b; margin: 32px 0 28px; }
.toolbar { display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; }
.toolbar-left { display: flex; align-items: baseline; gap: 12px; }
.page-title { font-size: 26px; font-weight: 800; color: #f1f5f9; margin: 0; }
.product-count { font-size: 14px; color: #64748b; }
.filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.search-wrap { position: relative; display: flex; align-items: center; flex: 1; min-width: 220px; max-width: 360px; }
.search-icon { position: absolute; left: 12px; color: #64748b; font-size: 14px; pointer-events: none; }
.search-input { width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 10px 36px; font-size: 14px; color: #f1f5f9; outline: none; }
.search-input::placeholder { color: #475569; }
.search-input:focus { border-color: #3b82f6; }
.clear-btn { position: absolute; right: 10px; background: none; border: none; color: #64748b; cursor: pointer; padding: 2px; display: flex; align-items: center; }
.type-filters { display: flex; gap: 8px; }
.type-chip { padding: 8px 18px; border-radius: 20px; border: 1px solid #334155; background: #1e293b; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.type-chip:hover:not(.chip-disabled) { border-color: #475569; color: #f1f5f9; }
.type-chip.active { background: #1d4ed8; border-color: #2563eb; color: #fff; }
.my-team-btn.active { background: #7c3aed; border-color: #8b5cf6; }
.chip-disabled { opacity: 0.4; cursor: not-allowed; }
.team-count-badge { display: inline-flex; align-items: center; justify-content: center; background: #f43f5e; color: #fff; font-size: 10px; font-weight: 800; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 20px; }
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; color: #64748b; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 8px; }
.empty-icon { font-size: 48px; margin-bottom: 8px; }
.empty-title { font-size: 18px; font-weight: 600; color: #94a3b8; margin: 0; }
.empty-sub { font-size: 14px; color: #475569; margin: 0; }
.reset-btn { margin-top: 16px; padding: 9px 20px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; border-radius: 8px; font-size: 13px; cursor: pointer; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 40px; }
.page-btn { display: flex; align-items: center; gap: 6px; padding: 9px 18px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.page-btn:hover:not(:disabled) { border-color: #3b82f6; color: #60a5fa; }
.page-btn:disabled { opacity: 0.35; cursor: default; }
.page-info { font-size: 14px; color: #64748b; }
@media (max-width: 640px) {
  .main { padding: 20px 16px 40px; }
  .featured-grid, .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .filters { flex-direction: column; align-items: stretch; }
  .search-wrap { max-width: 100%; }
  .nav-right .user-name, .favorite-pill { display: none; }
}
</style>