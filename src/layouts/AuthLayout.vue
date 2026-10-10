<template>
  <main class="auth-layout">
    <section class="auth-brand-panel">
      <div class="auth-brand">
        <span>◇</span><b>{{ $t('brand.name') }}</b
        ><small>{{ $t('brand.admin') }}</small>
      </div>
      <div class="security-grid" aria-hidden="true"><i v-for="index in 16" :key="index" /></div>
    </section>
    <section class="auth-content"><RouterView /></section>
  </main>
</template>
