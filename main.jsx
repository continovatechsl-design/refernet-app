@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    background: #F6F4EF;
  }
  body {
    @apply font-sans text-ink antialiased;
  }
  h1, h2, h3 {
    @apply font-display;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed;
  }
  .btn-primary {
    @apply btn bg-brand-600 text-paper hover:bg-brand-700;
  }
  .btn-ghost {
    @apply btn bg-transparent text-brand-600 hover:bg-brand-50 border border-brand-100;
  }
  .card {
    @apply bg-white border border-black/[0.06] rounded-sm shadow-[0_1px_2px_rgba(18,24,27,0.04)];
  }
  .input {
    @apply w-full rounded-sm border border-black/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400;
  }
  .label {
    @apply block text-xs font-medium uppercase tracking-wide text-ink/50 mb-1.5;
  }
  .eyebrow {
    @apply text-xs font-mono uppercase tracking-[0.14em] text-brand-500;
  }
  .circuit-rule {
    @apply relative h-px w-full bg-black/10;
  }
  .badge {
    @apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium;
  }
}
