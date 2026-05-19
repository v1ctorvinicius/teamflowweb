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
        <!-- <div class="section-divider" /> -->
      </section>

      <div class="toolbar" style="border-radius: 10px; padding: 1%; background-color: #080b0f;">
        <div class="toolbar-inner">
          <!-- Busca por texto -->
          <div class="search-wrap">
            <i class="pi pi-search search-icon" />
            <input v-model="searchText" type="text" placeholder="Buscar por título, marca, clube..." class="search-input"
              @input="onSearchInput" />
            <button v-if="searchText" class="clear-btn" @click="searchText = ''; fetchProducts(1, true)">
              <i class="pi pi-times" />
            </button>
          </div>

          <!-- Filtro de preço -->
          <div class="price-filter">
            <input v-model.number="minPrice" type="number" placeholder="Min R$" class="price-input"
              @input="onPriceInput" />
            <span class="price-sep">-</span>
            <input v-model.number="maxPrice" type="number" placeholder="Max R$" class="price-input"
              @input="onPriceInput" />
            <button v-if="minPrice || maxPrice" class="clear-price-btn" @click="clearPriceFilter">
              <i class="pi pi-times" />
            </button>
          </div>

          <!-- Linha de ações -->
          <div class="filter-actions-row">
            <button class="type-chip my-team-btn" :class="{ active: myTeamFilter, 'chip-disabled': !isAuthenticated }"
              :disabled="!isAuthenticated" @click="toggleMyTeamFilter">
              <i class="pi pi-star" /> Meu time
              <span v-if="isAuthenticated && myTeamCount > 0 && !myTeamFilter" class="team-count-badge">{{ myTeamCount }}</span>
            </button>

            <button class="toggle-filters-btn" @click="showAdvancedFilters = !showAdvancedFilters">
              <i :class="showAdvancedFilters ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
              {{ showAdvancedFilters ? 'Menos filtros' : 'Mais filtros' }}
            </button>

            <button class="clear-filters-btn" @click="clearAllFilters">
              <i class="pi pi-trash" /> Limpar
            </button>
          </div>
        </div>

        <!-- Filtros avançados (colapsáveis) -->
        <div v-show="showAdvancedFilters" class="filters-group" style="flex-wrap: wrap; margin-top: 12px">
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
        </div>
      </div>

      <!-- MODO SEÇÕES -->
      <template  
        v-if="viewMode === 'sections' && !searchText && !typeFilter && !genderFilter && !myTeamFilter && !brandFilter && !sizeCategoricalFilter && !sizeNumericFilter && !minPrice && !maxPrice">
        <template v-for="cat in categories" :key="cat.slug">
          <section v-if="productsByCategory[cat.slug]?.length" class="category-section">
            <div class="section-header" >
              <h2 class="section-title" >{{ cat.icon }} {{ cat.label }}</h2>
              <button class="see-all-btn"
                @click="viewMode = 'list'; typeFilter = undefined; genderFilter = undefined; searchText = ''; fetchProducts(1, true)">
                Ver todos →
              </button>
            </div>

            <div class="products-grid" >
              <ProductCard v-for="product in productsByCategory[cat.slug]" :key="product.id" :product="product"
                :user-favorite-team="user?.favoriteTeam" :is-authenticated="isAuthenticated"
                @view-details="handleViewDetails" />
            </div>            

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

const products = ref<Product[]>([])
const featured = ref<Product[]>([])
const loading = ref(true)
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })


const searchText = ref('')
const clubFilter = ref<string | undefined>(undefined)
const typeFilter = ref<'PLAYER' | 'FAN' | undefined>(undefined)
const genderFilter = ref<'MASCULINE' | 'FEMININE' | 'UNISEX' | undefined>(undefined)
const brandFilter = ref<string | undefined>(undefined)
const sizeCategoricalFilter = ref<string | undefined>(undefined)
const sizeNumericFilter = ref<string | undefined>(undefined)
const minPrice = ref<number | undefined>(undefined)
const maxPrice = ref<number | undefined>(undefined)
const myTeamFilter = ref(false)
const myTeamCount = ref(0)
const showAdvancedFilters = ref(false)

const availableBrands = computed(() => {
  const brands = new Set<string>()
  products.value.forEach(p => {
    if (p.brand) brands.add(p.brand)
  })
  return Array.from(brands).sort()
})


const availableClubs = computed(() => {
  const clubs = new Set<string>()
  products.value.forEach(p => {
    if (p.club) clubs.add(p.club)
  })
  return Array.from(clubs).sort()
})

const categories = ref<ProductCategoryDef[]>([])
const productsByCategory = ref<Record<string, Product[]>>({})
const viewMode = ref<'sections' | 'list'>('sections')

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
  clubFilter.value = undefined
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

    if (clubFilter.value) filters.club = clubFilter.value
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
  clubFilter.value = undefined
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


<style scoped>
:root {
  --bg-primary: #080b0f;
  --bg-secondary: #0f1419;
  --bg-elevated: #1a1f26;
  --bg-hover: #252d38;

  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;

  --border: #30363d;
  --border-light: #21262d;

  --blue: #58a6ff;
  --blue-bg: rgba(88, 166, 255, 0.1);
  --blue-border: rgba(88, 166, 255, 0.3);

  --red: #f85149;
  --red-bg: rgba(248, 81, 73, 0.1);
  --red-border: rgba(248, 81, 73, 0.3);

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}

.page {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 0;
}

.guest-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(135deg, #1f6feb 0%, #388bfd 100%);
  padding: 12px 16px;
  margin-bottom: 24px;
  border-radius: var(--radius-lg);
}

.guest-banner-text {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  flex: 1;
}

.guest-banner-cta {
  white-space: nowrap;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.guest-banner-cta:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.product-count {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.featured-section {
  margin-bottom: 40px;
}

.featured-grid,
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
  width: 100%;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 3vh 0;
}

.section-title {
  font-size: 2em;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.section-sub {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
}

.section-divider {
  height: 1px;
  background: var(--border);
  margin: 32px 0;
}

.see-all-btn {
  font-size: 12px;
  color: var(--blue);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s;
}

.see-all-btn:hover {
  color: #79c0ff;
}

/* ============================================
   CONTAINER DE FILTROS - PROFISSIONAL
   ============================================ */

.filters-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 32px;
  transition: all 0.2s;
}

/* Seção de Busca */
.search-section {
  margin-bottom: 16px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  height: 40px;
  transition: all 0.2s;
}

.search-wrap:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 2px var(--blue-bg);
}

.search-icon {
  color: var(--text-muted);
  font-size: 14px;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  padding: 8px 0;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  margin-left: 8px;
  transition: color 0.2s;
  flex-shrink: 0;
}

.clear-btn:hover {
  color: var(--red);
}

/* Linha Principal de Filtros */
.filters-primary-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 12px;
  align-items: end;
}

/* Grupo de Preço */
.price-filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 10px;
  height: 40px;
  transition: all 0.2s;
}

.price-filter:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 2px var(--blue-bg);
}

.price-input {
  width: 60px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  padding: 8px 4px;
  outline: none;
}

.price-input::placeholder {
  color: var(--text-muted);
  font-size: 11px;
}

.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.price-input[type='number'] {
  -moz-appearance: textfield;
}

.price-sep {
  color: var(--text-muted);
  font-size: 12px;
  margin: 0 2px;
  flex-shrink: 0;
}

.clear-price-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 2px;
  display: flex;
  align-items: center;
  margin-left: 4px;
  transition: color 0.2s;
  flex-shrink: 0;
}

.clear-price-btn:hover {
  color: var(--red);
}

/* Grupo Meu Time */
.my-team-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: flex-end;
}

.my-team-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap;
}

.my-team-btn:hover:not(:disabled) {
  border-color: var(--blue-border);
  background: var(--blue-bg);
  color: var(--blue);
}

.my-team-btn.active {
  border-color: var(--blue-border);
  background: var(--blue-bg);
  color: var(--blue);
}

.my-team-btn.btn-disabled,
.my-team-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.team-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  background: var(--red);
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  position: relative;
  top: -1px;
}

/* Grupo de Ações */
.actions-group {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.toggle-filters-btn,
.clear-filters-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.toggle-filters-btn:hover {
  border-color: var(--blue-border);
  color: var(--blue);
  background: var(--blue-bg);
}

.clear-filters-btn:hover {
  border-color: var(--red-border);
  color: var(--red);
  background: var(--red-bg);
}

/* Filtros Avançados */
.filters-advanced {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  animation: slideDown 0.2s ease-out;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-select {
  height: 40px;
  padding: 0 28px 0 12px;
  background: #1a1d23;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}

.filter-select:hover {
  border-color: var(--border-light);
  color: var(--text-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--blue);
  box-shadow: 0 0 0 2px var(--blue-bg);
}

/* Estilos da linha de ações dos filtros */
.filter-actions-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.filter-actions-row .my-team-btn,
.filter-actions-row .toggle-filters-btn,
.filter-actions-row .clear-filters-btn {
  width: 100%;
  padding: 10px 8px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animações */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filters-expand-enter-active,
.filters-expand-leave-active {
  transition: all 0.2s ease;
}

.filters-expand-enter-from,
.filters-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Outros estilos */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.reset-btn {
  padding: 8px 16px;
  background: var(--blue);
  border: none;
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #79c0ff;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-state p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--blue-border);
  color: var(--blue);
  background: var(--blue-bg);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.category-section {
  margin-bottom: 40px;
}

/* ============================================
   RESPONSIVIDADE
   ============================================ */

@media (min-width: 1400px) {
  .featured-grid,
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

@media (min-width: 1025px) and (max-width: 1399px) {
  .featured-grid,
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: 1024px) {
  .filters-primary-row {
    grid-template-columns: 1fr 1fr;
  }

  .price-filter-group {
    grid-column: 1 / -1;
  }

  .featured-grid,
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 0;
  }

  .main {
    padding: 0 12px 32px;
  }

  .toolbar-left {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .filters-container {
    padding: 12px;
    border-radius: var(--radius-md);
  }

  .filters-primary-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .price-filter-group {
    grid-column: auto;
  }

  .my-team-group {
    grid-column: auto;
  }

  .actions-group {
    grid-column: 1 / -1;
    gap: 8px;
  }

  .filter-actions-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .filter-actions-row .my-team-btn,
  .filter-actions-row .toggle-filters-btn,
  .filter-actions-row .clear-filters-btn {
    padding: 10px 6px;
    font-size: 12px;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .toggle-filters-btn,
  .clear-filters-btn {
    flex: 1;
  }

  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .featured-grid,
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .guest-banner {
    flex-direction: column;
    gap: 10px;
  }

  .guest-banner-text {
    font-size: 12px;
  }

  .guest-banner-cta {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .filter-actions-row .my-team-btn,
  .filter-actions-row .toggle-filters-btn,
  .filter-actions-row .clear-filters-btn {
    padding: 8px 4px;
    font-size: 11px;
    min-height: 38px;
  }

  .my-team-btn .team-count-badge {
    font-size: 10px;
    padding: 2px 4px;
  }

  .featured-grid,
  .products-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .page-btn {
    width: 100%;
  }

  .price-input {
    width: 50px;
  }

  .search-input {
    font-size: 12px;
  }
}
</style>