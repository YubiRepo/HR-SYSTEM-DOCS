<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon?: string
  link: string
  badge?: string
}>()
</script>

<template>
  <a :href="link" class="module-card">
    <span v-if="icon" class="icon">{{ icon }}</span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <span v-if="badge" class="badge" :class="badge.toLowerCase()">{{ badge }}</span>
  </a>
</template>
