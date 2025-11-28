<template>
    <div
        class="gate-body-container d-flex flex-column align-center py-1 px-1 flex-grow-1"
        :class="{ 'is-active': isActive, 'is-loading': isLoading }"
        @click="changeTool">
        <!-- Spool Visual with Filament Level Indicator -->
        <v-tooltip top>
            <template #activator="{ on, attrs }">
                <div
                    class="filament-spool-wrapper cursor-pointer mb-1 position-relative"
                    v-bind="attrs"
                    v-on="on"
                    @click.stop="$emit('edit')">
                    <!-- Outer Glow Effect -->
                    <div v-if="isActive || isHovered" class="spool-glow" :style="{ backgroundColor: iconColor }" />

                    <!-- Main Spool SVG with Thick Ring -->
                    <div class="filament-spool" :class="{ 'spool-spinning': isLoading }">
                        <svg width="90" height="90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <!-- Circular mask for filament level -->
                                <mask :id="`level-mask-${gate.index}`">
                                    <rect x="0" y="0" width="100" height="100" fill="black" />
                                    <rect
                                        x="0"
                                        :y="100 - filamentLevel"
                                        width="100"
                                        :height="filamentLevel"
                                        fill="white" />
                                </mask>

                                <!-- Spinning animation for loading -->
                                <linearGradient :id="spinGradientId" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" :stop-color="iconColor" stop-opacity="0.4">
                                        <animate
                                            attributeName="stop-opacity"
                                            values="0.4;0.9;0.4"
                                            dur="1.5s"
                                            repeatCount="indefinite" />
                                    </stop>
                                    <stop offset="50%" :stop-color="iconColor" stop-opacity="0.7">
                                        <animate
                                            attributeName="stop-opacity"
                                            values="0.7;1;0.7"
                                            dur="1.5s"
                                            repeatCount="indefinite" />
                                    </stop>
                                    <stop offset="100%" :stop-color="iconColor" stop-opacity="0.4">
                                        <animate
                                            attributeName="stop-opacity"
                                            values="0.4;0.9;0.4"
                                            dur="1.5s"
                                            repeatCount="indefinite" />
                                    </stop>
                                </linearGradient>
                            </defs>

                            <!-- Background Ring (empty state) -->
                            <circle
                                cx="50"
                                cy="50"
                                r="36"
                                fill="none"
                                :stroke="iconColor"
                                stroke-width="16"
                                opacity="0.15"
                                class="ring-background" />

                            <!-- Filled Ring (shows filament level) -->
                            <circle
                                v-if="!isLoading"
                                cx="50"
                                cy="50"
                                r="36"
                                fill="none"
                                :stroke="iconColor"
                                stroke-width="16"
                                opacity="0.9"
                                class="ring-filled"
                                :mask="`url(#level-mask-${gate.index})`" />

                            <!-- Loading Ring (animated) -->
                            <circle
                                v-if="isLoading"
                                cx="50"
                                cy="50"
                                r="36"
                                fill="none"
                                :stroke="`url(#${spinGradientId})`"
                                stroke-width="8"
                                class="ring-loading" />

                            <!-- Gate Number in Center -->
                            <text
                                x="50"
                                y="50"
                                text-anchor="middle"
                                dominant-baseline="central"
                                class="gate-number"
                                :fill="numberColor"
                                font-size="28"
                                font-weight="bold">
                                {{ gate.index }}
                            </text>
                        </svg>
                    </div>

                    <!-- Status Icon Overlays -->
                    <div v-if="hasError" class="status-icon-overlay">
                        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="8" cy="8" r="8" fill="#F44336" />
                            <text x="8" y="12" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                                !
                            </text>
                        </svg>
                    </div>
                    <div v-else-if="isActive && !isLoading" class="status-icon-overlay">
                        <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="7" cy="7" r="7" fill="#4CAF50" />
                            <path
                                d="M3 7 L6 10 L11 4"
                                stroke="white"
                                stroke-width="2"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <div v-else-if="isLoading" class="status-icon-overlay">
                        <v-progress-circular indeterminate color="#2196F3" :size="12" :width="2" />
                    </div>
                </div>
            </template>
            <span>{{ $t('Panels.AcePanel.ClickToEdit') }}</span>
        </v-tooltip>

        <!-- Material Info -->
        <v-tooltip bottom>
            <template #activator="{ on, attrs }">
                <div class="text-center material-info" v-bind="attrs" v-on="on">
                    <span class="text-caption font-weight-bold d-block">{{ materialDisplay }}</span>
                </div>
            </template>
            <span>{{ $t('Panels.AcePanel.ClickToActivateTool', { tool: gate.index }) }}</span>
        </v-tooltip>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import AceMixin, { AceGate } from '@/components/mixins/ace'

@Component
export default class AcePanelGateBody extends Mixins(AceMixin) {
    @Prop({ type: Object, required: true }) readonly gate!: AceGate

    isHovered = false

    mounted() {
        // Add hover listeners
        this.$el.addEventListener('mouseenter', this.onMouseEnter)
        this.$el.addEventListener('mouseleave', this.onMouseLeave)
    }

    beforeDestroy() {
        this.$el.removeEventListener('mouseenter', this.onMouseEnter)
        this.$el.removeEventListener('mouseleave', this.onMouseLeave)
    }

    onMouseEnter() {
        this.isHovered = true
    }

    onMouseLeave() {
        this.isHovered = false
    }

    get isActive(): boolean {
        return this.gate.loaded === true || this.gate.selected === true
    }

    get isLoading(): boolean {
        const status = this.gate.status?.toLowerCase() ?? ''
        return ['feeding', 'unwinding', 'shifting', 'preload', 'loading', 'unloading'].includes(status)
    }

    get isEmpty(): boolean {
        return this.gate.status?.toLowerCase() === 'empty'
    }

    get hasError(): boolean {
        return this.gate.status?.toLowerCase() === 'error'
    }

    // Filament level as percentage (0-100)
    get filamentLevel(): number {
        // This would come from backend data in production
        // For now, derive from status
        const status = this.gate.status?.toLowerCase() ?? 'empty'

        if (status === 'empty') return 0
        if (status === 'ready' || status === 'loaded') return 100
        if (status === 'preload') return 50

        // Mock data based on gate index for visualization
        return Math.max(20, 100 - this.gate.index * 15)
    }

    changeTool() {
        if (!this.isLoading) {
            this.aceChangeTool(this.gate.index)
        }
    }

    get iconColor(): string {
        const color = this.gate.color
        return color.startsWith('#') ? color : `#${color}`
    }

    get numberColor(): string {
        // Calculate luminance and return high-contrast color for gate number
        const color = this.iconColor.replace('#', '')
        const r = parseInt(color.substr(0, 2), 16)
        const g = parseInt(color.substr(2, 2), 16)
        const b = parseInt(color.substr(4, 2), 16)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        // Use brighter white and darker black for better contrast
        return luminance > 0.5 ? '#aaaaaa' : '#FFFFFF'
    }

    get materialDisplay(): string {
        return this.gate.material || 'PLA'
    }

    get maskId(): string {
        return `spool-mask-${this.gate.index}`
    }

    get fillGradientId(): string {
        return `fill-gradient-${this.gate.index}`
    }

    get spinGradientId(): string {
        return `spin-gradient-${this.gate.index}`
    }
}
</script>

<style scoped>
/* Gate Body Container */
.gate-body-container {
    position: relative;
    transition: all 0.3s ease;
    cursor: pointer;
}

.gate-body-container.is-active {
    background-color: rgba(76, 175, 80, 0.05);
}

.gate-body-container.is-loading {
    pointer-events: none;
    opacity: 0.9;
}

/* Filament Spool Wrapper */
.filament-spool-wrapper {
    position: relative;
    display: inline-block;
}

/* Gate Number - Enhanced Contrast */
.gate-number {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.filament-spool {
    transition: transform 0.3s ease;
    position: relative;
    z-index: 2;
}

.filament-spool:hover {
    transform: scale(1.1);
}

/* Spinning Animation for Loading State */
.spool-spinning {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

/* Outer Glow Effect */
.spool-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    opacity: 0.3;
    filter: blur(15px);
    z-index: 1;
    animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
    0%,
    100% {
        opacity: 0.2;
        transform: translate(-50%, -50%) scale(1);
    }
    50% {
        opacity: 0.4;
        transform: translate(-50%, -50%) scale(1.1);
    }
}

/* Status Icon Overlay */
.status-icon-overlay {
    position: absolute;
    top: 2px;
    right: 2px;
    z-index: 4;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Material Info */
.material-info {
    transition: all 0.2s ease;
}

.material-info:hover {
    transform: scale(1.05);
}

/* Hover State for Gate Body */
.gate-body-container:hover .filament-spool {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}
</style>
