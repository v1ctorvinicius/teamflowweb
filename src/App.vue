<template>
  <div class="app">
    <template v-if="!hideLayout">
      <Navbar />
      <main class="app-main">
        <Toast position="bottom-right" />
        <router-view />
      </main>
      <Footer />
    </template>
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import Toast from 'primevue/toast'

const authStore = useAuthStore();
const route = useRoute();

const hideLayout = computed(() => route.meta.hideLayout === true)

onMounted(() => {
  authStore.hydrate()
})
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-page: #0d1117;
  --bg-surface: #161b22;
  --bg-elevated: #1c2330;
  --bg-hover: #222a38;
  --border: #2d3748;
  --border-sub: #1e2d3d;
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
  --red-border: #5a1a18;
  --green: #3fb950;
  --green-bg: #0a2522;
  --green-border: #0e3d38;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

body {
  background: var(--bg-page);
  font-family: var(--font);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  margin: 0;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
}
</style>