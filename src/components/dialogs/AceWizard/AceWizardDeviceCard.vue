<template>
    <v-card outlined hover class="device-card">
        <v-card-text>
            <div class="d-flex align-center mb-3">
                <v-icon :color="device.connected ? 'success' : 'error'" class="mr-2">
                    {{ device.connected ? mdiCheckCircle : mdiAlertCircle }}
                </v-icon>
                <div class="flex-grow-1">
                    <div class="text-caption grey--text">{{ $t('Panels.AcePanel.SetupWizard.Device') }}</div>
                    <div class="text-body-2 font-weight-medium">{{ device.deviceId }}</div>
                </div>
            </div>

            <v-text-field
                :value="device.alias"
                :label="$t('Panels.AcePanel.SetupWizard.DeviceName')"
                :placeholder="suggestedName"
                outlined
                dense
                hide-details="auto"
                :hint="$t('Panels.AcePanel.SetupWizard.DeviceNameHint')"
                persistent-hint
                @input="onAliasChange">
                <template #prepend-inner>
                    <v-icon small>{{ mdiTag }}</v-icon>
                </template>
            </v-text-field>

            <v-divider class="my-3" />

            <div class="device-info">
                <div class="info-row">
                    <v-icon small class="mr-2">{{ mdiGate }}</v-icon>
                    <span class="text-caption">
                        {{ $t('Panels.AcePanel.SetupWizard.GateRange') }}:
                    </span>
                    <v-chip x-small class="ml-2">
                        {{ device.gateOffset }} - {{ device.gateOffset + 3 }}
                    </v-chip>
                </div>

                <div class="info-row mt-2">
                    <v-icon small class="mr-2">{{ mdiUsbPort }}</v-icon>
                    <span class="text-caption grey--text text-truncate">
                        {{ devicePortShort }}
                    </span>
                </div>

                <div v-if="!device.connected" class="info-row mt-2">
                    <v-alert dense text type="warning" class="ma-0 text-caption">
                        {{ $t('Panels.AcePanel.SetupWizard.DeviceDisconnected') }}
                    </v-alert>
                </div>
            </div>

            <!-- Quick Name Suggestions -->
            <div v-if="!device.alias" class="mt-3">
                <div class="text-caption grey--text mb-2">
                    {{ $t('Panels.AcePanel.SetupWizard.QuickNames') }}:
                </div>
                <div class="d-flex flex-wrap gap-1">
                    <v-chip
                        v-for="suggestion in nameSuggestions"
                        :key="suggestion"
                        x-small
                        outlined
                        @click="applySuggestion(suggestion)">
                        {{ suggestion }}
                    </v-chip>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { mdiCheckCircle, mdiAlertCircle, mdiTag, mdiGate, mdiUsbPort } from '@mdi/js'
import { DeviceSetupConfig } from '@/store/ace/setup'

@Component
export default class AceWizardDeviceCard extends Vue {
    mdiCheckCircle = mdiCheckCircle
    mdiAlertCircle = mdiAlertCircle
    mdiTag = mdiTag
    mdiGate = mdiGate
    mdiUsbPort = mdiUsbPort

    @Prop({ type: Object, required: true }) readonly device!: DeviceSetupConfig

    get devicePortShort(): string {
        // Shorten long USB port paths for display
        const port = this.device.port
        if (port.includes('/dev/serial/by-path/')) {
            const parts = port.split('/')
            return parts[parts.length - 1]
        }
        return port
    }

    get suggestedName(): string {
        // Generate suggested name based on gate offset
        const index = this.device.gateOffset / 4
        return `ACE_${index + 1}`
    }

    get nameSuggestions(): string[] {
        const index = this.device.gateOffset / 4
        const baseNumber = index + 1

        return [
            `ACE${baseNumber}`,
            `Tower${baseNumber}`,
            `Unit${baseNumber}`,
            this.getPositionName(index),
            this.getColorName(index),
        ].filter((name, idx, arr) => arr.indexOf(name) === idx) // Remove duplicates
    }

    getPositionName(index: number): string {
        const positions = ['Front', 'Rear', 'Left', 'Right', 'Center', 'Top', 'Bottom']
        return positions[index % positions.length]
    }

    getColorName(index: number): string {
        const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'White', 'Black']
        return colors[index % colors.length]
    }

    onAliasChange(value: string) {
        this.$emit('update', {
            deviceId: this.device.deviceId,
            updates: { alias: value },
        })
    }

    applySuggestion(name: string) {
        this.onAliasChange(name)
    }
}
</script>

<style scoped>
.device-card {
    transition: all 0.2s ease;
}

.device-card:hover {
    border-color: var(--v-primary-base);
}

.device-info {
    font-size: 0.875rem;
}

.info-row {
    display: flex;
    align-items: center;
}

.gap-1 {
    gap: 4px;
}

.text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
    display: inline-block;
}
</style>
