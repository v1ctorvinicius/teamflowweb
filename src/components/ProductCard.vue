<!-- src/components/ProductCard.vue -->
<template>
  <div class="product-card" :class="{
    'is-favorite-team': isFavoriteTeam,
    'is-featured': product.isFeatured,
  }" @click="$emit('view-details', product.id)">

    <div v-if="isFavoriteTeam" class="top-banner banner-heart">🖤 Seu time</div>
    <div v-else-if="product.isFeatured" class="top-banner banner-featured">⭐ Destaque</div>
    <div v-if="!isFavoriteTeam && !product.isFeatured" class="top-banner banner-empty"></div>

    <div class="image-wrap">
      <img :src="mainImage || placeholder" :alt="product.name" class="product-img" loading="lazy" />

      <div v-if="isNew && !isOutOfStock" class="badge-new">🔥 Novo</div>

      <div v-if="isOutOfStock" class="oos-overlay">
        <span class="oos-label">ESGOTADO</span>
      </div>
    </div>

    <div class="card-body">
      <p class="club-label">{{ product.club }}</p>
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="season-label">{{ product.season }}</p>

      <div class="product-badges">
        <span class="badge" :class="product.type === 'PLAYER' ? 'badge--player' : 'badge--fan'">
          {{ product.type === 'PLAYER' ? 'Jogador' : 'Torcedor' }}
        </span>
        <span class="badge badge--season">
          {{ product.season }}
        </span>
        <span v-if="isFavoriteTeam" class="badge badge--my-team">
          ❤️ Meu time
        </span>
      </div>



      <div v-if="availableSizes.length" class="sizes-row">
        <span v-for="size in availableSizes.slice(0, 6)" :key="size" class="size-chip" :class="{
          'size-oos': isAuthenticated && getStockForSize(size) === 0,
          'size-guest': !isAuthenticated,
        }">{{ size }}</span>

      </div>
      <div v-else class="sizes-row">
        <span class="size-chip size-oos">Sem tamanhos</span>
      </div>

      <div class="price-row">
        <span class="price">{{ formatPrice(product.basePrice) }}</span>
      </div>

      <div class="actions">

        <a class="whatsapp-btn" :href="whatsappUrl" target="_blank" rel="noopener noreferrer" @click.stop>
          <svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Comprar
        </a>

        <button class="share-btn" @click.stop="handleShare" title="Compartilhar produto">
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
const APP_BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin

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


const mainImage = computed(() =>
  props.product.imageUrls?.[0] || props.product.imageUrl
)


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
        text: `${props.product.name} — ${props.product.club} | ${formatPrice(props.product.basePrice)}`,
        url: shareUrl.value,
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
/* ── Raiz ─────────────────────────────────────────────────── */
.product-card {
  background: #161b22;
  border: 1px solid #2d3748;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color .15s;
  height: 100%;
}

.product-card:hover {
  border-color: #3d4f68;
}

/* Estados — só a borda muda, sem box-shadow ou glow */
.product-card.is-favorite-team {
  border-color: #5a1a18;
}

.product-card.is-favorite-team:hover {
  border-color: #f85149;
}

.product-card.is-featured {
  border-color: #4a3008;
}

.product-card.is-featured:hover {
  border-color: #d29922;
}

/* ── Banner de topo — sempre 24px, nunca expande ─────────── */
.top-banner {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .4px;
  flex-shrink: 0;
}

.banner-heart {
  background: #2a0f0e;
  color: #ffa19c;
  border-bottom: 1px solid #5a1a18;
}

.banner-featured {
  background: #1e1508;
  color: #e8b44a;
  border-bottom: 1px solid #4a3008;
}

.banner-empty {
  background: transparent;
}

/* ── Imagem ───────────────────────────────────────────────── */
.image-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #1c2330;
  overflow: hidden;
  flex-shrink: 0;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .3s;
}

.product-card:hover .product-img {
  transform: scale(1.03);
}

/* badges */
.product-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 6px;
}

.badge-new {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #1f1635;
  border: 1px solid #3d2b75;
  color: #c4a6f8;
  font-size: 0.7em;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 5px;
  letter-spacing: .4px;
  z-index: 1;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.badge--fan {
  background: #0a2522;
  border: 1px solid #0e3d38;
  color: #3fb950;
}

.badge--player {
  background: #0d2240;
  border: 1px solid #1f4280;
  color: #388bfd;
}

.badge--season {
  background: #222a38;
  border: 1px solid #2d3748;
  color: #8b949e;
}

.badge--my-team {
  background: #1f1635;
  border: 1px solid #3d2b75;
  color: #a371f7;
}


/*------------------*/

.oos-overlay {
  position: absolute;
  inset: 0;
  background: rgba(13, 17, 23, .75);
  display: flex;
  align-items: center;
  justify-content: center;
}

.oos-label {
  background: #1c2330;
  border: 1px solid #2d3748;
  color: #8b949e;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
  letter-spacing: 1px;
}

/* ── Corpo ────────────────────────────────────────────────── */
.card-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 5px;
}

.club-label {
  font-size: 10px;
  font-weight: 700;
  color: #484f58;
  text-transform: uppercase;
  letter-spacing: .7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.product-name {
  font-size: 12px;
  font-weight: 600;
  color: #f0f6fc;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(12px * 1.4 * 2);
}

/* season-label continua mas mais discreto */
.season-label {
  display: none;
}

/* já vem no badge */

/* ── Preço ────────────────────────────────────────────────── */
.price-row {
  margin: 0;
}

.price {
  font-size: 15px;
  font-weight: 700;
  color: #f0f6fc;
}

/* ── Tamanhos ─────────────────────────────────────────────── */
.sizes-row {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  min-height: 20px;
  align-items: center;
}

.size-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  min-width: 24px;
  padding: 0 4px;
  background: #222a38;
  border: 1px solid #2d3748;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  color: #8b949e;
}

.size-chip.size-oos {
  opacity: .3;
  text-decoration: line-through;
}

.size-chip.size-guest {
  opacity: .5;
  filter: blur(1.5px);
  user-select: none;
}

/* ── Ações ────────────────────────────────────────────────── */
.actions {
  margin-top: auto;
  display: flex;
  gap: 5px;
  padding-top: 6px;
}

.whatsapp-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  background: #0a2522;
  border: 1px solid #0e3d38;
  color: #3fb950;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s, border-color .15s;
}

.whatsapp-btn:hover {
  background: #0d2f2a;
  border-color: #1a5c52;
}

.wa-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

/* Esgotado: mesmo layout mas desativado */
.whatsapp-btn[disabled],
.whatsapp-btn.btn-oos {
  background: #222a38;
  border-color: #2d3748;
  color: #484f58;
  pointer-events: none;
  cursor: not-allowed;
}

.share-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #2d3748;
  border-radius: 8px;
  color: #484f58;
  cursor: pointer;
  font-size: 14px;
  transition: border-color .15s, color .15s;
}

.share-btn:hover {
  border-color: #3d4f68;
  color: #8b949e;
}

.share-toast {
  font-size: 10px;
  color: #3fb950;
  text-align: center;
  padding: 3px 0;
}

.guest-nudge {
  font-size: 10px;
  color: #484f58;
  text-align: center;
  padding-top: 2px;
  margin: 0;
}

.guest-nudge a {
  color: #388bfd;
  text-decoration: none;
  font-weight: 600;
}

.guest-nudge a:hover {
  text-decoration: underline;
}
</style>