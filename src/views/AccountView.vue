<template>
  <div class="account-page">

    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="back-link">
          <i class="pi pi-arrow-left" /> Voltar
        </router-link>
        <h1 class="brand">Minha Conta</h1>
        <div class="spacer" />
      </div>
    </header>

    <main class="main">
      <div v-if="loading" class="loading-state">
        <ProgressSpinner strokeWidth="3" />
      </div>

      <div v-else class="content">

        <div class="tabs">
          <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id">
            {{ tab.label }}
          </button>
        </div>


        <div v-show="activeTab === 'profile'" class="tab-content">
          <div class="section">
            <h2>Informações Pessoais</h2>
            <form @submit.prevent="saveProfile" class="form">
              <div class="form-group">
                <label>Nome *</label>
                <input v-model="profile.name" type="text" class="form-input" required />
              </div>

              <div class="form-group">
                <label>Email *</label>
                <input v-model="profile.email" type="email" class="form-input" required />
                <span v-if="profile.emailVerified" class="badge-verified">✓ Verificado</span>
                <span v-else class="badge-unverified">⚠ Não verificado</span>
              </div>

              <div class="form-group">
                <label>Telefone</label>
                <input v-model="profile.phone" type="tel" class="form-input" placeholder="(11) 99999-9999" />
              </div>

              <div class="form-group">
                <label>Seu Time (Favorito)</label>
                <select v-model="profile.favoriteTeam" class="form-input">
                  <option value="">Selecione um time</option>
                  <option v-for="club in clubs" :key="club.id" :value="club.name">
                    {{ club.name }}
                  </option>
                </select>
              </div>

              <button type="submit" class="save-btn" :disabled="savingProfile">
                {{ savingProfile ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
              <p v-if="profileError" class="error-msg">{{ profileError }}</p>
              <p v-if="profileSuccess" class="success-msg">Perfil atualizado com sucesso!</p>
            </form>
          </div>

          <div class="section">
            <h2>Endereço de Entrega</h2>
            <form @submit.prevent="saveAddress" class="form">
              <div class="form-row">
                <div class="form-group">
                  <label>Rua *</label>
                  <input v-model="profile.addressStreet" type="text" class="form-input" required />
                </div>
                <div class="form-group" style="max-width: 120px">
                  <label>Número *</label>
                  <input v-model="profile.addressNumber" type="text" class="form-input" required />
                </div>
              </div>

              <div class="form-group">
                <label>Complemento</label>
                <input v-model="profile.addressComplement" type="text" class="form-input"
                  placeholder="Apto, bloco, etc" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Cidade *</label>
                  <input v-model="profile.addressCity" type="text" class="form-input" required />
                </div>
                <div class="form-group" style="max-width: 100px">
                  <label>Estado *</label>
                  <input v-model="profile.addressState" type="text" class="form-input" placeholder="SP" required />
                </div>
                <div class="form-group" style="max-width: 140px">
                  <label>CEP</label>
                  <input v-model="profile.addressZip" type="text" class="form-input" placeholder="12345-678" />
                </div>
              </div>

              <button type="submit" class="save-btn" :disabled="savingProfile">
                {{ savingProfile ? 'Salvando...' : 'Salvar Endereço' }}
              </button>
              <p v-if="addressError" class="error-msg">{{ addressError }}</p>
            </form>
          </div>

          <div class="section">
            <h2>Segurança</h2>
            <form @submit.prevent="changePassword" class="form">
              <div class="form-group">
                <label>Senha Atual *</label>
                <input v-model="passwordForm.currentPassword" type="password" class="form-input" required />
              </div>

              <div class="form-group">
                <label>Nova Senha *</label>
                <input v-model="passwordForm.newPassword" type="password" class="form-input" required />
                <span class="help-text">Mínimo 8 caracteres</span>
              </div>

              <div class="form-group">
                <label>Confirmar Nova Senha *</label>
                <input v-model="passwordForm.confirmPassword" type="password" class="form-input" required />
              </div>

              <button type="submit" class="save-btn" :disabled="savingPassword">
                {{ savingPassword ? 'Alterando...' : 'Alterar Senha' }}
              </button>
              <p v-if="passwordError" class="error-msg">{{ passwordError }}</p>
              <p v-if="passwordSuccess" class="success-msg">Senha alterada com sucesso!</p>
            </form>
          </div>
        </div>


        <div v-show="activeTab === 'wishlist'" class="tab-content">
          <div class="section">
            <h2>Meus Favoritos</h2>
            <div v-if="wishlist.length === 0" class="empty-state">
              <p>Você ainda não tem produtos favoritos</p>
              <router-link to="/" class="btn-primary">Explorar produtos</router-link>
            </div>
            <div v-else class="wishlist-grid">
              <div v-for="product in wishlist" :key="product.id" class="wishlist-item">
                <div class="item-image">
                  <img :src="product.imageUrl || placeholder" :alt="product.name" />
                  <button class="btn-remove" @click="removeFromWishlist(product.id)">
                    <i class="pi pi-trash" />
                  </button>
                </div>
                <div class="item-info">
                  <p class="item-name">{{ product.name }}</p>
                  <p class="item-club">{{ product.club }}</p>
                  <p class="item-price">{{ formatPrice(product.basePrice) }}</p>
                  <router-link :to="`/products/${product.id}`" class="btn-view">
                    Ver detalhes
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div v-show="activeTab === 'orders'" class="tab-content">
          <div class="section">
            <h2>Meus Pedidos</h2>
            <div class="construction">
              <span class="construction-emoji">🚧</span>
              <p>Esta seção está em construção</p>
              <p class="construction-sub">Em breve você poderá acompanhar seus pedidos aqui</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/user'
import { clubsService, type Club } from '@/services/clubs'
import ProgressSpinner from 'primevue/progressspinner'
import type { User, UpdateProfileInput, ChangePasswordInput } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { user } = authStore


if (!user) {
  router.push('/login')
}

const placeholder = 'https://placehold.co/200x200/0f172a/334155?text=Produto'

const loading = ref(true)
const activeTab = ref('profile')
const clubs = ref<Club[]>([])

const profile = ref<User>({
  id: user?.id || '',
  email: user?.email || '',
  name: user?.name || '',
  favoriteTeam: user?.favoriteTeam || '',
  phone: user?.phone || '',
  addressStreet: user?.addressStreet || '',
  addressNumber: user?.addressNumber || '',
  addressComplement: user?.addressComplement || '',
  addressCity: user?.addressCity || '',
  addressState: user?.addressState || '',
  addressZip: user?.addressZip || '',
})

const passwordForm = ref<ChangePasswordInput>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const wishlist = ref<any[]>([])
const savingProfile = ref(false)
const savingPassword = ref(false)
const profileError = ref('')
const profileSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const addressError = ref('')

const tabs = [
  { id: 'profile', label: 'Perfil' },
  { id: 'wishlist', label: '❤️ Favoritos' },
  { id: 'orders', label: '📦 Pedidos' },
]

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

async function loadProfile() {
  try {
    const userData = await userService.getProfile()
    Object.assign(profile.value, userData)
  } catch (error) {
    console.error('Erro ao carregar perfil:', error)
  }
}

async function loadWishlist() {
  try {
    const items = await userService.getWishlist()
    wishlist.value = items
  } catch (error) {
    console.error('Erro ao carregar wishlist:', error)
  }
}

async function saveProfile() {
  savingProfile.value = true
  profileError.value = ''
  profileSuccess.value = ''

  try {
    const input: UpdateProfileInput = {
      name: profile.value.name,
      email: profile.value.email,
      phone: profile.value.phone,
      favoriteTeam: profile.value.favoriteTeam,
    }

    await userService.updateProfile(input)

    if (authStore.user) {
      authStore.user.name = profile.value.name
      authStore.user.email = profile.value.email
      authStore.user.favoriteTeam = profile.value.favoriteTeam
    }

    profileSuccess.value = 'Perfil atualizado!'
    setTimeout(() => { profileSuccess.value = '' }, 3000)
  } catch (error: any) {
    profileError.value = error.response?.data?.message || 'Erro ao salvar perfil'
  } finally {
    savingProfile.value = false
  }
}

async function saveAddress() {
  savingProfile.value = true
  addressError.value = ''

  try {
    const input: UpdateProfileInput = {
      addressStreet: profile.value.addressStreet,
      addressNumber: profile.value.addressNumber,
      addressComplement: profile.value.addressComplement,
      addressCity: profile.value.addressCity,
      addressState: profile.value.addressState,
      addressZip: profile.value.addressZip,
    }

    await userService.updateProfile(input)
    profileSuccess.value = 'Endereço atualizado!'
    setTimeout(() => { profileSuccess.value = '' }, 3000)
  } catch (error: any) {
    addressError.value = error.response?.data?.message || 'Erro ao salvar endereço'
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Senhas não coincidem'
    return
  }

  savingPassword.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  try {
    await userService.changePassword(passwordForm.value)
    passwordSuccess.value = 'Senha alterada com sucesso!'
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    setTimeout(() => { passwordSuccess.value = '' }, 3000)
  } catch (error: any) {
    passwordError.value = error.response?.data?.message || 'Erro ao alterar senha'
  } finally {
    savingPassword.value = false
  }
}

async function removeFromWishlist(productId: string) {
  try {
    await userService.removeFromWishlist(productId)
    wishlist.value = wishlist.value.filter(p => p.id !== productId)
  } catch (error) {
    console.error('Erro ao remover da wishlist:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    loadProfile(),
    loadWishlist(),
    clubsService.list().then(c => { clubs.value = c }),
  ])
  loading.value = false
})
</script>

<style scoped>
.account-page {
  min-height: 100vh;
  background: #0f172a;
  color: #f1f5f9;
}

.navbar {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.back-link:hover {
  color: #f1f5f9;
}

.brand {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.spacer {
  width: 100px;
}

.main {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  border-bottom: 1px solid #334155;
}

.tab-btn {
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: #f1f5f9;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px;
  color: #f1f5f9;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
  color: #f1f5f9;
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.badge-verified {
  font-size: 11px;
  color: #16a34a;
  font-weight: 600;
}

.badge-unverified {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
}

.help-text {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.save-btn {
  padding: 10px 20px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #f43f5e;
  font-size: 12px;
  margin: 0;
}

.success-msg {
  color: #16a34a;
  font-size: 12px;
  margin: 0;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;
  color: #64748b;
}

.empty-state p {
  font-size: 14px;
  margin: 0 0 20px;
}

.btn-primary {
  display: inline-block;
  padding: 10px 20px;
  background: #2563eb;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.wishlist-item {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.item-image {
  position: relative;
  aspect-ratio: 1/1;
  background: #0f172a;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #ef4444;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.item-club {
  font-size: 11px;
  color: #60a5fa;
  margin: 0;
}

.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #34d399;
  margin: 4px 0;
}

.btn-view {
  display: inline-block;
  padding: 6px 12px;
  background: #2563eb;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

.construction {
  text-align: center;
  padding: 60px 24px;
}

.construction-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.construction p {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.construction-sub {
  color: #64748b;
  font-size: 12px;
}
</style>