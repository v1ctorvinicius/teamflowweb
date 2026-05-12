<!-- src/views/admin/AdminView.vue - VERSÃO COMPLETA ATUALIZADA -->
<template>
  <div class="admin-page">
    <!-- Navbar admin -->
    <header class="navbar">
      <div class="navbar-inner">
        <div class="brand">
          <span class="brand-icon">⚽</span>
          <span class="brand-name">TeamFlow</span>
          <span class="admin-badge">Admin</span>
        </div>
        <div class="nav-right">
          <span class="user-name">{{ user?.name }}</span>
          <router-link to="/" class="back-btn">
            <i class="pi pi-arrow-left" /> Loja
          </router-link>
          <button class="logout-btn" @click="handleLogout">Sair</button>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="admin-header">
        <h1 class="page-title">Painel de Produtos</h1>
        <button class="new-btn" @click="openCreate">
          <i class="pi pi-plus" /> Novo produto
        </button>
      </div>

      <!-- Filtros admin -->
      <div class="filters">
        <div class="search-wrap">
          <i class="pi pi-search search-icon" />
          <input
            v-model="clubFilter"
            type="text"
            placeholder="Buscar por clube..."
            class="search-input"
            @input="onFilterChange"
          />
        </div>
        <div class="type-filters">
          <button
            v-for="opt in typeOptions"
            :key="opt.value ?? 'all'"
            class="type-chip"
            :class="{ active: typeFilter === opt.value }"
            @click="typeFilter = opt.value; onFilterChange()"
          >{{ opt.label }}</button>
        </div>
        <label class="show-inactive">
          <input type="checkbox" v-model="showInactive" @change="onFilterChange" />
          Mostrar inativos
        </label>
      </div>

      <!-- Tabela -->
      <div class="table-wrap">
        <div v-if="loading" class="loading-state">
          <ProgressSpinner strokeWidth="3" />
        </div>

        <table v-else class="products-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Clube</th>
              <th>Tipo</th>
              <th>Temporada</th>
              <th>Preço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in filteredProducts"
              :key="p.id"
              :class="{ 'row-inactive': !p.isActive }"
            >
              <td>
                <div class="product-cell">
                  <img :src="p.imageUrl || placeholder" :alt="p.name" class="thumb" />
                  <span class="product-cell-name">{{ p.name }}</span>
                </div>
              </td>
              <td>{{ p.club }}</td>
              <td>
                <span class="type-badge" :class="p.type === 'PLAYER' ? 'badge-player' : 'badge-fan'">
                  {{ p.type === 'PLAYER' ? 'Jogador' : 'Torcedor' }}
                </span>
              </td>
              <td>{{ p.season }}</td>
              <td>{{ formatPrice(p.basePrice) }}</td>
              <td>
                <span class="status-badge" :class="p.isActive ? 'status-active' : 'status-inactive'">
                  {{ p.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="action-btn edit-btn" @click="openEdit(p)" title="Editar">
                    <i class="pi pi-pencil" />
                  </button>
                  <button
                    class="action-btn"
                    :class="p.isActive ? 'deactivate-btn' : 'activate-btn'"
                    @click="toggleActive(p)"
                    :title="p.isActive ? 'Desativar' : 'Reativar'"
                  >
                    <i :class="p.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="7" class="empty-row">Nenhum produto encontrado</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginação -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="pagination.page <= 1" @click="fetchProducts(pagination.page - 1)">
          <i class="pi pi-chevron-left" /> Anterior
        </button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button class="page-btn" :disabled="pagination.page >= pagination.totalPages" @click="fetchProducts(pagination.page + 1)">
          Próxima <i class="pi pi-chevron-right" />
        </button>
      </div>
    </main>

    <!-- Modal criar/editar -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingProduct ? 'Editar produto' : 'Novo produto' }}</h2>
          <button class="modal-close" @click="closeModal"><i class="pi pi-times" /></button>
        </div>

        <div class="modal-body">
          <div v-if="formError" class="form-error-alert">{{ formError }}</div>

          <div class="form-grid">
            <!-- Nome do produto -->
            <div class="form-group span-2">
              <label>Nome do produto *</label>
              <input v-model="form.name" class="form-input" placeholder="Ex: Camisa Titular 2024" />
            </div>

            <!-- Clube -->
            <div class="form-group">
              <label>Clube *</label>
              <select v-model="form.club" class="form-input">
                <option value="">— Selecione —</option>
                <option v-for="c in clubs" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
            </div>

            <!-- Temporada -->
            <div class="form-group">
              <label>Temporada *</label>
              <input v-model="form.season" class="form-input" placeholder="Ex: 2024/2025" />
            </div>

            <!-- Tipo -->
            <div class="form-group">
              <label>Tipo *</label>
              <select v-model="form.type" class="form-input">
                <option value="FAN">Torcedor</option>
                <option value="PLAYER">Jogador</option>
              </select>
            </div>

            <!-- Categoria -->
            <div class="form-group">
              <label>Categoria *</label>
              <select v-model="form.category" class="form-input">
                <option value="">— Selecione —</option>
                <option value="SHIRT">Camisa</option>
                <option value="SHOE">Sapato</option>
                <option value="COMBO">Combo</option>
              </select>
            </div>

            <!-- Preço -->
            <div class="form-group">
              <label>Preço (em centavos) *</label>
              <input v-model.number="form.basePrice" type="number" min="0" class="form-input" placeholder="Ex: 18990 = R$ 189,90" />
              <span class="price-preview" v-if="form.basePrice > 0">{{ formatPrice(form.basePrice) }}</span>
            </div>

            <!-- Sistema de Tamanhos: Categorical -->
            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.enableCategoricalSizes" />
                Habilitar tamanhos categóricos (PP, P, M, G, GG, etc)
              </label>
            </div>

            <template v-if="form.enableCategoricalSizes">
              <div class="form-group">
                <label>Label para tamanhos categóricos</label>
                <input 
                  v-model="form.categoricalSizesLabel" 
                  class="form-input" 
                  placeholder="Ex: Tamanho" 
                />
              </div>
              
              <div class="form-group span-2">
                <label>Tamanhos categóricos disponíveis *</label>
                <div class="size-checkboxes">
                  <label v-for="s in categoricalSizeOptions" :key="s" class="size-check">
                    <input type="checkbox" :value="s" v-model="form.stockCategorical" />
                    {{ s }}
                  </label>
                </div>
              </div>

              <div class="form-group span-2">
                <label>Estoque por tamanho categórico</label>
                <div class="stock-grid">
                  <div v-for="s in form.stockCategorical" :key="s" class="stock-item">
                    <span class="stock-size-label">{{ s }}</span>
                    <input
                      v-model.number="form.stockCategoricalBySize[s]"
                      type="number"
                      min="0"
                      class="form-input stock-input"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- Sistema de Tamanhos: Numeric -->
            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.enableNumericSizes" />
                Habilitar tamanhos numéricos (36, 37, 38, etc)
              </label>
            </div>

            <template v-if="form.enableNumericSizes">
              <div class="form-group">
                <label>Label para tamanhos numéricos</label>
                <input 
                  v-model="form.numericSizesLabel" 
                  class="form-input" 
                  placeholder="Ex: Tamanho, Número" 
                />
              </div>

              <div class="form-group span-2">
                <label>Tamanhos numéricos disponíveis *</label>
                <div class="numeric-input-wrap">
                  <input 
                    v-model="numericSizesInput" 
                    type="text" 
                    class="form-input" 
                    placeholder="Ex: 36,37,38,39,40,41,42,43,44"
                  />
                  <span class="help-text">Separe por vírgula</span>
                </div>
              </div>

              <div class="form-group span-2">
                <label>Estoque por tamanho numérico</label>
                <div class="stock-grid">
                  <div 
                    v-for="size in Object.keys(form.stockNumeric).sort((a,b) => Number(a) - Number(b))" 
                    :key="size" 
                    class="stock-item"
                  >
                    <span class="stock-size-label">{{ size }}</span>
                    <input
                      v-model.number="form.stockNumeric[size]"
                      type="number"
                      min="0"
                      class="form-input stock-input"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- Imagens do Produto -->
            <div class="form-group span-2">
              <label>Imagens do Produto</label>
              
              <!-- Opção 1: Upload via Cloudinary -->
              <div class="image-upload-section">
                <div class="section-header">
                  <span class="section-title">📁 Upload de arquivos</span>
                  <span class="section-hint">Arraste ou clique para enviar imagens</span>
                </div>
                <ImageUploader ref="imageUploaderRef" @uploaded="handleImageUpload" v-model="form.imageUrls" />
              </div>

              <!-- Opção 2: URLs manuais -->
              <div class="image-urls-section">
                <div class="section-header">
                  <span class="section-title">🔗 URLs manuais</span>
                  <span class="section-hint">Uma URL por linha — a primeira será a imagem principal</span>
                </div>
                <textarea 
                  v-model="imageUrlsInput" 
                  class="form-input form-textarea" 
                  placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg&#10;https://exemplo.com/imagem3.jpg" 
                  rows="4"
                />
                <div class="urls-help">
                  <span class="help-text">💡 Dica: Use o upload para não precisar digitar as URLs</span>
                </div>
              </div>

              <!-- Preview das imagens -->
              <div v-if="imageUrlsArray.length > 0" class="image-preview-section">
                <div class="section-header">
                  <span class="section-title">🖼️ Preview</span>
                  <span class="section-hint">{{ imageUrlsArray.length }} imagem(ens)</span>
                </div>
                <div class="image-preview-grid">
                  <div 
                    v-for="(url, index) in imageUrlsArray" 
                    :key="index" 
                    class="image-preview-item"
                    :class="{ 'is-main': index === 0 }"
                  >
                    <img :src="url" class="preview-image" @error="handleImageError(index)" />
                    <div class="preview-overlay">
                      <span v-if="index === 0" class="main-badge">Principal</span>
                      <button class="preview-remove" @click="removeImageUrl(index)" title="Remover">
                        <i class="pi pi-times" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Descrição -->
            <div class="form-group span-2">
              <label>Descrição</label>
              <textarea v-model="form.description" class="form-input form-textarea" placeholder="Descreva o produto..." rows="3" />
            </div>

            <!-- Destaque -->
            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isFeatured" />
                ⭐ Destaque (aparece na seção de destaques)
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">Cancelar</button>
          <button class="save-btn" :disabled="saving" @click="saveProduct">
            <span v-if="!saving">{{ editingProduct ? 'Salvar alterações' : 'Criar produto' }}</span>
            <span v-else class="btn-spinner" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminService } from '@/services/admin'
import { clubsService, type Club } from '@/services/clubs'
import ProgressSpinner from 'primevue/progressspinner'
import type { Product } from '@/types'
import ImageUploader from '@/components/ImageUploader.vue'

const router = useRouter()
const authStore = useAuthStore()
const { user } = authStore

const products = ref<Product[]>([])
const loading = ref(true)
const pagination = ref({ page: 1, limit: 50, total: 0, totalPages: 0 })
const clubs = ref<Club[]>([])

const clubFilter = ref('')
const typeFilter = ref<string | undefined>(undefined)
const showInactive = ref(true)

const showModal = ref(false)
const editingProduct = ref<Product | null>(null)
const saving = ref(false)
const formError = ref('')

const categoricalSizeOptions = ['PP', 'P', 'M', 'G', 'GG', 'XGG', '2XGG']
const numericSizesInput = ref('')
const imageUrlsInput = ref('')
const placeholder = 'https://placehold.co/60x60/0f172a/334155?text=TF'

const imageUploaderRef = ref<InstanceType<typeof ImageUploader> | null>(null)

const emptyForm = () => ({
  name: '',
  club: '',
  season: '',
  type: 'FAN' as 'FAN' | 'PLAYER',
  category: '',
  enableCategoricalSizes: false,
  categoricalSizesLabel: 'Tamanho',
  stockCategorical: [] as string[],
  stockCategoricalBySize: {} as Record<string, number>,
  enableNumericSizes: false,
  numericSizesLabel: 'Tamanho',
  stockNumeric: {} as Record<string, number>,
  basePrice: 0,
  description: '',
  imageUrl: '',
  imageUrls: [] as string[],
  isFeatured: false,
})

interface FormData {
  name: string
  club: string
  season: string
  type: 'FAN' | 'PLAYER'
  category: string
  enableCategoricalSizes: boolean
  categoricalSizesLabel: string
  stockCategorical: string[]
  stockCategoricalBySize: Record<string, number>
  enableNumericSizes: boolean
  numericSizesLabel: string
  stockNumeric: Record<string, number>
  basePrice: number
  description: string
  imageUrl: string
  imageUrls: string[]
  isFeatured: boolean
}

const form = ref<FormData>(emptyForm())

const typeOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Torcedor', value: 'FAN' },
  { label: 'Jogador', value: 'PLAYER' },
]

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    if (!showInactive.value && !p.isActive) return false
    return true
  })
})

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// 🔥 Computed para preview das imagens
const imageUrlsArray = computed(() => {
  return imageUrlsInput.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0)
})

// 🔥 Sincroniza textarea com form.imageUrls
watch(imageUrlsInput, (val) => {
  const urls = val
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0)
  form.value.imageUrls = urls
  if (urls.length > 0) {
    form.value.imageUrl = urls[0]
  } else {
    form.value.imageUrl = ''
  }
})

// 🔥 Sincroniza form.imageUrls com textarea (quando vindo do edit)
watch(() => form.value.imageUrls, (urls) => {
  const currentUrls = imageUrlsInput.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0)
  
  if (JSON.stringify(urls) !== JSON.stringify(currentUrls)) {
    imageUrlsInput.value = urls.join('\n')
  }
}, { deep: true })

watch(
  () => numericSizesInput.value,
  (val) => {
    const sizes = val
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    const newStock: Record<string, number> = {}
    sizes.forEach(size => {
      newStock[size] = form.value.stockNumeric[size] ?? 0
    })
    form.value.stockNumeric = newStock
  }
)

let debounce: ReturnType<typeof setTimeout>
function onFilterChange() {
  clearTimeout(debounce)
  debounce = setTimeout(() => fetchProducts(1), 350)
}

async function fetchProducts(page = 1) {
  loading.value = true
  try {
    const result = await adminService.listProducts({
      page,
      limit: 50,
      club: clubFilter.value || undefined,
      type: typeFilter.value,
    })
    products.value = result.data.data
    pagination.value = result.data.pagination
  } finally {
    loading.value = false
  }
}

async function toggleActive(p: Product) {
  await adminService.updateProduct(p.id, { isActive: !p.isActive })
  p.isActive = !p.isActive
}

// 🔥 HANDLE IMAGE UPLOAD - Recebe URLs do ImageUploader e adiciona ao textarea
function handleImageUpload(urls: string[]) {
  const existingUrls = imageUrlsInput.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0)
  
  const allUrls = [...existingUrls, ...urls]
  imageUrlsInput.value = allUrls.join('\n')
}

// 🔥 REMOVE IMAGE URL do preview
function removeImageUrl(index: number) {
  const urls = imageUrlsArray.value
  urls.splice(index, 1)
  imageUrlsInput.value = urls.join('\n')
}

// 🔥 HANDLE IMAGE ERROR (quando URL quebrada)
function handleImageError(index: number) {
  console.warn(`Image failed to load at index ${index}`)
  // Opcional: remover automaticamente
  // removeImageUrl(index)
}

function openCreate() {
  editingProduct.value = null
  form.value = emptyForm()
  imageUrlsInput.value = ''
  numericSizesInput.value = ''
  formError.value = ''
  showModal.value = true
}

function openEdit(p: Product) {
  editingProduct.value = p
  
  const imageUrls = normalizeImageUrls(p.imageUrls) || []
  
  // 🔥 PARTE 3: Compatibilidade com imageUrl único
  if (p.imageUrl && imageUrls.length === 0) {
    imageUrls.push(p.imageUrl)
  }
  
  form.value = {
    name: p.name,
    club: p.club,
    season: p.season,
    type: p.type,
    category: p.category ?? '',
    enableCategoricalSizes: p.enableCategoricalSizes ?? false,
    categoricalSizesLabel: p.categoricalSizesLabel ?? 'Tamanho',
    stockCategorical: p.stockCategorical ?? [],
    stockCategoricalBySize: normalizeObject(p.stockCategoricalBySize) ?? {},
    enableNumericSizes: p.enableNumericSizes ?? false,
    numericSizesLabel: p.numericSizesLabel ?? 'Tamanho',
    stockNumeric: normalizeObject(p.stockNumeric) ?? {},
    basePrice: p.basePrice,
    description: p.description ?? '',
    imageUrl: p.imageUrl ?? '',
    imageUrls: imageUrls,
    isFeatured: p.isFeatured ?? false,
  }

  imageUrlsInput.value = imageUrls.join('\n')
  numericSizesInput.value = Object.keys(form.value.stockNumeric)
    .sort((a, b) => Number(a) - Number(b))
    .join(',')
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveProduct() {
  formError.value = ''
  if (!form.value.name || !form.value.club || !form.value.season || !form.value.category) {
    formError.value = 'Preencha todos os campos obrigatórios.'
    return
  }

  if (!form.value.enableCategoricalSizes && !form.value.enableNumericSizes) {
    formError.value = 'Habilite pelo menos um sistema de tamanhos.'
    return
  }

  // 🔥 Processa uploads pendentes do ImageUploader
  if (imageUploaderRef.value) {
    const uploadSuccess = await imageUploaderRef.value.savePendingUploads()
    if (!uploadSuccess) {
      // Erro já está setado dentro do ImageUploader
      saving.value = false
      return
    }
  }

  // 🔥 Compatibilidade: primeira imagem é imageUrl, resto em imageUrls
  const imageUrls = form.value.imageUrls || []
  const imageUrl = imageUrls[0] || null

  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      club: form.value.club,
      season: form.value.season,
      type: form.value.type,
      category: form.value.category,
      enableCategoricalSizes: form.value.enableCategoricalSizes,
      categoricalSizesLabel: form.value.categoricalSizesLabel,
      stockCategorical: form.value.stockCategorical,
      stockCategoricalBySize: form.value.stockCategoricalBySize,
      enableNumericSizes: form.value.enableNumericSizes,
      numericSizesLabel: form.value.numericSizesLabel,
      stockNumeric: form.value.stockNumeric,
      basePrice: form.value.basePrice,
      description: form.value.description || undefined,
      imageUrl: imageUrl,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      isFeatured: form.value.isFeatured,
    }

    if (editingProduct.value) {
      const updated = await adminService.updateProduct(editingProduct.value.id, payload)
      const idx = products.value.findIndex((p) => p.id === editingProduct.value!.id)
      if (idx !== -1) products.value[idx] = updated
    } else {
      const created = await adminService.createProduct(payload)
      products.value.unshift(created)
    }
    closeModal()
    await fetchProducts(pagination.value.page)
  } catch (err: any) {
    formError.value = err.response?.data?.message || 'Erro ao salvar. Tente novamente.'
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function normalizeImageUrls(images: any): string[] {
  if (Array.isArray(images)) return images
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeObject(obj: any): Record<string, number> {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    return obj
  }
  if (typeof obj === 'string') {
    try {
      return JSON.parse(obj)
    } catch {
      return {}
    }
  }
  return {}
}

onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    clubsService.list().then((c) => { clubs.value = c }),
  ])
})
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #0f172a; color: #f1f5f9; font-family: 'DM Sans', sans-serif; }

/* Navbar */
.navbar { background: #1e293b; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 50; }
.navbar-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 8px; }
.brand-icon { font-size: 22px; }
.brand-name { font-size: 18px; font-weight: 800; color: #f1f5f9; }
.admin-badge { background: #7c3aed; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 20px; letter-spacing: 0.5px; }
.nav-right { display: flex; align-items: center; gap: 12px; }
.user-name { font-size: 14px; color: #94a3b8; }
.back-btn { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 8px; border: 1px solid #334155; color: #94a3b8; font-size: 13px; text-decoration: none; transition: all 0.15s; }
.back-btn:hover { border-color: #475569; color: #f1f5f9; }
.logout-btn { background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 6px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: all 0.15s; }
.logout-btn:hover { border-color: #ef4444; color: #ef4444; }

/* Main */
.main { max-width: 1400px; margin: 0 auto; padding: 28px 24px 48px; }
.admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: #f1f5f9; margin: 0; }
.new-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.new-btn:hover { background: #1d4ed8; }

/* Filtros */
.filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px; }
.search-wrap { position: relative; display: flex; align-items: center; min-width: 220px; }
.search-icon { position: absolute; left: 12px; color: #64748b; font-size: 14px; pointer-events: none; }
.search-input { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 9px 16px 9px 36px; font-size: 14px; color: #f1f5f9; outline: none; transition: border-color 0.15s; width: 100%; }
.search-input:focus { border-color: #3b82f6; }
.type-filters { display: flex; gap: 8px; }
.type-chip { padding: 7px 16px; border-radius: 20px; border: 1px solid #334155; background: #1e293b; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.type-chip:hover { border-color: #475569; color: #f1f5f9; }
.type-chip.active { background: #1d4ed8; border-color: #2563eb; color: #fff; }
.show-inactive { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #94a3b8; cursor: pointer; }

/* Tabela */
.table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #334155; }
.products-table { width: 100%; border-collapse: collapse; }
.products-table th { background: #1e293b; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #334155; }
.products-table td { padding: 12px 16px; border-bottom: 1px solid #1e293b; font-size: 14px; color: #cbd5e1; vertical-align: middle; }
.products-table tr:last-child td { border-bottom: none; }
.products-table tr:hover td { background: #1a2540; }
.row-inactive td { opacity: 0.45; }

.product-cell { display: flex; align-items: center; gap: 10px; }
.thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; background: #0f172a; }
.product-cell-name { font-weight: 600; color: #f1f5f9; }

.type-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.badge-player { background: #4c1d95; color: #c4b5fd; }
.badge-fan { background: #064e3b; color: #6ee7b7; }

.status-badge { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.status-active { background: #14532d; color: #86efac; }
.status-inactive { background: #1e293b; color: #475569; }

.row-actions { display: flex; gap: 6px; }
.action-btn { width: 32px; height: 32px; border-radius: 7px; border: 1px solid #334155; background: #0f172a; color: #94a3b8; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.edit-btn:hover { border-color: #3b82f6; color: #60a5fa; }
.deactivate-btn:hover { border-color: #ef4444; color: #ef4444; }
.activate-btn:hover { border-color: #10b981; color: #34d399; }
.empty-row { text-align: center; color: #475569; padding: 40px !important; }

.loading-state { display: flex; justify-content: center; padding: 60px 0; }

/* Paginação */
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 28px; }
.page-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.page-btn:hover:not(:disabled) { border-color: #3b82f6; color: #60a5fa; }
.page-btn:disabled { opacity: 0.35; cursor: default; }
.page-info { font-size: 14px; color: #64748b; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 720px; max-height: 90vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #334155; }
.modal-header h2 { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0; }
.modal-close { background: none; border: none; color: #64748b; font-size: 16px; cursor: pointer; padding: 4px; border-radius: 6px; }
.modal-close:hover { color: #f1f5f9; }
.modal-body { overflow-y: auto; padding: 20px 24px; flex: 1; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid #334155; }

.form-error-alert { background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 10px 14px; color: #f43f5e; font-size: 13px; margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; font-weight: 600; color: #94a3b8; }
.form-group.span-2 { grid-column: span 2; }
.form-input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 9px 12px; font-size: 14px; color: #f1f5f9; outline: none; font-family: inherit; transition: border-color 0.15s; width: 100%; }
.form-input:focus { border-color: #2563eb; }
.form-textarea { resize: vertical; font-family: 'Courier New', monospace; font-size: 12px; }
.price-preview { font-size: 12px; color: #34d399; font-weight: 600; }

.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; cursor: pointer; user-select: none; }
.checkbox-label input { accent-color: #2563eb; cursor: pointer; }

.size-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; }
.size-check { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #94a3b8; cursor: pointer; }
.size-check input { accent-color: #2563eb; }

.numeric-input-wrap { display: flex; flex-direction: column; gap: 4px; }

.stock-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.stock-item { display: flex; align-items: center; gap: 6px; }
.stock-size-label { font-size: 12px; font-weight: 700; color: #94a3b8; width: 28px; }
.stock-input { width: 70px; padding: 7px 10px; text-align: center; }

.help-text { font-size: 11px; color: #64748b; padding-left: 2px; }

.cancel-btn { padding: 9px 20px; background: transparent; border: 1px solid #334155; color: #94a3b8; border-radius: 8px; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.cancel-btn:hover { border-color: #475569; color: #f1f5f9; }
.save-btn { padding: 9px 24px; background: #2563eb; border: none; color: #fff; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; min-width: 140px; }
.save-btn:hover:not(:disabled) { background: #1d4ed8; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Seção de imagens */
.image-upload-section,
.image-urls-section {
  margin-bottom: 20px;
  padding: 12px;
  background: #0f172a;
  border-radius: 10px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 6px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #cbd5e1;
}

.section-hint {
  font-size: 11px;
  color: #64748b;
}

.urls-help {
  margin-top: 8px;
}

.help-text {
  font-size: 11px;
  color: #475569;
}

/* Preview */
.image-preview-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #0f172a;
  border: 2px solid #334155;
  transition: all 0.15s;
}

.image-preview-item.is-main {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s;
}

.image-preview-item:hover .preview-overlay {
  opacity: 1;
}

.main-badge {
  background: #3b82f6;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}

.preview-remove {
  background: #ef4444;
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.preview-remove:hover {
  background: #dc2626;
}
</style>