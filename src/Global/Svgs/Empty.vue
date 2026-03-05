<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    
    <!-- SVG -->
    <svg
      class="w-30 h-30 text-neutral-300 dark:text-neutral-700"
      fill="none"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" stroke="currentColor" stroke-width="4" stroke-dasharray="6 6"/>
      <rect x="60" y="80" width="80" height="10" rx="5" fill="currentColor" />
      <rect x="60" y="100" width="60" height="10" rx="5" fill="currentColor" opacity="0.6"/>
      <rect x="60" y="120" width="40" height="10" rx="5" fill="currentColor" opacity="0.4"/>
    </svg>

    <!-- Text -->
    <h5 class="mt-6 text-lg font-semibold text-neutral-800 dark:text-white">
      No Data Found
    </h5>

    <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
      There are no records available at the moment. Try adjusting your search or add a new entry.
    </p>

  </div>
</template>