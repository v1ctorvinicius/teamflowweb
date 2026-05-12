<!-- src/components/ProductCard.vue -->
<template>
  <div
    class="product-card"
    :class="{
      'is-favorite-team': isFavoriteTeam,
      'is-featured': product.isFeatured,
    }"
    @click="$emit('view-details', product.id)"
  >
    <!-- ── Banners ── -->
    <div v-if="isFavoriteTeam" class="top-banner banner-heart">🖤 Seu time</div>
    <div v-else-if="product.isFeatured" class="top-banner banner-featured">⭐ Destaque</div>
    <!-- Banner vazio para manter altura consistente -->
    <div v-if="!isFavoriteTeam && !product.isFeatured" class="top-banner banner-empty"></div>
    <!-- ── Imagem (primeira do array) ── -->
    <div class="image-wrap">
      <img
        :src="mainImage || placeholder"
        :alt="product.name"
        class="product-img"
        loading="lazy"
      />

      <!-- Badge Novo -->
      <div v-if="isNew && !isOutOfStock" class="badge-new">🔥 Novo</div>

      <!-- Overlay ESGOTADO -->
      <div v-if="isOutOfStock" class="oos-overlay">
        <span class="oos-label">ESGOTADO</span>
      </div>
    </div>

    <!-- ── Corpo ── -->
    <div class="card-body">
      <p class="club-label">{{ product.club }}</p>
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="season-label">{{ product.season }}</p>

      <div class="price-row">
        <span class="price">{{ formatPrice(product.basePrice) }}</span>
      </div>

      <!-- Tamanhos disponíveis -->
      <div v-if="availableSizes.length" class="sizes-row">
        <span
          v-for="size in availableSizes.slice(0, 6)"
          :key="size"
          class="size-chip"
          :class="{
            'size-oos': isAuthenticated && getStockForSize(size) === 0,
            'size-guest': !isAuthenticated,
          }"
        >{{ size }}</span>
        <!-- <span v-if="availableSizes.length > 6" class="size-more">
          +{{ availableSizes.length - 6 }}
        </span> -->
      </div>
      <div v-else class="sizes-row">
        <span class="size-chip size-oos">Sem tamanhos</span>
      </div>

      <!-- Ações -->
      <div class="actions">
        <!-- <button class="details-btn" :class="{ 'btn-oos': isOutOfStock }">
          {{ isOutOfStock ? 'Esgotado' : 'Ver detalhes' }}
        </button> -->

        <a
          class="whatsapp-btn"
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          <svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Comprar
        </a>

        <button
          class="share-btn"
          @click.stop="handleShare"
          title="Compartilhar produto"
        >
          <i class="pi pi-share-alt" />
        </button>
      </div>

      <p v-if="shareToast" class="share-toast">{{ shareToast }}</p>

      <p v-if="!isAuthenticated" class="guest-nudge">
        <router-link to="/register" @click.stop>Crie uma conta</router-link>
        para filtrar e acompanhar seu time
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { Product } from '@/types'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5598900000000'
const APP_BASE_URL    = import.meta.env.VITE_APP_URL || window.location.origin

const props = defineProps<{
  product: Product
  userFavoriteTeam?: string
  isAuthenticated?: boolean
}>()

defineEmits<{ (e: 'view-details', id: string): void }>()

const placeholder = 'https://placehold.co/400x400/0f172a/334155?text=TeamFlow'
const shareToast = ref('')

const favoriteTeam = ref(props.userFavoriteTeam)
watch(() => props.userFavoriteTeam, (v) => { favoriteTeam.value = v }, { immediate: true })

// Imagem principal: primeira do array ou fallback
const mainImage = computed(() =>
  props.product.imageUrls?.[0] || props.product.imageUrl
)

// Tamanhos disponíveis conforme sistema ativado
const availableSizes = computed<string[]>(() => {
  if (props.product.enableCategoricalSizes) {
    return props.product.stockCategorical || []
  } else if (props.product.enableNumericSizes) {
    return Object.keys(props.product.stockNumeric || {})
  }
  return []
})

const isFavoriteTeam = computed(() => {
  if (!favoriteTeam.value) return false
  return props.product.club.toLowerCase().trim() === favoriteTeam.value.toLowerCase().trim()
})

// Stock para um tamanho específico (categórico ou numérico)
function getStockForSize(size: string): number {
  if (props.product.enableCategoricalSizes) {
    return props.product.stockCategoricalBySize?.[size] ?? 0
  } else if (props.product.enableNumericSizes) {
    return props.product.stockNumeric?.[size] ?? 0
  }
  return 0
}

const isOutOfStock = computed(() => {
  if (!availableSizes.value.length) return true
  return availableSizes.value.every((s) => getStockForSize(s) === 0)
})

const isNew = computed(() => {
  try {
    const created = new Date(props.product.createdAt).getTime()
    return created > Date.now() - 7 * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
})

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const whatsappUrl = computed(() => {
  const msg = encodeURIComponent(
    `Olá! Tenho interesse na camisa:\n\n` +
    `*${props.product.name}*\n` +
    `Time: ${props.product.club} | Temporada: ${props.product.season}\n` +
    `Preço: ${formatPrice(props.product.basePrice)}\n\n` +
    `Poderia me dar mais informações?`
  )
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`
})

const shareUrl = computed(() =>
  props.product.slug
    ? `${APP_BASE_URL}/produto/${props.product.slug}`
    : `${APP_BASE_URL}/products/${props.product.id}`
)

async function handleShare() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.product.name,
        text:  `${props.product.name} — ${props.product.club} | ${formatPrice(props.product.basePrice)}`,
        url:   shareUrl.value,
      })
    } catch { /* usuário cancelou */ }
  } else {
    try {
      await navigator.clipboard.writeText(shareUrl.value)
      shareToast.value = '🔗 Link copiado!'
    } catch {
      shareToast.value = '❌ Não foi possível copiar'
    }
    setTimeout(() => { shareToast.value = '' }, 2500)
  }
}
</script>
<style scoped>
.product-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}
.product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); border-color: #475569; }
.product-card.is-favorite-team { border-color: #f43f5e; box-shadow: 0 0 0 1px #f43f5e, 0 8px 24px rgba(244,63,94,0.15); }
.product-card.is-featured { border-color: #f59e0b; box-shadow: 0 0 0 1px #f59e0b, 0 8px 24px rgba(245,158,11,0.1); }

/* 🔥 Banners com altura fixa para manter alinhamento */
.top-banner { 
  font-size: 0.9em; 
  font-weight: 700; 
  padding: 5px 12px; 
  letter-spacing: 0.5px; 
  text-align: center; 
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-heart { background: linear-gradient(90deg, #f43f5e, #e11d48); color: #fff; }
.banner-featured { background: linear-gradient(90deg, #d97706, #b45309); color: #fff; }
.banner-empty { background: transparent; color: transparent; }

.image-wrap { position: relative; aspect-ratio: 1/1; background: #0f172a; overflow: hidden; }
.product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.product-card:hover .product-img { transform: scale(1.04); }

.badge-new { position: absolute; top: 8px; left: 8px; background: linear-gradient(90deg, #7c3aed, #6d28d9); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px; z-index: 1; }

.oos-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.72); display: flex; align-items: center; justify-content: center; }
.oos-label { background: #ef4444; color: #fff; font-size: 13px; font-weight: 800; padding: 6px 18px; border-radius: 8px; letter-spacing: 1.5px; }

.card-body { 
  padding: 14px 16px 16px; 
  display: flex; 
  flex-direction: column; 
  flex: 1;
  gap: 8px;
}
.club-label { font-size: 11px; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.8px; margin: 0; }
.product-name { 
  font-size: 14px; 
  font-weight: 600; 
  color: #f1f5f9; 
  margin: 0; 
  line-height: 1.35; 
  display: -webkit-box; 
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical; 
  overflow: hidden;
  min-height: 38px;
}
.season-label { font-size: 12px; color: #64748b; margin: 0; }
.price-row { margin: 0; }
.price { font-size: 18px; font-weight: 800; color: #34d399; }

/* 🔥 Tamanhos com altura fixa */
.sizes-row { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 5px; 
  margin: 0; 
  min-height: 28px;
}
.size-chip { 
  border: 1px solid #475569; 
  border-radius: 5px; 
  padding: 2px 7px; 
  font-size: 11px; 
  font-weight: 600; 
  color: #cbd5e1;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
}
.size-chip.size-oos { border-color: #1e293b; color: #334155; background: #0f172a; }
.size-chip.size-guest { border-color: #334155; color: #475569; }
.size-more { font-size: 11px; color: #64748b; align-self: center; white-space: nowrap; }

/* 🔥 AÇÕES: alinhamento vertical em telas pequenas */
.actions { 
  margin-top: auto; 
  display: flex; 
  flex-direction: row;
  gap: 6px; 
  padding-top: 8px;
}
.details-btn { 
  flex: 1; 
  padding: 9px 0; 
  background: #2563eb; 
  color: #fff; 
  border: none; 
  border-radius: 9px; 
  font-size: 13px; 
  font-weight: 600; 
  cursor: pointer; 
  transition: background 0.15s;
  white-space: nowrap;
  min-width: 0;
}
.details-btn:hover:not(.btn-oos) { background: #1d4ed8; }
.details-btn.btn-oos { background: #374151; color: #6b7280; cursor: default; }

.whatsapp-btn { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 5px; 
  padding: 9px 12px; 
  background: #16a34a; 
  color: #fff; 
  border: none; 
  border-radius: 9px; 
  font-size: 13px; 
  font-weight: 600; 
  text-decoration: none; 
  cursor: pointer; 
  transition: background 0.15s; 
  white-space: nowrap;
  flex-shrink: 0;
}
.whatsapp-btn:hover { background: #15803d; }
.wa-icon { width: 14px; height: 14px; flex-shrink: 0; }

.share-btn { 
  width: 40px; 
  flex-shrink: 0; 
  background: #0f172a; 
  border: 1px solid #334155; 
  color: #94a3b8; 
  border-radius: 9px; 
  font-size: 14px; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.15s; 
}
.share-btn:hover { border-color: #60a5fa; color: #60a5fa; background: rgba(96,165,250,0.08); }

.share-toast { margin-top: 6px; font-size: 11px; color: #34d399; text-align: center; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; } }

.guest-nudge { margin-top: 8px; font-size: 11px; color: #475569; text-align: center; }
.guest-nudge a { color: #60a5fa; text-decoration: none; font-weight: 600; }
.guest-nudge a:hover { text-decoration: underline; }

/* 🔥 RESPONSIVO: botões em coluna em telas pequenas */
@media (max-width: 500px) {
  .actions { 
    flex-direction: column; 
    gap: 8px;
  }
  .details-btn, .whatsapp-btn { 
    width: 100%; 
    white-space: normal;
    padding: 9px 12px;
  }
  .share-btn { 
    width: 100%; 
    padding: 9px 0;
  }
  .product-name { 
    font-size: 13px; 
    min-height: 34px;
  }
  .price { font-size: 16px; }
}

@media (max-width: 375px) {
  .card-body { padding: 10px 12px 12px; gap: 6px; }
  .details-btn, .whatsapp-btn { font-size: 12px; }
  .product-name { font-size: 12px; min-height: 30px; }
  .price { font-size: 14px; }
  .size-chip { padding: 1px 5px; font-size: 10px; }
  .share-btn { width: 100%; }
}
</style>