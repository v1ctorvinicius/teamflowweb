<template>
  <div class="detail-page">
    <!-- Navbar -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="back-link">
          <i class="pi pi-arrow-left" /> Voltar
        </router-link>
        <div class="brand">⚽ TeamFlow</div>
        <div class="spacer" />
      </div>
    </header>

    <main class="main">
      <div v-if="loading" class="loading-state">
        <ProgressSpinner strokeWidth="3" />
      </div>

      <div v-else-if="product" class="content-grid">
        <!-- Galeria de imagens -->
        <div class="gallery-section">
          <div class="main-image">
            <img :src="selectedImageUrl" :alt="product.name" />
            <div v-if="product.isFeatured" class="badge-featured">⭐ Destaque</div>
          </div>

          <!-- Thumbnails -->
          <div v-if="product.imageUrls.length > 1" class="thumbnails">
            <button
              v-for="(url, idx) in product.imageUrls"
              :key="idx"
              class="thumbnail"
              :class="{ active: selectedImageIdx === idx }"
              @click="selectedImageIdx = idx"
            >
              <img :src="url" :alt="`Imagem ${idx + 1}`" />
            </button>
          </div>
        </div>

        <!-- Informações do produto -->
        <div class="info-section">
          <div class="header">
            <h1 class="name">{{ product.name }}</h1>
            <p class="club">{{ product.club }}</p>
            <p class="season">Temporada {{ product.season }}</p>
          </div>

          <div class="price-section">
            <span class="label">Preço</span>
            <span class="price">{{ formatPrice(product.basePrice) }}</span>
          </div>

          <!-- Seletor de tamanho dinâmico -->
          <div class="size-section">
            <label class="label">
              {{ product.enableCategoricalSizes ? product.categoricalSizesLabel : product.numericSizesLabel }}
            </label>

            <!-- Sistema 1: Tamanhos categóricos (P, M, G) -->
            <div v-if="product.enableCategoricalSizes" class="size-selector">
              <button
                v-for="size in product.stockCategorical"
                :key="size"
                class="size-btn"
                :class="{ active: selectedSize === size }"
                :disabled="(product.stockCategoricalBySize[size] ?? 0) === 0"
                @click="selectedSize = size"
              >
                {{ size }}
              </button>
            </div>

            <!-- Sistema 2: Tamanhos numéricos (34, 35, 36) -->
            <div v-else-if="product.enableNumericSizes" class="size-selector">
              <button
                v-for="size in numericSizesArray"
                :key="size"
                class="size-btn"
                :class="{ active: selectedSize === size }"
                :disabled="(product.stockNumeric[size] ?? 0) === 0"
                @click="selectedSize = size"
              >
                {{ size }}
              </button>
            </div>

            <!-- Nenhum sistema ativado -->
            <div v-else class="no-sizes">
              <p>Tamanhos não disponíveis</p>
            </div>
          </div>

          <!-- 🔥 PERSONALIZAÇÃO: Nome + Número -->
          <div class="customization-section">
            <label class="label">Personalização (opcional)</label>
            <div class="customization-grid">
              <div class="custom-field">
                <input
                  v-model="customName"
                  type="text"
                  class="custom-input"
                  placeholder="Nome (ex: FULANO)"
                  maxlength="12"
                />
                <span class="field-hint">Máx. 12 caracteres</span>
              </div>
              <div class="custom-field">
                <input
                  v-model="customNumber"
                  type="number"
                  class="custom-input"
                  placeholder="Número (ex: 10)"
                  min="0"
                  max="99"
                />
                <span class="field-hint">Número de 0 a 99</span>
              </div>
            </div>
            <div v-if="hasCustomization" class="customization-preview">
              <span class="preview-badge">
                {{ customName ? customName : 'NOME' }} 
                {{ customNumber ? `#${customNumber}` : '#00' }}
              </span>
              <span class="preview-info">+ R$ 49,90</span>
            </div>
          </div>

          <!-- Descrição -->
          <div v-if="product.description" class="description-section">
            <label class="label">Descrição</label>
            <p class="description">{{ product.description }}</p>
          </div>

          <!-- Botão WhatsApp -->
          <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="whatsapp-btn-lg">
            <i class="pi pi-send" />
            Comprar via WhatsApp
          </a>

          <!-- Compartilhar -->
          <button class="share-btn" @click="handleShare">
            <i class="pi pi-share-alt" />
            Compartilhar
          </button>
          <p v-if="shareToast" class="share-toast">{{ shareToast }}</p>
        </div>
      </div>

      <div v-else class="not-found">
        <p>Produto não encontrado</p>
        <router-link to="/" class="back-link">Voltar ao catálogo</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { productsService } from '@/services/products'
import ProgressSpinner from 'primevue/progressspinner'
import type { Product } from '@/types'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5598900000000'
const CUSTOMIZATION_PRICE = 4990 // R$ 49,90 em centavos
const APP_BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin

const route = useRoute()
const product = ref<Product | null>(null)
const loading = ref(true)

const selectedImageIdx = ref(0)
const selectedSize = ref<string>('')
const shareToast = ref('')

// 🔥 Novos campos de personalização
const customName = ref('')
const customNumber = ref<number | null>(null)

const hasCustomization = computed(() => !!customName.value || !!customNumber.value)
const finalPrice = computed(() => {
  if (!product.value) return 0
  return product.value.basePrice + (hasCustomization.value ? CUSTOMIZATION_PRICE : 0)
})

const selectedImageUrl = computed(() =>
  product.value?.imageUrls?.[selectedImageIdx.value] || product.value?.imageUrl || ''
)

const numericSizesArray = computed<string[]>(() =>
  product.value?.enableNumericSizes ? Object.keys(product.value.stockNumeric || {}) : []
)

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const getStock = (size: string): number => {
  if (!product.value) return 0
  if (product.value.enableCategoricalSizes) {
    return product.value.stockCategoricalBySize?.[size] ?? 0
  } else if (product.value.enableNumericSizes) {
    return product.value.stockNumeric?.[size] ?? 0
  }
  return 0
}

const whatsappUrl = computed(() => {
  if (!product.value) {
    return `https://wa.me/${WHATSAPP_NUMBER}`
  }

  const hasStock = selectedSize.value && getStock(selectedSize.value) > 0
  const isOutOfStock = !selectedSize.value || getStock(selectedSize.value) === 0

  let msg = ''

  // Monta a personalização se houver
  let customizationLine = ''
  if (hasCustomization.value) {
    const namePart = customName.value ? `Nome: ${customName.value.toUpperCase()}` : ''
    const numberPart = customNumber.value ? `Número: ${customNumber.value}` : ''
    customizationLine = `\n*Personalização:* ${[namePart, numberPart].filter(Boolean).join(' | ')}`
  }

  if (hasStock) {
    msg = `Olá! Tenho interesse na camisa:\n\n` +
      `*${product.value.name}*\n` +
      `Time: ${product.value.club} | Temporada: ${product.value.season}\n` +
      `Tamanho: ${selectedSize.value}${customizationLine}\n` +
      `Preço: ${formatPrice(finalPrice.value)}\n\n` +
      `Poderia me dar mais informações?`
  } else if (isOutOfStock) {
    const requestedSize = selectedSize.value || 'não especificado'
    msg = `Olá! Gostaria de saber sobre disponibilidade futura:\n\n` +
      `*${product.value.name}*\n` +
      `Time: ${product.value.club} | Temporada: ${product.value.season}\n` +
      `Tamanho: ${requestedSize}${customizationLine}\n\n` +
      `🔴 Produto esgotado no momento.\n` +
      `É possível fazer um pedido especial para a fabricante? Aguardo retorno.`
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
})

const shareUrl = computed(() =>
  product.value?.slug
    ? `${APP_BASE_URL}/produto/${product.value.slug}`
    : `${APP_BASE_URL}/products/${product.value?.id}`
)

async function handleShare() {
  if (navigator.share && shareUrl.value) {
    try {
      await navigator.share({
        title: product.value?.name,
        text: `${product.value?.name} — ${product.value?.club} | ${formatPrice(product.value?.basePrice || 0)}`,
        url: shareUrl.value,
      })
    } catch { /* usuário cancelou */ }
  } else if (shareUrl.value) {
    try {
      await navigator.clipboard.writeText(shareUrl.value)
      shareToast.value = '🔗 Link copiado!'
    } catch {
      shareToast.value = '❌ Não foi possível copiar'
    }
    setTimeout(() => { shareToast.value = '' }, 2500)
  }
}

onMounted(async () => {
  const id = route.params.id as string
  const slug = route.params.slug as string

  if (!id && !slug) {
    loading.value = false
    return
  }

  try {
    let rawProduct

    if (slug) {
      rawProduct = await productsService.getBySlug(slug)
    } else if (id) {
      rawProduct = await productsService.getById(id)
    }

    if (!rawProduct) {
      loading.value = false
      return
    }

    product.value = rawProduct

    // Seleciona o primeiro tamanho disponível
    if (product.value.enableCategoricalSizes && product.value.stockCategorical.length > 0) {
      const availableSize = product.value.stockCategorical.find(
        size => (product.value!.stockCategoricalBySize[size] ?? 0) > 0
      )
      if (availableSize) selectedSize.value = availableSize
    } else if (product.value.enableNumericSizes && Object.keys(product.value.stockNumeric).length > 0) {
      const availableSize = Object.keys(product.value.stockNumeric).find(
        size => (product.value!.stockNumeric[size] ?? 0) > 0
      )
      if (availableSize) selectedSize.value = availableSize
    }
  } catch (error) {
    console.error('Failed to load product:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #0f172a; color: #f1f5f9; }

.navbar { background: #1e293b; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 50; }
.navbar-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; height: 60px; display: flex; align-items: center; gap: 16px; }
.back-link { display: flex; align-items: center; gap: 6px; color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 600; }
.back-link:hover { color: #f1f5f9; }
.brand { flex: 1; text-align: center; font-size: 16px; font-weight: 700; }
.spacer { width: 100px; }

.main { max-width: 1280px; margin: 0 auto; padding: 32px 24px 48px; }

.loading-state { display: flex; justify-content: center; padding: 80px 0; }

.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }

/* Gallery */
.gallery-section { display: flex; flex-direction: column; gap: 12px; }
.main-image { position: relative; aspect-ratio: 1/1; background: #1e293b; border-radius: 16px; overflow: hidden; }
.main-image img { width: 100%; height: 100%; object-fit: cover; }
.badge-featured { position: absolute; top: 16px; left: 16px; background: linear-gradient(90deg, #d97706, #b45309); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }

.thumbnails { display: flex; gap: 8px; }
.thumbnail { width: 80px; height: 80px; border-radius: 8px; border: 2px solid #334155; overflow: hidden; cursor: pointer; transition: border-color 0.15s; padding: 0; background: none; }
.thumbnail:hover { border-color: #475569; }
.thumbnail.active { border-color: #2563eb; }
.thumbnail img { width: 100%; height: 100%; object-fit: cover; }

/* Info */
.info-section { display: flex; flex-direction: column; gap: 24px; }
.header { }
.name { font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0 0 8px; }
.club { font-size: 16px; color: #60a5fa; font-weight: 600; margin: 0 0 4px; }
.season { font-size: 14px; color: #64748b; margin: 0; }

.price-section { background: #1e293b; padding: 16px; border-radius: 12px; }
.label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
.price { font-size: 32px; font-weight: 800; color: #34d399; }

.size-section { }
.size-selector { display: flex; flex-wrap: wrap; gap: 8px; }
.size-btn { padding: 10px 16px; border-radius: 8px; border: 2px solid #334155; background: #1e293b; color: #94a3b8; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.size-btn:hover:not(:disabled) { border-color: #475569; color: #f1f5f9; }
.size-btn.active { border-color: #2563eb; background: #2563eb; color: #fff; }
.size-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.no-sizes { padding: 16px; background: #1e293b; border-radius: 8px; text-align: center; color: #64748b; }

.description-section { }
.description { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0; }

.whatsapp-btn-lg { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; background: #16a34a; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; text-decoration: none; cursor: pointer; transition: background 0.15s; }
.whatsapp-btn-lg:hover { background: #15803d; }

.share-btn { width: 100%; padding: 12px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
.share-btn:hover { border-color: #475569; color: #f1f5f9; }

.share-toast { font-size: 12px; color: #34d399; text-align: center; margin: 0; }

.not-found { text-align: center; padding: 80px 24px; }
.not-found p { font-size: 18px; color: #94a3b8; margin-bottom: 20px; }

@media (max-width: 900px) {
  .content-grid { grid-template-columns: 1fr; gap: 32px; }
  .name { font-size: 22px; }
  .price { font-size: 24px; }
}
.customization-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
}

.customization-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.custom-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.custom-input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #f1f5f9;
  transition: border-color 0.15s;
}

.custom-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.field-hint {
  font-size: 10px;
  color: #64748b;
}

.customization-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-badge {
  background: #7c3aed;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.preview-info {
  font-size: 12px;
  color: #34d399;
  font-weight: 600;
}

@media (max-width: 640px) {
  .customization-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>