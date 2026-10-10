<template>
  <main class="standalone-state">
    <section class="state-panel">
      <span class="state-icon">404</span>
      <h1>{{ $t('state.notFoundTitle') }}</h1>
      <p>{{ $t('state.notFoundDescription') }}</p>
      <RouterLink :to="{ name: 'dashboard' }" class="button button-primary">{{
        $t('placeholder.back')
      }}</RouterLink>
    </section>
  </main>
</template>
