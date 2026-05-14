<template>
  <div class="detail-page">
    <main class="main">
      <div v-if="loading" class="loading-state">
        <ProgressSpinner strokeWidth="3" />
      </div>

      <div v-else-if="product" class="content-grid">

        <div class="gallery-section">
          <div class="main-image">
            <img :src="selectedImageUrl" :alt="product.name" />
            <div v-if="product.isFeatured" class="badge-featured">⭐ Destaque</div>
          </div>

          <div v-if="product.imageUrls.length > 1" class="thumbnails">
            <button v-for="(url, idx) in product.imageUrls" :key="idx" class="thumbnail"
              :class="{ active: selectedImageIdx === idx }" @click="selectedImageIdx = idx">
              <img :src="url" :alt="`Imagem ${idx + 1}`" />
            </button>
          </div>
        </div>

        <div class="info-section">
          <div class="header">
            <h1 class="name">{{ product.name }}</h1>
            <p class="club">{{ product.club }}</p>
            <p class="season">Temporada {{ product.season }}</p>
          </div>

          <div class="badges-row">
            <span v-if="product.brand" class="badge badge--brand">
              {{ product.brand.toUpperCase() }}
            </span>
            <span class="badge" :class="getGenderBadgeClass(product.gender)">
              {{ getGenderLabel(product.gender) }}
            </span>
            <span v-if="product.allowPersonalization" class="badge badge--custom">
              ✏️ Personalizável
            </span>
            <span v-if="product.type" class="badge" :class="product.type === 'PLAYER' ? 'badge--player' : 'badge--fan'">
              {{ product.type === 'PLAYER' ? 'Jogador' : 'Torcedor' }}
            </span>
          </div>

          <div class="wishlist-row">
            <button class="wishlist-btn" :class="{ 'is-wishlisted': isWishlisted }" :disabled="wishlistLoading"
              @click="toggleWishlist">
              <i :class="isWishlisted ? 'pi pi-heart-fill' : 'pi pi-heart'" />
              {{ isWishlisted ? 'Salvo' : 'Favoritar' }}
            </button>
          </div>

          <div class="price-section">
            <span class="label">Preço</span>
            <div class="price-wrapper">
              <span class="price">{{ formatPrice(product.basePrice) }}</span>
              <span v-if="hasCustomization" class="price-original">{{ formatPrice(product.basePrice) }}</span>
            </div>
            <span v-if="hasCustomization" class="customization-price">+ R$ 49,90 (personalização)</span>
          </div>

          <div class="size-section">
            <label class="label">
              {{ product.enableCategoricalSizes ? product.categoricalSizesLabel : product.numericSizesLabel }}
            </label>

            <div v-if="product.enableCategoricalSizes" class="size-selector">
              <button v-for="size in product.stockCategorical" :key="size" class="size-btn"
                :class="{ active: selectedSize === size }"
                :disabled="!product.infiniteStock && (product.stockCategoricalBySize[size] ?? 0) === 0"
                @click="selectedSize = size">
                {{ size }}
              </button>
            </div>

            <div v-else-if="product.enableNumericSizes" class="size-selector">
              <button v-for="size in numericSizesArray" :key="size" class="size-btn"
                :class="{ active: selectedSize === size }"
                :disabled="!product.infiniteStock && (product.stockNumeric[size] ?? 0) === 0"
                @click="selectedSize = size">
                {{ size }}
              </button>
            </div>

            <div v-else class="no-sizes">
              <p>Tamanhos não disponíveis</p>
            </div>
          </div>

          <!-- 🔥 Personalização (só se permitido) -->
          <div v-if="product.allowPersonalization" class="customization-section">
            <label class="label">Personalização (opcional)</label>
            <div class="customization-grid">
              <div class="custom-field">
                <input v-model="customName" type="text" class="custom-input" placeholder="Nome (ex: FULANO)"
                  maxlength="12" />
                <span class="field-hint">Máx. 12 caracteres</span>
              </div>
              <div class="custom-field">
                <input v-model="customNumber" type="number" class="custom-input" placeholder="Número (ex: 10)" min="0"
                  max="99" />
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

          <div v-if="product.description" class="description-section">
            <label class="label">Descrição</label>
            <p class="description">{{ product.description }}</p>
          </div>

          <div class="actions">
            <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="whatsapp-btn-lg">
              <i class="pi pi-send" />
              Comprar via WhatsApp
            </a>

            <button class="share-btn" @click="handleShare">
              <i class="pi pi-share-alt" />
              Compartilhar
            </button>
          </div>
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
import { useRoute, useRouter } from 'vue-router'
import { productsService } from '@/services/products'
import { userService } from '@/services/user'
import { useAuthStore } from '@/stores/auth'
import ProgressSpinner from 'primevue/progressspinner'
import type { Product } from '@/types'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5598900000000'
const CUSTOMIZATION_PRICE = 4990
const APP_BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const loading = ref(true)
const selectedImageIdx = ref(0)
const selectedSize = ref<string>('')
const shareToast = ref('')

const customName = ref('')
const customNumber = ref<number | null>(null)

const isWishlisted = ref(false)
const wishlistLoading = ref(false)

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

// 🔥 Funções para gênero
function getGenderLabel(gender: string): string {
  switch (gender) {
    case 'MASCULINE': return '♂ Masculino'
    case 'FEMININE': return '♀ Feminino'
    default: return '👥 Unissex'
  }
}

function getGenderBadgeClass(gender: string): string {
  switch (gender) {
    case 'MASCULINE': return 'badge--masculine'
    case 'FEMININE': return 'badge--feminine'
    default: return 'badge--unisex'
  }
}

const getStock = (size: string): number => {
  if (!product.value) return 0
  if (product.value.enableCategoricalSizes) {
    return product.value.stockCategoricalBySize?.[size] ?? 0
  } else if (product.value.enableNumericSizes) {
    return product.value.stockNumeric?.[size] ?? 0
  }
  return 0
}

// 🔥 Respeita infiniteStock
const hasStock = computed(() => {
  if (product.value?.infiniteStock) return true
  return selectedSize.value && getStock(selectedSize.value) > 0
})

const isOutOfStock = computed(() => {
  if (product.value?.infiniteStock) return false
  return !selectedSize.value || getStock(selectedSize.value) === 0
})

const whatsappUrl = computed(() => {
  if (!product.value) {
    return `https://wa.me/${WHATSAPP_NUMBER}`
  }

  let msg = ''

  let customizationLine = ''
  if (hasCustomization.value) {
    const namePart = customName.value ? `Nome: ${customName.value.toUpperCase()}` : ''
    const numberPart = customNumber.value ? `Número: ${customNumber.value}` : ''
    customizationLine = `\n*Personalização:* ${[namePart, numberPart].filter(Boolean).join(' | ')}`
  }

  if (hasStock.value) {
    msg = `Olá! Tenho interesse no produto:\n\n` +
      `*${product.value.name}*\n` +
      `Time: ${product.value.club} | Temporada: ${product.value.season}\n` +
      `Tamanho: ${selectedSize.value}${customizationLine}\n` +
      `Preço: ${formatPrice(finalPrice.value)}\n\n` +
      `Poderia me dar mais informações?`
  } else if (isOutOfStock.value) {
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

async function checkWishlistStatus() {
  if (!authStore.isAuthenticated) return
  if (!product.value) return
  try {
    isWishlisted.value = await userService.isInWishlist(product.value.id)
  } catch (error) {
    console.error('Failed to check wishlist:', error)
  }
}

async function toggleWishlist() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (!product.value) return

  wishlistLoading.value = true
  try {
    if (isWishlisted.value) {
      await userService.removeFromWishlist(product.value.id)
      isWishlisted.value = false
    } else {
      await userService.addToWishlist(product.value.id)
      isWishlisted.value = true
    }
  } catch (error) {
    console.error('Failed to toggle wishlist:', error)
  } finally {
    wishlistLoading.value = false
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

    if (product.value && authStore.isAuthenticated) {
      await checkWishlistStatus()
    }

    if (product.value.enableCategoricalSizes && product.value.stockCategorical.length > 0) {
      const availableSize = product.value.stockCategorical.find(
        size => product.value!.infiniteStock || (product.value!.stockCategoricalBySize[size] ?? 0) > 0
      )
      if (availableSize) selectedSize.value = availableSize
    } else if (product.value.enableNumericSizes && Object.keys(product.value.stockNumeric).length > 0) {
      const availableSize = Object.keys(product.value.stockNumeric).find(
        size => product.value!.infiniteStock || (product.value!.stockNumeric[size] ?? 0) > 0
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
/* ── Raiz ─────────────────────────────────────────────────── */
.detail-page {
  min-height: 100vh;
  background: #0d1117;
  color: #f0f6fc;
}

/* ── Layout ──────────────────────────────────────────────── */
.main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 20px 52px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

/* ── Galeria ─────────────────────────────────────────────── */
.gallery-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-image {
  position: relative;
  aspect-ratio: 1/1;
  background: #1c2330;
  border: 1px solid #2d3748;
  border-radius: 14px;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-featured {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #1e1508;
  border: 1px solid #4a3008;
  color: #d29922;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .4px;
  padding: 3px 10px;
  border-radius: 5px;
}

.thumbnails {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.thumbnails::-webkit-scrollbar {
  display: none;
}

.thumbnail {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid #2d3748;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: none;
  transition: border-color .15s;
}

.thumbnail:hover {
  border-color: #3d4f68;
}

.thumbnail.active {
  border-color: #388bfd;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── Info ────────────────────────────────────────────────── */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.name {
  font-size: 20px;
  font-weight: 700;
  color: #f0f6fc;
  line-height: 1.3;
  margin: 0 0 6px;
}

.club {
  font-size: 10px;
  font-weight: 700;
  color: #484f58;
  text-transform: uppercase;
  letter-spacing: .7px;
  margin: 0 0 4px;
}

.season {
  font-size: 11px;
  color: #484f58;
  margin: 0;
}

/* ── Badges ───────────────────────────────────────────────── */
.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.badge--player {
  background: #0d2240;
  border: 1px solid #1f4280;
  color: #388bfd;
}

.badge--fan {
  background: #0a2522;
  border: 1px solid #0e3d38;
  color: #3fb950;
}

.badge--masculine {
  background: #0d2240;
  border: 1px solid #1f4280;
  color: #388bfd;
}

.badge--feminine {
  background: #2a0f0e;
  border: 1px solid #5a1a18;
  color: #ffa19c;
}

.badge--unisex {
  background: #1e293b;
  border: 1px solid #475569;
  color: #94a3b8;
}

.badge--custom {
  background: #1f1635;
  border: 1px solid #3d2b75;
  color: #a371f7;
}

.badge--brand {
  background: #1e293b;
  border: 1px solid #475569;
  color: #cbd5e1;
}
/* ── Wishlist ─────────────────────────────────────────────── */
.wishlist-row {
  margin-bottom: 4px;
}

.wishlist-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #2d3748;
  border-radius: 10px;
  color: #8b949e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.wishlist-btn:hover {
  border-color: #3d4f68;
  color: #f0f6fc;
}

.wishlist-btn.is-wishlisted {
  background: #2a0f0e;
  border-color: #5a1a18;
  color: #ffa19c;
}

.wishlist-btn.is-wishlisted:hover {
  background: #3a1513;
}

.wishlist-btn i {
  font-size: 16px;
}

.wishlist-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Bloco compartilhado ─────────────────────────────────── */
.price-section,
.size-section,
.customization-section,
.description-section {
  background: #161b22;
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 14px;
}

.label {
  font-size: 10px;
  font-weight: 700;
  color: #484f58;
  text-transform: uppercase;
  letter-spacing: .6px;
  display: block;
  margin-bottom: 10px;
}

/* ── Preço ───────────────────────────────────────────────── */
.price-wrapper {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.price {
  font-size: 26px;
  font-weight: 700;
  color: #f0f6fc;
}

.price-original {
  font-size: 15px;
  color: #484f58;
  text-decoration: line-through;
}

.customization-price {
  display: block;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #1e2d3d;
  font-size: 11px;
  color: #3fb950;
}

/* ── Tamanhos ────────────────────────────────────────────── */
.size-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.size-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 40px;
  padding: 0 12px;
  background: #1c2330;
  border: 1px solid #2d3748;
  border-radius: 8px;
  color: #8b949e;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
}

.size-btn:hover:not(:disabled) {
  border-color: #3d4f68;
  color: #f0f6fc;
}

.size-btn.active {
  background: #0d2240;
  border-color: #388bfd;
  color: #388bfd;
}

.size-btn:disabled {
  opacity: .3;
  cursor: not-allowed;
}

.no-sizes {
  padding: 12px;
  text-align: center;
  color: #484f58;
  font-size: 13px;
}

/* ── Personalização ──────────────────────────────────────── */
.customization-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.custom-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.custom-input {
  height: 40px;
  background: #1c2330;
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
  color: #f0f6fc;
  outline: none;
  transition: border-color .15s;
}

.custom-input::placeholder {
  color: #484f58;
}

.custom-input:focus {
  border-color: #388bfd;
}

.field-hint {
  font-size: 10px;
  color: #484f58;
}

.customization-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #1e2d3d;
}

.preview-badge {
  background: #1f1635;
  border: 1px solid #3d2b75;
  color: #a371f7;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .4px;
  padding: 4px 12px;
  border-radius: 20px;
}

.preview-info {
  font-size: 11px;
  font-weight: 700;
  color: #3fb950;
}

/* ── Descrição ───────────────────────────────────────────── */
.description {
  font-size: 13px;
  color: #8b949e;
  line-height: 1.6;
  margin: 0;
}

/* ── Ações ───────────────────────────────────────────────── */
.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.whatsapp-btn-lg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  width: 100%;
  background: #0a2522;
  border: 1px solid #0e3d38;
  color: #3fb950;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}

.whatsapp-btn-lg:hover {
  background: #0d2f2a;
  border-color: #1a5c52;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  width: 100%;
  background: transparent;
  border: 1px solid #2d3748;
  color: #8b949e;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color .15s, color .15s;
}

.share-btn:hover {
  border-color: #3d4f68;
  color: #f0f6fc;
}

.share-toast {
  font-size: 11px;
  color: #3fb950;
  text-align: center;
  padding: 4px 0;
}

/* ── Not found ───────────────────────────────────────────── */
.not-found {
  text-align: center;
  padding: 60px 20px;
}

.not-found p {
  font-size: 15px;
  color: #8b949e;
  margin-bottom: 20px;
}

/* ── Responsivo ──────────────────────────────────────────────── */
@media (min-width: 640px) {
  .main {
    padding: 28px 24px 56px;
  }

  .content-grid {
    grid-template-columns: 1fr 1fr;
    gap: 36px;
    align-items: start;
  }

  .name {
    font-size: 24px;
  }

  .price {
    font-size: 30px;
  }

  .actions {
    flex-direction: row;
  }

  .whatsapp-btn-lg {
    flex: 2;
  }

  .share-btn {
    flex: 1;
  }
}

@media (min-width: 1024px) {
  .main {
    padding: 36px 32px 64px;
  }

  .content-grid {
    gap: 48px;
  }

  .name {
    font-size: 28px;
  }

  .price {
    font-size: 34px;
  }
}

@media (max-width: 380px) {
  .main {
    padding: 14px 12px 40px;
  }

  .name {
    font-size: 18px;
  }

  .price {
    font-size: 22px;
  }

  .size-btn {
    min-width: 38px;
    height: 36px;
    font-size: 11px;
  }

  .thumbnail {
    width: 46px;
    height: 46px;
  }

  .customization-grid {
    grid-template-columns: 1fr;
  }

  .price-section,
  .size-section,
  .customization-section,
  .description-section {
    padding: 12px;
  }
}
</style>