<template>
    <v-card outlined class="device-gate-group mb-3">
        <!-- Device Header -->
        <v-card-title class="py-2 px-3" @click="toggleExpanded" style="cursor: pointer">
            <v-row align="center" no-gutters>
                <v-col cols="auto">
                    <v-icon :class="{ 'rotate-icon': !expanded }">{{ mdiChevronDown }}</v-icon>
                </v-col>
                <v-col>
                    <div class="d-flex align-center">
                        <span class="text-subtitle-1 font-weight-bold ml-2">{{ device.name }}</span>
                        <span class="text-caption text--secondary ml-2">({{ $t('Panels.AcePanel.GatesRange', { start: gateRange.start, end: gateRange.end }) }})</span>

                        <!-- Mini Gate Preview (Collapsed Only) - Inline -->
                        <div v-if="!expanded" class="mini-gate-preview-inline d-flex align-center ml-4">
                            <div
                                v-for="gate in deviceGates"
                                :key="gate.index"
                                class="mini-gate-indicator-inline">
                                <v-tooltip top>
                                    <template #activator="{ on, attrs }">
                                        <div class="mini-gate-circle-wrapper" v-bind="attrs" v-on="on">
                                            <!-- Status dot overlay (only show for selected or empty) -->
                                            <div
                                                v-if="shouldShowStatusDot(gate)"
                                                class="mini-status-dot"
                                                :style="{ backgroundColor: getStatusColor(gate) }" />
                                            <!-- Colored circle -->
                                            <div
                                                class="mini-gate-circle"
                                                :style="{
                                                    borderColor: getGateColor(gate),
                                                    backgroundColor: isGateLoaded(gate) ? getGateColor(gate) + '20' : 'transparent'
                                                }">
                                                <span class="mini-gate-number">{{ gate.index }}</span>
                                            </div>
                                        </div>
                                    </template>
                                    <span>T{{ gate.index }}: {{ gate.material }} ({{ getStatusText(gate) }})</span>
                                </v-tooltip>
                            </div>
                        </div>
                    </div>
                </v-col>
                <v-col cols="auto">
                    <v-chip x-small :color="statusColor" text-color="white" class="mr-2">
                        <v-icon x-small left>{{ statusIcon }}</v-icon>
                        {{ connectionStatus }}
                    </v-chip>
                    <span v-if="device.health && device.health.uptime" class="text-caption text--secondary">
                        {{ $t('Panels.AcePanel.Uptime') }}: {{ uptimeFormatted }}
                    </span>
                </v-col>
            </v-row>
        </v-card-title>

        <!-- Gate Grid (Collapsible) -->
        <v-expand-transition>
            <v-card-text v-show="expanded" class="pt-0 pb-2">
                <v-row>
                    <v-col
                        v-for="gate in deviceGates"
                        :key="gate.index"
                        cols="6"
                        sm="6"
                        md="3"
                        class="pa-2">
                        <ace-panel-gate :gate="gate" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-expand-transition>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import { mdiChevronDown, mdiCheckCircle, mdiAlertCircle, mdiHelpCircle } from '@mdi/js'

@Component
export default class AcePanelDeviceGateGroup extends Mixins(BaseMixin, AceMixin) {
    @Prop({ type: Object, required: true }) readonly device!: any
    @Prop({ type: Boolean, default: true }) readonly defaultExpanded!: boolean

    mdiChevronDown = mdiChevronDown
    mdiCheckCircle = mdiCheckCircle
    mdiAlertCircle = mdiAlertCircle
    mdiHelpCircle = mdiHelpCircle

    expanded = this.defaultExpanded

    toggleExpanded() {
        this.expanded = !this.expanded
    }

    get deviceGates() {
        const offset = this.device.gate_offset ?? 0
        const gates = []
        for (let i = 0; i < 4; i++) {
            gates.push(this.getAceGate(offset + i))
        }
        return gates
    }

    get gateRange() {
        const offset = this.device.gate_offset ?? 0
        return {
            start: offset,
            end: offset + 3
        }
    }

    get connectionStatus(): string {
        const connected = this.device.connected ?? false
        return connected ? 'Connected' : 'Disconnected'
    }

    get statusColor(): string {
        const connected = this.device.connected ?? false
        return connected ? 'success' : 'error'
    }

    get statusIcon(): string {
        const connected = this.device.connected ?? false
        return connected ? this.mdiCheckCircle : this.mdiAlertCircle
    }

    get uptimeFormatted(): string {
        const uptime = this.device.health?.uptime ?? 0
        if (uptime === 0) return 'N/A'

        const hours = Math.floor(uptime / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    // Mini gate preview helpers
    getGateColor(gate: any): string {
        return '#' + (gate.color || '000000')
    }

    isGateLoaded(gate: any): boolean {
        return gate.loaded === true || gate.status?.toLowerCase() === 'loaded' || gate.status?.toLowerCase() === 'active'
    }

    getStatusColor(gate: any): string {
        const status = gate.status?.toLowerCase() || 'empty'

        // Error state
        if (status === 'error') return '#F44336' // Red

        // Loading states
        if (['feeding', 'unwinding', 'shifting', 'preload', 'loading', 'unloading'].includes(status)) {
            return '#2196F3' // Blue
        }

        // Loaded/Active state
        if (this.isGateLoaded(gate)) return '#4CAF50' // Green

        // Empty state
        return 'rgba(128, 128, 128, 0.5)' // Gray
    }

    getStatusText(gate: any): string {
        const status = gate.status || 'Empty'
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    shouldShowStatusDot(gate: any): boolean {
        // Show status dot only for selected/loaded or empty gates (matching main gate behavior)
        const status = gate.status?.toLowerCase() || 'empty'
        const isSelected = gate.selected === true
        const isEmpty = status === 'empty'

        return isSelected || this.isGateLoaded(gate) || isEmpty
    }
}
</script>

<style scoped>
.device-gate-group {
    transition: all 0.2s ease;
}

.device-gate-group:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rotate-icon {
    transform: rotate(-90deg);
    transition: transform 0.2s ease;
}

.v-card__title {
    user-select: none;
}

/* Mini Gate Preview Styles - Inline Layout */
.mini-gate-preview-inline {
    gap: 10px;
    align-items: center;
}

.mini-gate-indicator-inline {
    position: relative;
}

.mini-gate-circle-wrapper {
    position: relative;
    display: inline-block;
}

.mini-gate-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
}

.mini-gate-number {
    font-size: 0.7rem;
    font-weight: bold;
    color: currentColor;
}

.mini-status-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--v-background-base);
    z-index: 1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Hover effects */
.mini-gate-circle-wrapper:hover .mini-gate-circle {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
