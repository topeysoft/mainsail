<template>
    <div
        class="ace-gate d-flex flex-column"
        :class="[gateStatusClass, gateStateClasses]"
        :style="gateStyle">
        <!-- Selection Pulse Ring -->
        <div v-if="isSelected" class="selection-pulse-ring" :style="{ borderColor: borderColor }" />

        <!-- Gate Content -->
        <ace-panel-gate-body :gate="gate" @edit="showEditDialog = true" />
        <ace-panel-gate-actions :gate="gate" />

        <!-- Edit Dialog -->
        <ace-gate-map-dialog :show="showEditDialog" :gate="gate" @close="showEditDialog = false" />
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin, { AceGate } from '@/components/mixins/ace'

@Component
export default class AcePanelGate extends Mixins(BaseMixin, AceMixin) {
    @Prop({ type: Object, required: true }) readonly gate!: AceGate

    showEditDialog = false

    // Force component to react to gate prop changes
    @Watch('gate', { deep: true, immediate: false })
    onGateChange() {
        // Force re-render when gate prop changes
        this.$forceUpdate()
    }

    get gateStatusClass() {
        return {
            'darken-3': this.$vuetify.theme.dark,
            'lighten-2': !this.$vuetify.theme.dark,
        }
    }

    get gateStateClasses() {
        return {
            'gate-selected': this.isSelected,
            'gate-loaded': this.isLoaded,
            'gate-empty': this.isEmpty,
            'gate-error': this.hasError,
            'gate-loading': this.isLoading,
        }
    }

    get isSelected(): boolean {
        return this.gate.selected === true
    }

    get isLoaded(): boolean {
        return this.gate.loaded === true
    }

    get isEmpty(): boolean {
        return this.gate.status?.toLowerCase() === 'empty'
    }

    get hasError(): boolean {
        return this.gate.status?.toLowerCase() === 'error'
    }

    get isLoading(): boolean {
        const status = this.gate.status?.toLowerCase() ?? ''
        return ['feeding', 'unwinding', 'shifting', 'preload', 'loading', 'unloading'].includes(status)
    }

    get borderColor(): string {
        // Border color based on state, not material color
        if (this.hasError) return '#F44336' // Red for errors
        if (this.isLoading) return '#2196F3' // Blue for loading
        if (this.isSelected || this.isLoaded) return '#4CAF50' // Green for loaded/selected
        if (this.isEmpty) return 'rgba(128, 128, 128, 0.3)' // Gray for empty
        return 'rgba(255, 255, 255, 0.2)' // Default subtle border
    }

    get gateStyle() {
        return {
            borderColor: this.borderColor,
        }
    }
}
</script>

<style scoped>
.ace-gate {
    border-radius: 8px;
    box-sizing: border-box !important;
    border-width: 2px;
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.1);
    min-height: 106px;
    background-color: rgba(255, 255, 255, 0.05);
    position: relative;
    transition: all 0.3s ease;
    overflow: visible;
}

/* Hover Effect with Glow */
.ace-gate:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-width: 3px;
}

/* Selected State with Pulse Animation */
.ace-gate.gate-selected {
    border-width: 3px;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3), 0 4px 12px rgba(76, 175, 80, 0.2);
    animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
    0%,
    100% {
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3), 0 4px 12px rgba(76, 175, 80, 0.2);
    }
    50% {
        box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.5), 0 6px 16px rgba(76, 175, 80, 0.4);
    }
}

/* Selection Pulse Ring */
.selection-pulse-ring {
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border-radius: 12px;
    border: 2px solid;
    opacity: 0.6;
    pointer-events: none;
    animation: pulse-ring-expand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    z-index: -1;
}

@keyframes pulse-ring-expand {
    0% {
        transform: scale(1);
        opacity: 0.6;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.3;
    }
    100% {
        transform: scale(1);
        opacity: 0.6;
    }
}

/* Loaded State */
.ace-gate.gate-loaded {
    background-color: rgba(76, 175, 80, 0.08);
}

/* Empty State */
.ace-gate.gate-empty {
    opacity: 0.7;
    background-color: rgba(128, 128, 128, 0.03);
}

.ace-gate.gate-empty:hover {
    opacity: 0.9;
}

/* Error State */
.ace-gate.gate-error {
    border-color: #f44336 !important;
    background-color: rgba(244, 67, 54, 0.08);
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%,
    100% {
        transform: translateX(0);
    }
    25% {
        transform: translateX(-4px);
    }
    75% {
        transform: translateX(4px);
    }
}

/* Loading State */
.ace-gate.gate-loading {
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 100%
    );
    background-size: 200% 100%;
    animation: loading-shimmer 1.5s ease-in-out infinite;
}

@keyframes loading-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

/* Theme-specific adjustments */
html.theme--dark .ace-gate.gate-loading {
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.03) 0%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.03) 100%
    );
    background-size: 200% 100%;
}

html.theme--light .ace-gate.gate-loading {
    background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.02) 0%,
        rgba(0, 0, 0, 0.06) 50%,
        rgba(0, 0, 0, 0.02) 100%
    );
    background-size: 200% 100%;
}
</style>
