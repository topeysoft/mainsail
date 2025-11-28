<template>
    <v-card outlined class="device-gate-group mb-3">
        <!-- Device Header -->
        <v-card-title class="py-2 px-3" @click="toggleExpanded" style="cursor: pointer">
            <v-row align="center" no-gutters>
                <v-col cols="auto">
                    <v-icon :class="{ 'rotate-icon': !expanded }">{{ mdiChevronDown }}</v-icon>
                </v-col>
                <v-col>
                    <span class="text-subtitle-1 font-weight-bold ml-2">{{ device.name }}</span>
                    <span class="text-caption text--secondary ml-2">({{ $t('Panels.AcePanel.GatesRange', { start: gateRange.start, end: gateRange.end }) }})</span>
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
        return this.device.connection_status?.charAt(0).toUpperCase() +
               this.device.connection_status?.slice(1) || 'Unknown'
    }

    get statusColor(): string {
        switch (this.device.connection_status) {
            case 'connected':
                return 'success'
            case 'disconnected':
                return 'error'
            default:
                return 'grey'
        }
    }

    get statusIcon(): string {
        switch (this.device.connection_status) {
            case 'connected':
                return this.mdiCheckCircle
            case 'disconnected':
                return this.mdiAlertCircle
            default:
                return this.mdiHelpCircle
        }
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
</style>
