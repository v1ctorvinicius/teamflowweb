<template>
  <div class="page">

    <div v-if="!isAuthenticated" class="guest-banner">
      <span class="guest-banner-text">🎽 Crie uma conta grátis para ver estoque por tamanho, filtrar pelo seu time e
        muito mais</span>
      <router-link to="/register" class="guest-banner-cta">Criar conta</router-link>
    </div>

    <main class="main">
      <div class="toolbar-left">
        <h1 class="page-title">Produtos</h1>
        <span v-if="!loading" class="product-count">{{ pagination.total }} produto{{ pagination.total !== 1 ? 's' : ''
        }}</span>
      </div>

      <section v-if="featured.length" class="featured-section">
        <div class="section-header">
          <h2 class="section-title">⭐ Destaques</h2>
          <span class="section-sub">Seleção especial da loja</span>
        </div>
        <div class="featured-grid">
          <ProductCard v-for="product in featured" :key="product.id" :product="product"
            :user-favorite-team="user?.favoriteTeam" :is-authenticated="isAuthenticated"
            @view-details="handleViewDetails" />
        </div>
        <div class="section-divider" />
      </section>

      <div class="toolbar" style="border-radius: 10px; padding: 0.5%;background-color: #080b0f;" >
        <div style=" display: flex; flex-direction: column; justify-content: space-between; gap: 1.5vh">
          <div class="search-wrap">
            <i class="pi pi-search search-icon" />
            <input v-model="searchText" type="text" placeholder="Buscar por título, marca, título..." class="search-input"
              @input="onSearchInput" />
            <button v-if="searchText" class="clear-btn" @click="searchText = ''; fetchProducts(1, true)"><i
                class="pi pi-times" /></button>
          </div>
          <!-- Filtro de preço -->
          <div class="price-filter">
            <input 
              v-model.number="minPrice" 
              type="number" 
              placeholder="Min R$" 
              class="price-input"
              @input="onPriceInput"
            />
            <span class="price-sep">-</span>
            <input 
              v-model.number="maxPrice" 
              type="number" 
              placeholder="Max R$" 
              class="price-input"
              @input="onPriceInput"
            />
            <button v-if="minPrice || maxPrice" class="clear-price-btn" @click="clearPriceFilter">
              <i class="pi pi-times" />
            </button>
          </div>

        </div>
        <!-- Filtros agrupados -->
        <div class="filters-group" style="flex-wrap: wrap;">
          <button class="clear-filters-btn" @click="clearAllFilters">
            <i class="pi pi-trash" /> Limpar
          </button>
          <!-- Dropdown de filtros -->
            <select v-model="clubFilter" class="filter-select" @change="fetchProducts(1, true)">
              <option :value="undefined">Todos os clubes</option>
              <option v-for="club in availableClubs" :key="club" :value="club">{{ club }}</option>
            </select>

            <select v-model="brandFilter" class="filter-select" @change="fetchProducts(1, true)">
              <option :value="undefined">Todas as marcas</option>
              <option v-for="brand in availableBrands" :key="brand" :value="brand">{{ brand }}</option>
            </select>
            <select v-model="typeFilter" class="filter-select" @change="fetchProducts(1, true)">
              <option :value="undefined">Todos os tipos</option>
              <option value="FAN">Torcedor</option>
              <option value="PLAYER">Jogador</option>
            </select>

            <select v-model="genderFilter" class="filter-select" @change="fetchProducts(1, true)">
              <option :value="undefined">Todos os gêneros</option>
              <option value="MASCULINE">♂ Masculino</option>
              <option value="FEMININE">♀ Feminino</option>
              <option value="UNISEX">👥 Unissex</option>
            </select>

            <!-- Tamanhos categóricos -->
            <select v-model="sizeCategoricalFilter" class="filter-select" @change="fetchProducts(1, true)">
              <option :value="undefined">Tamanho (P/M/G)</option>
              <option value="PP">PP</option>
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
              <option value="GG">GG</option>
              <option value="XGG">XGG</option>
              <option value="2XGG">2XGG</option>
            </select>

            <!-- Tamanhos numéricos -->
            <select v-model="sizeNumericFilter" class="filter-select" @change="fetchProducts(1, true)">
              <option :value="undefined">Tamanho (numérico)</option>
              <option value="34">34</option>
              <option value="35">35</option>
              <option value="36">36</option>
              <option value="37">37</option>
              <option value="38">38</option>
              <option value="39">39</option>
              <option value="40">40</option>
              <option value="41">41</option>
              <option value="42">42</option>
              <option value="43">43</option>
              <option value="44">44</option>
            </select>

            <select v-model="viewMode" class="filter-select view-select">
              <option value="list">Todos os produtos</option>
              <option value="sections">Por categoria</option>
            </select>

            <button class="type-chip my-team-btn" :class="{ active: myTeamFilter, 'chip-disabled': !isAuthenticated }"
              :disabled="!isAuthenticated" @click="toggleMyTeamFilter">
              ⭐ Meu time
              <span v-if="isAuthenticated && myTeamCount > 0 && !myTeamFilter" class="team-count-badge">{{ myTeamCount
              }}</span>
            </button>
          </div>
      </div>
        

      <!-- MODO SEÇÕES -->
      <template v-if="viewMode === 'sections' && !searchText && !typeFilter && !genderFilter && !myTeamFilter && !brandFilter && !sizeFilter && !minPrice && !maxPrice">
        <template v-for="cat in categories" :key="cat.slug">
          <section v-if="productsByCategory[cat.slug]?.length" class="category-section">
            <div class="section-header">
              <h2 class="section-title">{{ cat.icon }} {{ cat.label }}</h2>
              <button class="see-all-btn"
                @click="viewMode = 'list'; typeFilter = undefined; genderFilter = undefined; searchText = ''; fetchProducts(1, true)">
                Ver todos →
              </button>
            </div>

            <div class="products-grid">
              <ProductCard v-for="product in productsByCategory[cat.slug]" :key="product.id" :product="product"
                :user-favorite-team="user?.favoriteTeam" :is-authenticated="isAuthenticated"
                @view-details="handleViewDetails" />
            </div>

            <div class="section-divider" />
          </section>
        </template>

        <div v-if="!Object.keys(productsByCategory).length" class="empty-state">
          <span class="empty-icon">👕</span>
          <p class="empty-title">Nenhum produto cadastrado ainda</p>
        </div>
      </template>

      <!-- MODO LISTA -->
      <template v-else>
        <div v-if="loading" class="loading-state">
          <ProgressSpinner strokeWidth="3" />
          <p>Carregando produtos...</p>
        </div>

        <div v-else-if="products.length" class="products-grid">
          <ProductCard v-for="product in products" :key="product.id" :product="product"
            :user-favorite-team="user?.favoriteTeam" :is-authenticated="isAuthenticated"
            @view-details="handleViewDetails" />
        </div>

        <div v-else class="empty-state">
          <span class="empty-icon">👕</span>
          <p class="empty-title">Nenhum produto encontrado</p>
          <p class="empty-sub">Tente ajustar os filtros</p>
          <button class="reset-btn" @click="resetFilters">Limpar filtros</button>
        </div>

        <div v-if="!loading && pagination.totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="pagination.page <= 1" @click="fetchProducts(pagination.page - 1, true)">
            <i class="pi pi-chevron-left" /> Anterior
          </button>
          <span class="page-info">Página {{ pagination.page }} de {{ pagination.totalPages }}</span>
          <button class="page-btn" :disabled="pagination.page >= pagination.totalPages"
            @click="fetchProducts(pagination.page + 1, true)">
            Próxima <i class="pi pi-chevron-right" />
          </button>
        </div>
      </template>

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
import type { ProductCategoryDef } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)
const isAdmin = computed(() => (user.value as any)?.role === 'ADMIN')

const products = ref<Product[]>([])
const featured = ref<Product[]>([])
const loading = ref(true)
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })

// Filtros unificados
const searchText = ref('')
const typeFilter = ref<'PLAYER' | 'FAN' | undefined>(undefined)
const genderFilter = ref<'MASCULINE' | 'FEMININE' | 'UNISEX' | undefined>(undefined)
const brandFilter = ref<string | undefined>(undefined)
const sizeCategoricalFilter = ref<string | undefined>(undefined)  // P, M, G, GG...
const sizeNumericFilter = ref<string | undefined>(undefined)      // 34, 35, 36...
const minPrice = ref<number | undefined>(undefined)
const maxPrice = ref<number | undefined>(undefined)
const myTeamFilter = ref(false)
const myTeamCount = ref(0)

// Opções para selects
const categoricalSizeOptions = ['PP', 'P', 'M', 'G', 'GG', 'XGG', '2XGG']
const numericSizeOptions = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

// Marcas disponíveis (extraídas dos produtos carregados)
const availableBrands = computed(() => {
  const brands = new Set<string>()
  products.value.forEach(p => {
    if (p.brand) brands.add(p.brand)
  })
  return Array.from(brands).sort()
})

const categories = ref<ProductCategoryDef[]>([])
const productsByCategory = ref<Record<string, Product[]>>({})
const viewMode = ref<'sections' | 'list'>('list')

let debounceTimer: ReturnType<typeof setTimeout>
let priceDebounceTimer: ReturnType<typeof setTimeout>

function onSearchInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (myTeamFilter.value) myTeamFilter.value = false
    fetchProducts(1, true)
  }, 400)
}

function onPriceInput() {
  clearTimeout(priceDebounceTimer)
  priceDebounceTimer = setTimeout(() => {
    fetchProducts(1, true)
  }, 500)
}

function clearPriceFilter() {
  minPrice.value = undefined
  maxPrice.value = undefined
  fetchProducts(1, true)
}

function clearAllFilters() {
  searchText.value = ''
  typeFilter.value = undefined
  genderFilter.value = undefined
  brandFilter.value = undefined
  sizeCategoricalFilter.value = undefined
  sizeNumericFilter.value = undefined
  minPrice.value = undefined
  maxPrice.value = undefined
  myTeamFilter.value = false
  fetchProducts(1, true)
}

function toggleMyTeamFilter() {
  if (!isAuthenticated.value) return
  myTeamFilter.value = !myTeamFilter.value
  if (myTeamFilter.value) searchText.value = ''
  fetchProducts(1, true)
}

async function fetchProducts(page = 1, reset = false) {
  if (reset) loading.value = true
  try {
    const filters: Record<string, any> = { page, limit: 20 }
    
    if (typeFilter.value) filters.type = typeFilter.value
    if (genderFilter.value) filters.gender = genderFilter.value
    if (brandFilter.value) filters.brand = brandFilter.value
    if (sizeCategoricalFilter.value) filters.sizeCategorical = sizeCategoricalFilter.value
    if (sizeNumericFilter.value) filters.sizeNumeric = sizeNumericFilter.value
    
    if (minPrice.value !== undefined && minPrice.value > 0) {
      filters.minPrice = minPrice.value * 100 // converte para centavos
    }
    if (maxPrice.value !== undefined && maxPrice.value > 0) {
      filters.maxPrice = maxPrice.value * 100
    }
    
    if (myTeamFilter.value && user.value?.favoriteTeam) {
      filters.club = user.value.favoriteTeam
    } else if (searchText.value.trim()) {
      filters.search = searchText.value.trim()
    }
    
    const response = await productsService.list(filters)
    products.value = response.data
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
  searchText.value = ''
  typeFilter.value = undefined
  genderFilter.value = undefined
  brandFilter.value = undefined
  sizeCategoricalFilter.value = undefined
  sizeNumericFilter.value = undefined
  minPrice.value = undefined
  maxPrice.value = undefined
  myTeamFilter.value = false
  fetchProducts(1, true)
}

function handleViewDetails(id: string) { router.push(`/products/${id}`) }
async function handleLogout() { await authStore.logout(); router.push('/login') }

watch(user, (n, o) => {
  if (n?.favoriteTeam !== o?.favoriteTeam) { products.value = [...products.value]; fetchMyTeamCount() }
})

async function loadCategorySections() {
  try {
    const cats = await productsService.getCategories()
    categories.value = cats

    const results = await Promise.all(
      cats.map(cat =>
        productsService.getByCategory(cat.slug, 8)
          .then(products => ({ slug: cat.slug, products }))
          .catch(() => ({ slug: cat.slug, products: [] }))
      )
    )

    const byCategory: Record<string, Product[]> = {}
    results.forEach(({ slug, products }) => {
      if (products.length > 0) byCategory[slug] = products
    })
    productsByCategory.value = byCategory
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchProducts(1, true),
    productsService.getFeatured().then((f) => { featured.value = f }).catch(() => { }),
    fetchMyTeamCount(),
    loadCategorySections(),
  ])
})
</script>


<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0
}

:root {
  --bg-page: #0d1117;
  --bg-surface: #161b22;
  --bg-elevated: #1c2330;
  --bg-hover: #222a38;
  --border: #2d3748;
  --border-subtle: #1e2d3d;
  --text-primary: #f0f6fc;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --blue: #388bfd;
  --blue-bg: #0d2240;
  --blue-border: #1f4280;
  --purple: #a371f7;
  --purple-bg: #1f1635;
  --purple-border: #3d2b75;
  --red: #f85149;
  --red-bg: #2a0f0e;
  --green: #3fb950;
  --amber: #d29922;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}

body {
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased
}

/* ── Navbar ─────────────────────────────────────────────── */
.navbar {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
  height: 52px;
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0
}

.brand-icon {
  font-size: 18px
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -.4px
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0
}

.favorite-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--red-bg);
  border: 1px solid #5a1a18;
  color: #ffa19c;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.account-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.account-btn:hover {
  border-color: var(--blue-border);
  color: var(--blue)
}

.admin-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--purple-border);
  background: var(--purple-bg);
  color: var(--purple);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.logout-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.logout-btn:hover {
  border-color: var(--red);
  color: var(--red)
}

.nav-auth-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-auth-btn--outline {
  border: 1px solid var(--border);
  color: var(--text-secondary)
}

.nav-auth-btn--solid {
  background: var(--blue);
  color: #fff;
  border: 1px solid transparent
}

.nav-auth-btn--solid:hover {
  background: #1c7cef
}

/* ── Guest banner ───────────────────────────────────────── */
.guest-banner {
  background: var(--blue-bg);
  border-bottom: 1px solid var(--blue-border);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  text-align: center;
}

.guest-banner-text {
  font-size: 12px;
  color: #7ea8d8
}

.guest-banner-cta {
  padding: 4px 14px;
  background: var(--blue);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

/* ── Main layout ────────────────────────────────────────── */
.main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 20px 48px
}

/* ── Featured section ───────────────────────────────────── */
.featured-section {
  margin-bottom: 4px
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary)
}

.section-sub {
  font-size: 12px;
  color: var(--text-muted)
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.section-divider {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 24px 0 20px;
}

/* ── Toolbar ────────────────────────────────────────────── */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 5vh;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary)
}

.product-count {
  font-size: 12px;
  color: var(--text-muted)
}

/* ── Filters ────────────────────────────────────────────── */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 180px;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: var(--text-muted);
  font-size: 13px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 32px 8px 32px;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  height: 36px;
}

.search-input::placeholder {
  color: var(--text-muted)
}

.search-input:focus {
  border-color: var(--blue)
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--text-secondary)
}

.type-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap
}

/* ── Chips — altura fixa, nunca encolhem ─────────────────── */
.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color .15s, color .15s, background .15s;
}

.type-chip:hover:not(:disabled) {
  border-color: #3d4f68;
  color: var(--text-primary)
}

.type-chip.active {
  background: var(--blue-bg);
  border-color: var(--blue-border);
  color: var(--blue);
}

.my-team-btn.active {
  background: var(--purple-bg);
  border-color: var(--purple-border);
  color: var(--purple);
}

.chip-disabled {
  opacity: .4;
  cursor: not-allowed
}

.team-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--red);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 20px;
}

/* ── Product grid ───────────────────────────────────────── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* ── Product card — altura uniforme via subgrid ───────────── */
.product-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color .2s, background .2s;
}

.product-card:hover {
  border-color: #3d4f68;
  background: var(--bg-elevated)
}

.product-card__img {
  aspect-ratio: 1/1;
  background: var(--bg-elevated);
  overflow: hidden;
  flex-shrink: 0;
}

.product-card__img img {
  width: 100%;
  height: 100%;
  object-fit: cover
}

.product-card__body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
}

/* Crachá de clube — sempre uma linha, trunca se longo */
.product-card__club {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nome do produto — 2 linhas fixas, sem crescer */
.product-card__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  min-height: calc(13px * 1.4 * 2);
}

/* Linha de badges — type + season */
.product-card__badges {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .3px;
  white-space: nowrap;
}

.badge--fan {
  background: #0a2522;
  border: 1px solid #0e3d38;
  color: #3fb950
}

.badge--player {
  background: var(--blue-bg);
  border: 1px solid var(--blue-border);
  color: var(--blue)
}

.badge--season {
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-muted)
}

.badge--my-team {
  background: #1f1635;
  border: 1px solid var(--purple-border);
  color: var(--purple)
}

/* Tamanhos disponíveis */
.product-card__sizes {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
  min-height: 22px;
}

.size-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  min-width: 26px;
  padding: 0 5px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
}

.size-pill--out {
  opacity: .35;
  text-decoration: line-through;
}

/* Preço sempre no final, empurrado pelo flex */
.product-card__footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-card__price {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.product-card__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  background: var(--blue);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.product-card__cta:hover {
  background: #1c7cef
}

/* ── States ─────────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 0;
  color: var(--text-muted);
  font-size: 13px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg)
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 0;
  gap: 6px;
  text-align: center;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 8px
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary)
}

.empty-sub {
  font-size: 13px;
  color: var(--text-muted)
}

.reset-btn {
  margin-top: 16px;
  padding: 7px 18px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
}

.reset-btn:hover {
  border-color: #3d4f68;
  color: var(--text-primary)
}

/* ── Pagination ─────────────────────────────────────────── */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 36px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--blue-border);
  color: var(--blue)
}

.page-btn:disabled {
  opacity: .3;
  cursor: default
}

.page-info {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 80px;
  text-align: center
}

.category-section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.see-all-btn {
  font-size: 12px;
  color: #60a5fa;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.see-all-btn:hover {
  color: #93c5fd;
}

.view-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

/* ── Responsive ─────────────────────────────────────────── */

/* 480px — duas colunas maiores */
@media(min-width:480px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px
  }

  .featured-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))
  }
}

/* 640px — toolbar em linha, filtros sem quebra */
@media(min-width:640px) {
  .main {
    padding: 24px 24px 56px
  }

  .toolbar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px
  }

  .filters {
    flex-wrap: nowrap
  }

  .search-wrap {
    max-width: 280px
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px
  }
}

/* 1024px — desktop */
@media(min-width:1024px) {
  .navbar {
    height: 56px
  }

  .main {
    padding: 28px 24px 64px
  }

  .page-title {
    font-size: 22px
  }

  .search-wrap {
    max-width: 320px
  }

  .products-grid {
    gap: 20px
  }

  .product-card__body {
    padding: 12px 14px 14px
  }

  .product-card__name {
    font-size: 14px;
    min-height: calc(14px * 1.4 * 2)
  }
}

/* Telas muito pequenas — 360px */
@media(max-width:380px) {
  .navbar-inner {
    padding: 0 12px
  }

  .favorite-pill {
    display: none
  }

  .account-btn .user-label {
    display: none
  }

  .nav-right {
    gap: 6px
  }

  .main {
    padding: 16px 12px 40px
  }

  .search-wrap {
    min-width: 0
  }

  .type-filters {
    gap: 4px
  }

  .type-chip {
    padding: 0 10px;
    font-size: 11px
  }

  .products-grid {
    gap: 10px
  }
}

/* ── Estilos adicionais para filtros agrupados ────────────────────────────── */

/* Grupo de filtros */
.filters-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* Dropdowns container */
.filter-dropdowns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-select {
  height: 36px;
  padding: 0 32px 0 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.filter-select:hover {
  border-color: #3d4f68;
  color: var(--text-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--blue);
}

.view-select {
  min-width: 140px;
}

/* Ajuste da toolbar para mobile */
@media (min-width: 768px) {
  .filters-group {
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }
  
  .search-wrap {
    min-width: 240px;
  }
  
  .filter-dropdowns {
    flex-wrap: nowrap;
  }
}

@media (max-width: 640px) {
  .filter-dropdowns {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .my-team-btn {
    justify-content: center;
  }
}

.category-section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.see-all-btn {
  font-size: 12px;
  color: #60a5fa;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.see-all-btn:hover {
  color: #93c5fd;
}


.price-filter {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 8px;
  height: 36px;
  position: relative;
}

.price-input {
  width: 80px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  padding: 0 4px;
  outline: none;
}

.price-input::placeholder {
  color: var(--text-muted);
  font-size: 11px;
}

.price-sep {
  color: var(--text-muted);
  font-size: 12px;
}

.clear-price-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.clear-price-btn:hover {
  color: var(--text-secondary);
}

.clear-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.clear-filters-btn:hover {
  border-color: var(--red-border);
  color: var(--red);
  background: var(--red-bg);
}

/* Responsividade */
@media (max-width: 768px) {
  .price-filter {
    width: 100%;
    justify-content: space-between;
  }
  
  .price-input {
    width: 100%;
  }
}
</style>