// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true, hideLayout: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresGuest: true, hideLayout: true },
    },
    {
      path: '/',
      name: 'products',
      component: () => import('@/views/ProductsView.vue'),
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetailView.vue'),
    },
    {
      path: '/produto/:slug',
      name: 'product-detail-slug',
      component: () => import('@/views/ProductDetailView.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/views/AccountView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/admin/AdminView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    }
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = (authStore.user as any)?.role === 'ADMIN'

  if (to.meta.requiresAdmin) {
    if (!isAuthenticated) return '/login'
      if (!isAdmin) return '/'
    }

  if (to.meta.requiresGuest && isAuthenticated) return '/'
    
    return true
})

export default router