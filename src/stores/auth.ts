// src/stores/auth.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import {
  authService,
  type LoginInput,
  type RegisterInput,
} from "@/services/auth";
import type { User } from "@/types";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(true);

  // Actions
  async function login(input: LoginInput) {
    const result = await authService.login(input);
    localStorage.setItem("access_token", result.accessToken);
    localStorage.setItem("refresh_token", result.refreshToken);
    user.value = result.user;
    isAuthenticated.value = true;
  }

  async function register(input: RegisterInput) {
    const result = await authService.register(input);
    localStorage.setItem("access_token", result.accessToken);
    localStorage.setItem("refresh_token", result.refreshToken);
    user.value = result.user;
    isAuthenticated.value = true;
  }

  async function logout() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    user.value = null;
    isAuthenticated.value = false;
  }

  /**
   * Hidrata o estado de autenticação ao recarregar a página.
   * Se houver token, busca o perfil do usuário na API para
   * garantir que `user.favoriteTeam` e demais dados estejam disponíveis.
   */
  async function hydrate() {
    const token = localStorage.getItem("access_token");
    console.log("🔍 HYDRATE - step 1: token exists:", !!token);

    if (!token) {
      isLoading.value = false;
      return;
    }

    isAuthenticated.value = true;
    console.log("🔍 HYDRATE - step 2: isAuthenticated set to true");

    try {
      console.log("🔍 HYDRATE - step 3: calling getMe()...");
      const userData = await authService.getMe();
      console.log("🔍 HYDRATE - step 4: getMe() returned:", userData);
      user.value = userData;
      console.log("🔍 HYDRATE - step 5: user.value set to:", user.value);
    } catch (error) {
      console.error("🔍 HYDRATE - step ERROR:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      user.value = null;
      isAuthenticated.value = false;
    } finally {
      isLoading.value = false;
      console.log("🔍 HYDRATE - step 6: isLoading set to false");
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hydrate,
  };
});
