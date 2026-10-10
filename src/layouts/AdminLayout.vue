<script setup lang="ts">
import AdminSidebar from '@/components/AdminSidebar.vue'
import AdminTopbar from '@/components/AdminTopbar.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div :class="['admin-shell', { 'sidebar-collapsed': ui.sidebarCollapsed }]">
    <AdminSidebar />
    <AdminTopbar />
    <main class="admin-main"><RouterView /></main>
  </div>
</template>
