<template>
  <main class="standalone-state">
    <section class="state-panel">
      <span class="state-icon">!</span>
      <h1>{{ $t('state.forbiddenTitle') }}</h1>
      <p>{{ $t('state.forbiddenDescription') }}</p>
      <RouterLink :to="{ name: 'dashboard' }" class="button button-primary">{{
        $t('placeholder.back')
      }}</RouterLink>
    </section>
  </main>
</template>
