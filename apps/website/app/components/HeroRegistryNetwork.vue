<script setup lang="ts">
const nodes = [
  { x: 150, y: 145, path: 'M700 330H470L350 145H150', delay: '0s' },
  { x: 90, y: 420, path: 'M700 330H390L300 420H90', delay: '-2s' },
  { x: 310, y: 600, path: 'M700 330V490L590 600H310', delay: '-4s' },
  { x: 1250, y: 145, path: 'M700 330H930L1050 145H1250', delay: '-3s' },
  { x: 1310, y: 420, path: 'M700 330H1010L1100 420H1310', delay: '-1s' },
  { x: 1090, y: 600, path: 'M700 330V490L810 600H1090', delay: '-5s' },
]
</script>

<template>
  <svg class="hero-network" viewBox="0 0 1400 700" fill="none" aria-hidden="true" focusable="false">
    <g v-for="node in nodes" :key="node.path" :style="{ '--network-delay': node.delay }">
      <path :d="node.path" class="network-track" />
      <path :d="node.path" pathLength="100" class="network-flow" />
      <g :transform="`translate(${node.x} ${node.y})`" class="network-node">
        <rect x="-36" y="-36" width="72" height="72" rx="18" class="network-node-bg" />
        <path d="m-18-9 18-10 18 10L0 1Zm0 10L0 11 18 1M-18 11 0 21l18-10" />
        <circle cx="27" cy="-27" r="4" class="network-pulse" />
      </g>
    </g>
    <g transform="translate(700 330)" class="network-node network-hub">
      <rect x="-48" y="-48" width="96" height="96" rx="24" class="network-node-bg" />
      <path d="m-24-12 24-14 24 14L0 2Zm0 14L0 16 24 2M-24 16 0 30l24-14" />
    </g>
  </svg>
</template>
