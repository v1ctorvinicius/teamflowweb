<template>
  <div class="admin-page">
    <main class="main">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Produtos</h1>
          <p class="page-sub">48 produtos cadastrados</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="showCategoryModal = true">
            <i class="ti ti-tag" aria-hidden="true" style="font-size:13px"></i>
            Categorias
          </button>
          <button class="btn-primary" @click="openCreate">
            <i class="ti ti-plus" aria-hidden="true" style="font-size:14px"></i>
            Novo produto
          </button>
        </div>
      </div>


      <div class="filters">
        <div class="search-wrap">
          <i class="pi pi-search search-icon" />
          <input v-model="clubFilter" type="text" placeholder="Buscar por clube..." class="search-input"
            @input="onFilterChange" />
        </div>
        <div class="type-filters">
          <button v-for="opt in typeOptions" :key="opt.value ?? 'all'" class="type-chip"
            :class="{ active: typeFilter === opt.value }" @click="typeFilter = opt.value; onFilterChange()">{{ opt.label
            }}</button>
        </div>
        <label class="show-inactive">
          <input type="checkbox" v-model="showInactive" @change="onFilterChange" />
          Mostrar inativos
        </label>
      </div>


      <div class="table-wrap">
        <div v-if="loading" class="loading-state">
          <ProgressSpinner strokeWidth="3" />
        </div>

        <table v-else class="products-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Clube</th>
              <th>Marca</th>
              <th>Tipo</th>
              <th>Temporada</th>
              <th>Preço</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p.id" :class="{ 'row-inactive': !p.isActive }">
              <td>
                <div class="product-cell">
                  <img :src="p.imageUrl || placeholder" :alt="p.name" class="thumb" />
                  <span class="product-cell-name">{{ p.name }}</span>
                </div>
              </td>
              <td v-if="p.club">{{ p.club }}</td>
              <td v-else style="text-align: center;">-</td>
              <td v-if="p.brand">{{ p.brand }}</td>
              <td v-else style="text-align: center;">-</td>
              <td v-if="p.type">
                <span class="type-badge" :class="p.type === 'PLAYER' ? 'badge-player' : 'badge-fan'">
                  {{ p.type === 'PLAYER' ? 'Jogador' : 'Torcedor' }}
                </span>
              </td>
              <td v-else style="text-align: center;">
                <span>-</span>
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
                  <button class="action-btn" :class="p.isActive ? 'deactivate-btn' : 'activate-btn'"
                    @click="toggleActive(p)" :title="p.isActive ? 'Desativar' : 'Reativar'">
                    <i :class="p.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="8" class="empty-row">Nenhum produto encontrado</td>
            </tr>
          </tbody>
        </table>
      </div>


      <div v-if="pagination.totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="pagination.page <= 1" @click="fetchProducts(pagination.page - 1)">
          <i class="pi pi-chevron-left" /> Anterior
        </button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button class="page-btn" :disabled="pagination.page >= pagination.totalPages"
          @click="fetchProducts(pagination.page + 1)">
          Próxima <i class="pi pi-chevron-right" />
        </button>
      </div>
    </main>

    <!-- Modal de Categorias -->
    <div v-if="showCategoryModal" class="modal-overlay" @click="showCategoryModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Gerenciar Categorias</h2>
          <button class="close-btn" @click="showCategoryModal = false"><i class="pi pi-times" /></button>
        </div>
        <div class="modal-body">
          <div class="categories-list">
            <div v-for="cat in categories" :key="cat.slug" class="category-item">
              <span>{{ cat.icon }} {{ cat.label }}</span>
              <span class="category-slug">{{ cat.slug }}</span>
            </div>
          </div>
          <div class="form-group" style="margin-top: 20px">
            <label>Nova Categoria</label>
            <div class="new-category-row">
              <input v-model="newCategory.icon" class="form-input" placeholder="Emoji" style="max-width: 70px" />
              <input v-model="newCategory.label" class="form-input" placeholder="Nome (ex: Acessórios)" />
            </div>
          </div>
          <p v-if="categoryError" class="error-msg">{{ categoryError }}</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showCategoryModal = false">Fechar</button>
          <button class="save-btn" :disabled="savingCategory" @click="saveNewCategory">
            {{ savingCategory ? 'Criando...' : 'Criar Categoria' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Produto -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingProduct ? 'Editar produto' : 'Novo produto' }}</h2>
          <button class="modal-close" @click="closeModal"><i class="pi pi-times" /></button>
        </div>

        <div class="modal-body">
          <div v-if="formError" class="form-error-alert">{{ formError }}</div>

          <div class="form-grid">
            <div class="form-group span-2">
              <label>Nome do produto *</label>
              <input v-model="form.name" class="form-input" placeholder="Ex: Camisa Titular 2024" />
            </div>

            <div class="form-group">
              <label>Clube</label>
              <select v-model="form.club" class="form-input">
                <option value="">— Nenhum (produto geral) —</option>
                <option v-for="c in clubs" :key="c.id" :value="c.name">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Marca</label>
              <input v-model="form.brand" class="form-input" placeholder="Ex: Nike, Adidas, Umbro" />
            </div>

            <div class="form-group">
              <label>Temporada *</label>
              <input v-model="form.season" class="form-input" placeholder="Ex: 2024/2025" />
            </div>

            <div class="form-group">
              <label>Tipo *</label>
              <select v-model="form.type" class="form-input">
                <option :value="null">— Nenhum —</option>
                <option value="FAN">Torcedor</option>
                <option value="PLAYER">Jogador</option>
              </select>
            </div>

            <div class="form-group">
              <label>Categoria</label>
              <select v-model="form.categorySlug" class="form-input">
                <option value="">Selecione</option>
                <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
                  {{ cat.icon }} {{ cat.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Preço (em centavos) *</label>
              <input v-model.number="form.basePrice" type="number" min="0" class="form-input"
                placeholder="Ex: 18990 = R$ 189,90" />
              <span class="price-preview" v-if="form.basePrice > 0">{{ formatPrice(form.basePrice) }}</span>
            </div>

            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.enableCategoricalSizes" />
                Habilitar tamanhos categóricos (PP, P, M, G, GG, etc)
              </label>
            </div>

            <template v-if="form.enableCategoricalSizes">
              <div class="form-group">
                <label>Label para tamanhos categóricos</label>
                <input v-model="form.categoricalSizesLabel" class="form-input" placeholder="Ex: Tamanho" />
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
                    <input v-model.number="form.stockCategoricalBySize[s]" type="number" min="0"
                      class="form-input stock-input" placeholder="0" />
                  </div>
                </div>
              </div>
            </template>

            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.enableNumericSizes" />
                Habilitar tamanhos numéricos (36, 37, 38, etc)
              </label>
            </div>

            <template v-if="form.enableNumericSizes">
              <div class="form-group">
                <label>Label para tamanhos numéricos</label>
                <input v-model="form.numericSizesLabel" class="form-input" placeholder="Ex: Tamanho, Número" />
              </div>

              <div class="form-group span-2">
                <label>Tamanhos numéricos disponíveis *</label>
                <div class="numeric-input-wrap">
                  <input v-model="numericSizesInput" type="text" class="form-input"
                    placeholder="Ex: 36,37,38,39,40,41,42,43,44" />
                  <span class="help-text">Separe por vírgula</span>
                </div>
              </div>

              <div class="form-group span-2">
                <label>Estoque por tamanho numérico</label>
                <div class="stock-grid">
                  <div v-for="size in Object.keys(form.stockNumeric).sort((a, b) => Number(a) - Number(b))" :key="size"
                    class="stock-item">
                    <span class="stock-size-label">{{ size }}</span>
                    <input v-model.number="form.stockNumeric[size]" type="number" min="0" class="form-input stock-input"
                      placeholder="0" />
                  </div>
                </div>
              </div>
            </template>

            <div class="form-group span-2">
              <label>Imagens do Produto</label>

              <div class="image-upload-section">
                <div class="section-header">
                  <span class="section-title">📁 Upload de arquivos</span>
                  <span class="section-hint">Arraste ou clique para enviar imagens</span>
                </div>
                <ImageUploader ref="imageUploaderRef" @uploaded="handleImageUpload" v-model="form.imageUrls" />
              </div>

              <div class="image-urls-section">
                <div class="section-header">
                  <span class="section-title">🔗 URLs manuais</span>
                  <span class="section-hint">Uma URL por linha — a primeira será a imagem principal</span>
                </div>
                <textarea v-model="imageUrlsInput" class="form-input form-textarea"
                  placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg&#10;https://exemplo.com/imagem3.jpg"
                  rows="4" />
                <div class="urls-help">
                  <span class="help-text">💡 Dica: Use o upload para não precisar digitar as URLs</span>
                </div>
              </div>

              <div v-if="imageUrlsArray.length > 0" class="image-preview-section">
                <div class="section-header">
                  <span class="section-title">🖼️ Preview</span>
                  <span class="section-hint">{{ imageUrlsArray.length }} imagem(ens)</span>
                </div>
                <div class="image-preview-grid">
                  <div v-for="(url, index) in imageUrlsArray" :key="index" class="image-preview-item"
                    :class="{ 'is-main': index === 0 }">
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

            <div class="form-group span-2">
              <label>Descrição</label>
              <textarea v-model="form.description" class="form-input form-textarea" placeholder="Descreva o produto..."
                rows="3" />
            </div>

            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isFeatured" />
                ⭐ Destaque (aparece na seção de destaques)
              </label>
            </div>

            <div class="form-group span-2">
              <label>Gênero</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" value="UNISEX" v-model="form.gender" />
                  Unissex
                </label>
                <label class="radio-label">
                  <input type="radio" value="MASCULINE" v-model="form.gender" />
                  ♂ Masculino
                </label>
                <label class="radio-label">
                  <input type="radio" value="FEMININE" v-model="form.gender" />
                  ♀ Feminino
                </label>
              </div>
            </div>

            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.allowPersonalization" />
                ✏️ Permitir personalização (nome + número na camisa)
              </label>
            </div>

            <div class="form-group span-2">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.infiniteStock" />
                ♾️ Estoque infinito (dropshipping — não exibir "Esgotado")
              </label>
            </div>

            <div class="form-group span-2">
              <label>Badge "🔥 Novo"</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" :value="null" v-model="form.isNew" />
                  Automático (últimos
                  <input v-if="form.isNew === null" v-model.number="form.isNewDays" type="number" min="1" max="90"
                    class="form-input inline-input" style="width: 56px; display: inline-block; padding: 2px 6px;" />
                  dias)
                </label>
                <label class="radio-label">
                  <input type="radio" :value="true" v-model="form.isNew" />
                  Sempre mostrar
                </label>
                <label class="radio-label">
                  <input type="radio" :value="false" v-model="form.isNew" />
                  Nunca mostrar
                </label>
              </div>
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
import { productsService } from '@/services/products'
import ProgressSpinner from 'primevue/progressspinner'
import type { Product, ProductCategoryDef } from '@/types'
import ImageUploader from '@/components/ImageUploader.vue'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const { user } = authStore

const products = ref<Product[]>([])
const loading = ref(true)
const pagination = ref({ page: 1, limit: 50, total: 0, totalPages: 0 })
const clubs = ref<Club[]>([])
const categories = ref<ProductCategoryDef[]>([])
const showCategoryModal = ref(false)
const newCategory = ref({ label: '', icon: '', sortOrder: 99 })
const savingCategory = ref(false)
const categoryError = ref('')

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

const toast = useToast();

interface FormData {
  name: string
  club: string
  brand: string
  season: string
  type: 'FAN' | 'PLAYER'
  category: string
  categorySlug: string
  gender: 'MASCULINE' | 'FEMININE' | 'UNISEX'
  allowPersonalization: boolean
  infiniteStock: boolean
  isNew: boolean | null
  isNewDays: number
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

const emptyForm = (): FormData => ({
  name: '',
  club: '',
  brand: '',
  season: '',
  type: null as 'PLAYER' | 'FAN' | null,
  category: '',
  categorySlug: '',
  gender: 'UNISEX',
  allowPersonalization: false,
  infiniteStock: false,
  isNew: null,
  isNewDays: 14,
  enableCategoricalSizes: true,
  categoricalSizesLabel: 'Tamanho',
  stockCategorical: [],
  stockCategoricalBySize: {},
  enableNumericSizes: false,
  numericSizesLabel: 'Tamanho',
  stockNumeric: {},
  basePrice: 0,
  description: '',
  imageUrl: '',
  imageUrls: [],
  isFeatured: false,
})

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

const imageUrlsArray = computed(() => {
  return imageUrlsInput.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0)
})

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
  toast.add({
    severity: 'info',
    summary: p.isActive ? 'Produto ativado' : 'Produto desativado',
    detail: p.name,
    life: 2500,
  })
}
function handleImageUpload(urls: string[]) {
  const existingUrls = imageUrlsInput.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0)

  const allUrls = [...existingUrls, ...urls]
  imageUrlsInput.value = allUrls.join('\n')
}

function removeImageUrl(index: number) {
  const urls = imageUrlsArray.value
  urls.splice(index, 1)
  imageUrlsInput.value = urls.join('\n')
}

function handleImageError(index: number) {
  console.warn(`Image failed to load at index ${index}`)
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

  if (p.imageUrl && imageUrls.length === 0) {
    imageUrls.push(p.imageUrl)
  }

  const stockCategoricalBySize = normalizeObject(p.stockCategoricalBySize) ?? {}
  const stockNumeric = normalizeObject(p.stockNumeric) ?? {}

  form.value = {
    name: p.name,
    club: p.club ?? '',
    brand: p.brand ?? '',
    season: p.season ?? '',
    type: p.type || null,
    category: p.category ?? 'SHIRT',
    categorySlug: p.categorySlug ?? '',
    gender: p.gender || 'UNISEX',
    allowPersonalization: p.allowPersonalization ?? false,
    infiniteStock: p.infiniteStock ?? false,
    isNew: p.isNew ?? null,
    isNewDays: p.isNewDays ?? 14,
    enableCategoricalSizes: p.enableCategoricalSizes ?? false,
    categoricalSizesLabel: p.categoricalSizesLabel ?? 'Tamanho',
    stockCategorical: p.stockCategorical ?? [],
    stockCategoricalBySize: stockCategoricalBySize,
    enableNumericSizes: p.enableNumericSizes ?? false,
    numericSizesLabel: p.numericSizesLabel ?? 'Tamanho',
    stockNumeric: stockNumeric,
    basePrice: p.basePrice,
    description: p.description ?? '',
    imageUrl: p.imageUrl ?? '',
    imageUrls: imageUrls,
    isFeatured: p.isFeatured ?? false,
  }

  imageUrlsInput.value = imageUrls.join('\n')
  numericSizesInput.value = Object.keys(stockNumeric)
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
  if (!form.value.name || !form.value.season || !form.value.brand) {
    formError.value = 'Preencha todos os campos obrigatórios (Nome, Marca e Temporada).';
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail: formError.value || 'Tente novamente.',
      life: 4000,
    })

    return
  }

  if (imageUploaderRef.value) {
    const uploadSuccess = await imageUploaderRef.value.savePendingUploads()
    if (!uploadSuccess) {
      saving.value = false
      toast.add({
        severity: 'error',
        summary: 'Erro ao salvar',
        detail: 'Tente novamente.',
        life: 4000,
      })
      return
    }
  }

  const imageUrls = form.value.imageUrls || []
  const imageUrl = imageUrls[0] || null

  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      club: form.value.club || null,
      brand: form.value.brand,
      season: form.value.season,
      type: form.value.type,
      category: form.value.category,
      categorySlug: form.value.categorySlug || undefined,
      gender: form.value.gender || 'UNISEX',
      allowPersonalization: form.value.allowPersonalization ?? false,
      infiniteStock: form.value.infiniteStock ?? false,
      isNew: form.value.isNew ?? null,
      isNewDays: form.value.isNewDays ?? 14,
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
      toast.add({
        severity: 'success',
        summary: editingProduct.value ? 'Produto atualizado' : 'Produto criado',
        detail: editingProduct.value
          ? `${form.value.name} foi atualizado com sucesso.`
          : `${form.value.name} foi criado com sucesso.`,
        life: 3000,
      })
    } else {
      const created = await adminService.createProduct(payload)
      products.value.unshift(created)
    }
    // closeModal()
    await fetchProducts(pagination.value.page)
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail: err.response?.data?.message || 'Tente novamente.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

async function saveNewCategory() {
  if (!newCategory.value.label.trim()) {
    categoryError.value = 'Nome é obrigatório'
    return
  }
  savingCategory.value = true
  categoryError.value = ''
  try {
    await adminService.createCategory(newCategory.value)
    const updated = await productsService.getCategories()
    categories.value = updated
    newCategory.value = { label: '', icon: '', sortOrder: 99 }
    showCategoryModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Categoria criada',
      detail: `"${newCategory.value.label}" foi adicionada.`,
      life: 3000,
    })
  } catch (err: any) {
    categoryError.value = err.response?.data?.message || 'Erro ao criar categoria'

    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail: categoryError.value,
      life: 4000,
    })
  } finally {
    savingCategory.value = false
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

async function loadCategories() {
  try {
    categories.value = await productsService.getCategories()
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    clubsService.list().then((c) => { clubs.value = c }),
    loadCategories(),
  ])
})
</script>

<style scoped>
/* ── Raiz ─────────────────────────────────────────────────── */
.admin-page {
  min-height: 100vh;
  background: #0d1117;
  color: #f0f6fc;
  font-family: inherit;
}

/* ── Navbar ──────────────────────────────────────────────── */
.navbar {
  background: #161b22;
  border-bottom: 1px solid #2d3748;
  height: 52px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-inner {
  max-width: 1400px;
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
}

.brand-icon {
  font-size: 18px;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: #f0f6fc;
}

.admin-badge {
  background: #1f1635;
  border: 1px solid #3d2b75;
  color: #a371f7;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: .4px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 12px;
  color: #484f58;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #2d3748;
}

/* Botões da navbar */
.back-btn,
.logout-btn,
.create-btn.secondary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  background: transparent;
  border: 1px solid #2d3748;
  border-radius: 7px;
  color: #8b949e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: border-color .15s, color .15s;
}

.back-btn:hover,
.create-btn.secondary:hover {
  border-color: #3d4f68;
  color: #f0f6fc;
}

.logout-btn:hover {
  border-color: #5a1a18;
  color: #f85149;
}

/* ── Main ────────────────────────────────────────────────── */
.main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

/* Page header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.header-left {}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 2px
}

.page-sub {
  font-size: 12px;
  color: var(--text-muted)
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  background: var(--blue);
  border: none;
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s
}

.btn-primary:hover {
  background: #1c7cef
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color .15s, color .15s
}

.btn-secondary:hover {
  border-color: var(--purple-border);
  color: var(--purple);
  background: var(--purple-bg)
}

/* ── Filtros ─────────────────────────────────────────────── */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: #484f58;
  font-size: 13px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  background: #1c2330;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 0 12px 0 32px;
  font-size: 13px;
  color: #f0f6fc;
  outline: none;
  transition: border-color .15s;
}

.search-input::placeholder {
  color: #484f58;
}

.search-input:focus {
  border-color: #388bfd;
}

.type-filters {
  display: flex;
  gap: 6px;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #2d3748;
  background: #1c2330;
  color: #8b949e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}

.type-chip:hover {
  border-color: #3d4f68;
  color: #f0f6fc;
}

.type-chip.active {
  background: #0d2240;
  border-color: #1f4280;
  color: #388bfd;
}

.show-inactive {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8b949e;
  cursor: pointer;
  user-select: none;
}

.show-inactive input {
  accent-color: #388bfd;
  cursor: pointer;
}

/* ── Tabela ──────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border: 1px solid #2d3748;
  border-radius: 12px;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table thead tr {
  background: #1c2330;
}

.products-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  color: #484f58;
  text-transform: uppercase;
  letter-spacing: .6px;
  border-bottom: 1px solid #2d3748;
  white-space: nowrap;
}

.products-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #1e2d3d;
  font-size: 13px;
  color: #8b949e;
  vertical-align: middle;
}

.products-table tr:last-child td {
  border-bottom: none;
}

.products-table tbody tr:hover td {
  background: #222a38;
}

.row-inactive td {
  opacity: .4;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  background: #1c2330;
  border: 1px solid #2d3748;
  flex-shrink: 0;
}

.product-cell-name {
  font-weight: 600;
  color: #f0f6fc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

/* Badges — alinhados com o sistema */
.type-badge,
.status-badge {
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

.badge-player {
  background: #1f1635;
  border: 1px solid #3d2b75;
  color: #a371f7;
}

.badge-fan {
  background: #0a2522;
  border: 1px solid #0e3d38;
  color: #3fb950;
}

.badge-none {
  background: #1e293b;
  border: 1px solid #334155;
  color: #475569;
}

.status-active {
  background: #0a2522;
  border: 1px solid #0e3d38;
  color: #3fb950;
}

.status-inactive {
  background: #222a38;
  border: 1px solid #2d3748;
  color: #484f58;
}

/* Ações de linha */
.row-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #2d3748;
  background: transparent;
  border-radius: 6px;
  color: #484f58;
  font-size: 13px;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}

.edit-btn:hover {
  border-color: #1f4280;
  color: #388bfd;
}

.deactivate-btn:hover {
  border-color: #5a1a18;
  color: #f85149;
}

.activate-btn:hover {
  border-color: #0e3d38;
  color: #3fb950;
}

.empty-row {
  text-align: center;
  color: #484f58;
  padding: 48px 0 !important;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

/* ── Paginação ───────────────────────────────────────────── */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 14px;
  background: #1c2330;
  border: 1px solid #2d3748;
  color: #8b949e;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}

.page-btn:hover:not(:disabled) {
  border-color: #1f4280;
  color: #388bfd;
}

.page-btn:disabled {
  opacity: .3;
  cursor: default;
}

.page-info {
  font-size: 12px;
  color: #484f58;
  min-width: 50px;
  text-align: center;
}

/* ── Modal ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #161b22;
  border: 1px solid #2d3748;
  border-radius: 14px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #2d3748;
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: #f0f6fc;
  margin: 0;
}

.close-btn,
.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #484f58;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.close-btn:hover,
.modal-close:hover {
  color: #f0f6fc;
  background: #222a38;
}

.modal-body {
  overflow-y: auto;
  padding: 18px 20px;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #2d3748;
  flex-shrink: 0;
}

/* ── Formulário ──────────────────────────────────────────── */
.form-error-alert {
  background: #2a0f0e;
  border: 1px solid #5a1a18;
  border-radius: 8px;
  padding: 10px 14px;
  color: #f85149;
  font-size: 12px;
  margin-bottom: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 11px;
  font-weight: 700;
  color: #484f58;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.form-group.span-2 {
  grid-column: span 2;
  background-color: #0d1117;
  padding: 1.5%;
  border-radius: 10px
}

.form-input {
  height: 38px;
  background: #1c2330;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
  color: #f0f6fc;
  outline: none;
  font-family: inherit;
  transition: border-color .15s;
  width: 100%;
}

.form-input::placeholder {
  color: #484f58;
}

.form-input:focus {
  border-color: #388bfd;
}

select.form-input {
  cursor: pointer;
}

.form-textarea {
  height: auto;
  resize: vertical;
  padding: 10px 12px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
}

.price-preview {
  font-size: 11px;
  color: #3fb950;
  font-weight: 600;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #8b949e;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input {
  accent-color: #388bfd;
  cursor: pointer;
}

/* Tamanhos */
.size-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.size-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8b949e;
  cursor: pointer;
  padding: 4px 8px;
  border: 1px solid #2d3748;
  border-radius: 6px;
  background: #1c2330;
}

.size-check input {
  accent-color: #388bfd;
}

/* Seção de tamanho/imagens com fundo diferenciado */
.image-upload-section,
.image-urls-section {
  background: #1c2330;
  border: 1px solid #1e2d3d;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 4px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #8b949e;
}

.section-hint {
  font-size: 10px;
  color: #484f58;
}

.urls-help {
  margin-top: 6px;
}

.help-text {
  font-size: 10px;
  color: #484f58;
}

/* Numeric input */
.numeric-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Stock grid */
.stock-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stock-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stock-size-label {
  font-size: 11px;
  font-weight: 700;
  color: #8b949e;
  width: 28px;
}

.stock-input {
  width: 64px;
  height: 34px;
  text-align: center;
  padding: 0 8px;
}

/* Image preview */
.image-preview-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #1e2d3d;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.image-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid #2d3748;
  background: #0d1117;
}

.image-preview-item.is-main {
  border-color: #388bfd;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, .6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity .15s;
}

.image-preview-item:hover .preview-overlay {
  opacity: 1;
}

.main-badge {
  background: #388bfd;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
}

.preview-remove {
  background: #2a0f0e;
  border: 1px solid #5a1a18;
  color: #f85149;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
}

/* Botões do modal */
.cancel-btn {
  height: 36px;
  padding: 0 16px;
  background: transparent;
  border: 1px solid #2d3748;
  color: #8b949e;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}

.cancel-btn:hover {
  border-color: #3d4f68;
  color: #f0f6fc;
}

.save-btn {
  height: 36px;
  padding: 0 20px;
  background: #388bfd;
  border: none;
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-width: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s;
}

.save-btn:hover:not(:disabled) {
  background: #1c7cef;
}

.save-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, .25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}


.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  cursor: pointer;
  accent-color: #2563eb;
}

.inline-input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #f1f5f9;
  font-size: 12px;
}

/* ── Categorias modal ────────────────────────────────────── */
.categories-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1c2330;
  border: 1px solid #2d3748;
  border-radius: 8px;
  font-size: 13px;
  color: #8b949e;
}

.category-slug {
  font-size: 11px;
  color: #484f58;
  font-family: monospace;
}

.new-category-row {
  display: flex;
  gap: 8px;
}

.error-msg {
  font-size: 12px;
  color: #f85149;
  margin-top: 6px;
}

/* ── Responsivo ──────────────────────────────────────────── */
@media (max-width: 600px) {
  .navbar-inner {
    padding: 0 12px;
  }

  .user-name {
    display: none;
  }

  .main {
    padding: 16px 12px 40px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.span-2 {
    grid-column: span 1;
  }

  .product-cell-name {
    max-width: 130px;
  }

  /* Esconde colunas menos importantes em telas pequenas */
  .products-table th:nth-child(3),
  .products-table td:nth-child(3),
  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    display: none;
  }
}
</style>