<!-- src/views/ProductsView.vue -->
<template>
  <div class="page">
    <!-- <header class="navbar">
      <div class="navbar-inner">
        <div class="brand"><span class="brand-icon">⚽</span><span class="brand-name">TeamFlow</span></div>
        <div class="nav-right">
          <template v-if="isAuthenticated">
            <span v-if="user?.favoriteTeam" class="favorite-pill">❤️ {{ user.favoriteTeam }}</span>
            <router-link class="account-btn" to="/account">
              <span class="user-name"><i class="pi pi-user"/> {{ user?.name }}</span>
            </router-link>
            <router-link v-if="isAdmin" to="/admin" class="admin-btn"><i class="pi pi-cog" /> Admin</router-link>
            <button class="logout-btn" @click="handleLogout">Sair</button>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-auth-btn nav-auth-btn--outline">Entrar</router-link>
            <router-link to="/register" class="nav-auth-btn nav-auth-btn--solid">Criar conta</router-link>
          </template>
        </div>
      </div>
    </header> -->

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


<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg-page:#0d1117;
  --bg-surface:#161b22;
  --bg-elevated:#1c2330;
  --bg-hover:#222a38;
  --border:#2d3748;
  --border-subtle:#1e2d3d;
  --text-primary:#f0f6fc;
  --text-secondary:#8b949e;
  --text-muted:#484f58;
  --blue:#388bfd;
  --blue-bg:#0d2240;
  --blue-border:#1f4280;
  --purple:#a371f7;
  --purple-bg:#1f1635;
  --purple-border:#3d2b75;
  --red:#f85149;
  --red-bg:#2a0f0e;
  --green:#3fb950;
  --amber:#d29922;
  --radius-sm:6px;
  --radius-md:10px;
  --radius-lg:14px;
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
}
body{background:var(--bg-page);color:var(--text-primary);font-family:var(--font);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}

/* ── Navbar ─────────────────────────────────────────────── */
.navbar{
  background:var(--bg-surface);
  border-bottom:1px solid var(--border);
  position:sticky;top:0;z-index:50;
  height:52px;
}
.navbar-inner{
  max-width:1280px;margin:0 auto;
  padding:0 20px;height:100%;
  display:flex;align-items:center;justify-content:space-between;
  gap:12px;
}
.brand{display:flex;align-items:center;gap:8px;flex-shrink:0}
.brand-icon{font-size:18px}
.brand-name{font-size:15px;font-weight:700;color:var(--text-primary);letter-spacing:-.4px}
.nav-right{display:flex;align-items:center;gap:8px;min-width:0}

.favorite-pill{
  display:flex;align-items:center;gap:5px;
  background:var(--red-bg);border:1px solid #5a1a18;
  color:#ffa19c;font-size:11px;font-weight:600;
  padding:3px 10px;border-radius:20px;white-space:nowrap;flex-shrink:0;
}
.account-btn{
  display:flex;align-items:center;gap:6px;
  padding:5px 10px;border-radius:var(--radius-sm);
  border:1px solid var(--border);color:var(--text-secondary);
  font-size:12px;font-weight:500;text-decoration:none;
  white-space:nowrap;flex-shrink:0;
}
.account-btn:hover{border-color:var(--blue-border);color:var(--blue)}
.admin-btn{
  display:flex;align-items:center;gap:5px;
  padding:5px 10px;border-radius:var(--radius-sm);
  border:1px solid var(--purple-border);
  background:var(--purple-bg);color:var(--purple);
  font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;
}
.logout-btn{
  background:transparent;border:1px solid var(--border);
  color:var(--text-muted);padding:5px 10px;
  border-radius:var(--radius-sm);font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;
}
.logout-btn:hover{border-color:var(--red);color:var(--red)}
.nav-auth-btn{
  font-size:12px;font-weight:600;padding:5px 14px;
  border-radius:var(--radius-sm);text-decoration:none;white-space:nowrap;flex-shrink:0;
}
.nav-auth-btn--outline{border:1px solid var(--border);color:var(--text-secondary)}
.nav-auth-btn--solid{background:var(--blue);color:#fff;border:1px solid transparent}
.nav-auth-btn--solid:hover{background:#1c7cef}

/* ── Guest banner ───────────────────────────────────────── */
.guest-banner{
  background:var(--blue-bg);border-bottom:1px solid var(--blue-border);
  padding:10px 20px;
  display:flex;align-items:center;justify-content:center;
  gap:12px;flex-wrap:wrap;text-align:center;
}
.guest-banner-text{font-size:12px;color:#7ea8d8}
.guest-banner-cta{
  padding:4px 14px;background:var(--blue);
  color:#fff;border-radius:var(--radius-sm);
  font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;
}

/* ── Main layout ────────────────────────────────────────── */
.main{max-width:1280px;margin:0 auto;padding:20px 20px 48px}

/* ── Featured section ───────────────────────────────────── */
.featured-section{margin-bottom:4px}
.section-header{display:flex;align-items:baseline;gap:8px;margin-bottom:12px}
.section-title{font-size:16px;font-weight:700;color:var(--text-primary)}
.section-sub{font-size:12px;color:var(--text-muted)}
.featured-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
  gap:12px;
}
.section-divider{
  border:none;border-top:1px solid var(--border-subtle);
  margin:24px 0 20px;
}

/* ── Toolbar ────────────────────────────────────────────── */
.toolbar{
  display:flex;flex-direction:column;gap:12px;
  margin-bottom:20px;
}
.toolbar-left{display:flex;align-items:baseline;gap:10px}
.page-title{font-size:20px;font-weight:700;color:var(--text-primary)}
.product-count{font-size:12px;color:var(--text-muted)}

/* ── Filters ────────────────────────────────────────────── */
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center}

.search-wrap{
  position:relative;display:flex;align-items:center;
  flex:1;min-width:180px;
}
.search-icon{
  position:absolute;left:11px;
  color:var(--text-muted);font-size:13px;pointer-events:none;
}
.search-input{
  width:100%;
  background:var(--bg-elevated);border:1px solid var(--border);
  border-radius:var(--radius-md);
  padding:8px 32px 8px 32px;
  font-size:13px;color:var(--text-primary);outline:none;
  height:36px;
}
.search-input::placeholder{color:var(--text-muted)}
.search-input:focus{border-color:var(--blue)}
.clear-btn{
  position:absolute;right:10px;
  background:none;border:none;color:var(--text-muted);
  cursor:pointer;padding:2px;display:flex;align-items:center;
  line-height:1;
}
.clear-btn:hover{color:var(--text-secondary)}

.type-filters{display:flex;gap:6px;flex-wrap:wrap}

/* ── Chips — altura fixa, nunca encolhem ─────────────────── */
.type-chip{
  display:inline-flex;align-items:center;gap:5px;
  height:36px;padding:0 14px;
  border-radius:var(--radius-md);
  border:1px solid var(--border);
  background:var(--bg-elevated);
  color:var(--text-secondary);
  font-size:12px;font-weight:600;
  cursor:pointer;white-space:nowrap;
  transition:border-color .15s,color .15s,background .15s;
}
.type-chip:hover:not(:disabled){border-color:#3d4f68;color:var(--text-primary)}
.type-chip.active{
  background:var(--blue-bg);border-color:var(--blue-border);color:var(--blue);
}
.my-team-btn.active{
  background:var(--purple-bg);border-color:var(--purple-border);color:var(--purple);
}
.chip-disabled{opacity:.4;cursor:not-allowed}
.team-count-badge{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--red);color:#fff;
  font-size:9px;font-weight:800;
  min-width:16px;height:16px;padding:0 4px;border-radius:20px;
}

/* ── Product grid ───────────────────────────────────────── */
.products-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:12px;
}

/* ── Product card — altura uniforme via subgrid ───────────── */
.product-card{
  background:var(--bg-surface);
  border:1px solid var(--border);
  border-radius:var(--radius-lg);
  overflow:hidden;cursor:pointer;
  display:flex;flex-direction:column;
  transition:border-color .2s,background .2s;
}
.product-card:hover{border-color:#3d4f68;background:var(--bg-elevated)}

.product-card__img{
  aspect-ratio:1/1;
  background:var(--bg-elevated);
  overflow:hidden;flex-shrink:0;
}
.product-card__img img{width:100%;height:100%;object-fit:cover}

.product-card__body{
  padding:10px 12px 12px;
  display:flex;flex-direction:column;flex:1;gap:6px;
}

/* Crachá de clube — sempre uma linha, trunca se longo */
.product-card__club{
  font-size:10px;font-weight:700;
  color:var(--text-muted);
  text-transform:uppercase;letter-spacing:.6px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

/* Nome do produto — 2 linhas fixas, sem crescer */
.product-card__name{
  font-size:13px;font-weight:600;
  color:var(--text-primary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  line-height:1.4;min-height:calc(13px * 1.4 * 2);
}

/* Linha de badges — type + season */
.product-card__badges{
  display:flex;gap:5px;flex-wrap:wrap;align-items:center;
}
.badge{
  display:inline-flex;align-items:center;height:18px;
  padding:0 7px;border-radius:4px;
  font-size:10px;font-weight:700;letter-spacing:.3px;
  white-space:nowrap;
}
.badge--fan{background:#0a2522;border:1px solid #0e3d38;color:#3fb950}
.badge--player{background:var(--blue-bg);border:1px solid var(--blue-border);color:var(--blue)}
.badge--season{background:var(--bg-hover);border:1px solid var(--border);color:var(--text-muted)}
.badge--my-team{background:#1f1635;border:1px solid var(--purple-border);color:var(--purple)}

/* Tamanhos disponíveis */
.product-card__sizes{
  display:flex;gap:4px;flex-wrap:wrap;align-items:center;min-height:22px;
}
.size-pill{
  display:inline-flex;align-items:center;justify-content:center;
  height:20px;min-width:26px;padding:0 5px;
  background:var(--bg-hover);border:1px solid var(--border);
  border-radius:4px;font-size:10px;font-weight:600;
  color:var(--text-secondary);
}
.size-pill--out{
  opacity:.35;text-decoration:line-through;
}

/* Preço sempre no final, empurrado pelo flex */
.product-card__footer{
  margin-top:auto;
  display:flex;align-items:center;justify-content:space-between;gap:8px;
}
.product-card__price{
  font-size:15px;font-weight:700;color:var(--text-primary);
  white-space:nowrap;
}
.product-card__cta{
  display:inline-flex;align-items:center;justify-content:center;
  height:28px;padding:0 12px;
  background:var(--blue);border:none;
  border-radius:var(--radius-sm);
  color:#fff;font-size:11px;font-weight:700;
  cursor:pointer;white-space:nowrap;flex-shrink:0;
}
.product-card__cta:hover{background:#1c7cef}

/* ── States ─────────────────────────────────────────────── */
.loading-state{
  display:flex;flex-direction:column;align-items:center;
  gap:14px;padding:60px 0;color:var(--text-muted);
  font-size:13px;
}
.spinner{
  width:28px;height:28px;border:2px solid var(--border);
  border-top-color:var(--blue);border-radius:50%;
  animation:spin .7s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}

.empty-state{
  display:flex;flex-direction:column;align-items:center;
  padding:64px 0;gap:6px;text-align:center;
}
.empty-icon{font-size:36px;margin-bottom:8px}
.empty-title{font-size:15px;font-weight:600;color:var(--text-secondary)}
.empty-sub{font-size:13px;color:var(--text-muted)}
.reset-btn{
  margin-top:16px;padding:7px 18px;
  background:transparent;border:1px solid var(--border);
  color:var(--text-secondary);border-radius:var(--radius-sm);
  font-size:12px;cursor:pointer;
}
.reset-btn:hover{border-color:#3d4f68;color:var(--text-primary)}

/* ── Pagination ─────────────────────────────────────────── */
.pagination{
  display:flex;justify-content:center;align-items:center;
  gap:10px;margin-top:36px;
}
.page-btn{
  display:inline-flex;align-items:center;gap:5px;
  height:36px;padding:0 14px;
  background:var(--bg-elevated);border:1px solid var(--border);
  color:var(--text-secondary);border-radius:var(--radius-sm);
  font-size:12px;font-weight:600;cursor:pointer;
}
.page-btn:hover:not(:disabled){border-color:var(--blue-border);color:var(--blue)}
.page-btn:disabled{opacity:.3;cursor:default}
.page-info{font-size:12px;color:var(--text-muted);min-width:80px;text-align:center}

/* ── Responsive ─────────────────────────────────────────── */

/* 480px — duas colunas maiores */
@media(min-width:480px){
  .products-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
  .featured-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
}

/* 640px — toolbar em linha, filtros sem quebra */
@media(min-width:640px){
  .main{padding:24px 24px 56px}
  .toolbar{flex-direction:row;justify-content:space-between;align-items:center;margin-bottom:24px}
  .filters{flex-wrap:nowrap}
  .search-wrap{max-width:280px}
  .products-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
}

/* 1024px — desktop */
@media(min-width:1024px){
  .navbar{height:56px}
  .main{padding:28px 24px 64px}
  .page-title{font-size:22px}
  .search-wrap{max-width:320px}
  .products-grid{gap:20px}
  .product-card__body{padding:12px 14px 14px}
  .product-card__name{font-size:14px;min-height:calc(14px * 1.4 * 2)}
}

/* Telas muito pequenas — 360px */
@media(max-width:380px){
  .navbar-inner{padding:0 12px}
  .favorite-pill{display:none}
  .account-btn .user-label{display:none}
  .nav-right{gap:6px}
  .main{padding:16px 12px 40px}
  .search-wrap{min-width:0}
  .type-filters{gap:4px}
  .type-chip{padding:0 10px;font-size:11px}
  .products-grid{gap:10px}
}
</style>