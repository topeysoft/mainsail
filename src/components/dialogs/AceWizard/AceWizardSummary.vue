<template>
    <div class="wizard-summary">
        <div class="text-center mb-4">
            <v-icon size="64" color="success">{{ mdiCheckCircleOutline }}</v-icon>
            <h3 class="text-h6 mt-3">{{ $t('Panels.AcePanel.SetupWizard.ReadyToComplete') }}</h3>
            <p class="text-body-2 grey--text">
                {{ $t('Panels.AcePanel.SetupWizard.ReviewConfiguration') }}
            </p>
        </div>

        <!-- Devices Summary -->
        <v-card outlined class="mb-3">
            <v-card-title class="text-subtitle-1 py-2">
                <v-icon left>{{ mdiServer }}</v-icon>
                {{ $t('Panels.AcePanel.SetupWizard.Devices') }}
                <v-spacer />
                <v-btn x-small text color="primary" @click="$emit('edit-step', 1)">
                    <v-icon x-small left>{{ mdiPencil }}</v-icon>
                    {{ $t('Panels.AcePanel.SetupWizard.Edit') }}
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text>
                <v-simple-table dense>
                    <template #default>
                        <thead>
                            <tr>
                                <th>{{ $t('Panels.AcePanel.SetupWizard.DeviceName') }}</th>
                                <th>{{ $t('Panels.AcePanel.SetupWizard.GateRange') }}</th>
                                <th>{{ $t('Panels.AcePanel.SetupWizard.Status') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="device in devices" :key="device.deviceId">
                                <td>
                                    <span class="font-weight-medium">{{ device.alias || device.deviceId }}</span>
                                </td>
                                <td>
                                    <v-chip x-small>
                                        {{ device.gateOffset }} - {{ device.gateOffset + 3 }}
                                    </v-chip>
                                </td>
                                <td>
                                    <v-icon
                                        small
                                        :color="device.connected ? 'success' : 'error'">
                                        {{ device.connected ? mdiCheckCircle : mdiAlertCircle }}
                                    </v-icon>
                                    {{ device.connected ? $t('Panels.AcePanel.SetupWizard.Connected') : $t('Panels.AcePanel.SetupWizard.Disconnected') }}
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card-text>
        </v-card>

        <!-- Gates Summary -->
        <v-card outlined class="mb-3">
            <v-card-title class="text-subtitle-1 py-2">
                <v-icon left>{{ mdiGate }}</v-icon>
                {{ $t('Panels.AcePanel.SetupWizard.GateConfiguration') }}
                <v-spacer />
                <v-chip x-small class="mr-2">
                    {{ configuredGatesCount }} / {{ totalGatesCount }} {{ $t('Panels.AcePanel.SetupWizard.Configured') }}
                </v-chip>
                <v-btn x-small text color="primary" @click="$emit('edit-step', 2)">
                    <v-icon x-small left>{{ mdiPencil }}</v-icon>
                    {{ $t('Panels.AcePanel.SetupWizard.Edit') }}
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-card-text>
                <div class="gate-summary-grid">
                    <div
                        v-for="gate in gates"
                        :key="gate.index"
                        class="gate-summary-card"
                        :class="{ 'gate-configured': gate.configured }">
                        <div class="gate-header">
                            <span class="font-weight-bold">T{{ gate.index }}</span>
                            <v-icon v-if="gate.configured" x-small color="success">
                                {{ mdiCheckCircle }}
                            </v-icon>
                        </div>
                        <div class="d-flex align-center gap-2 mt-2">
                            <div
                                class="color-dot"
                                :style="{ backgroundColor: `#${gate.color}` }" />
                            <div class="flex-grow-1">
                                <div class="text-caption">
                                    {{ gate.material || '—' }}
                                </div>
                                <div class="text-caption grey--text">
                                    {{ gate.temp }}°C
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Settings Summary -->
        <v-card outlined class="mb-3">
            <v-card-title class="text-subtitle-1 py-2">
                <v-icon left>{{ mdiCog }}</v-icon>
                {{ $t('Panels.AcePanel.SetupWizard.Settings') }}
            </v-card-title>
            <v-divider />
            <v-card-text>
                <v-list dense>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title>{{ $t('Panels.AcePanel.EndlessSpool') }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ $t('Panels.AcePanel.SetupWizard.EndlessSpoolDescription') }}
                            </v-list-item-subtitle>
                        </v-list-item-content>
                        <v-list-item-action>
                            <v-switch
                                :input-value="endlessSpool"
                                color="primary"
                                hide-details
                                @change="$emit('toggle-endless-spool', $event)" />
                        </v-list-item-action>
                    </v-list-item>
                </v-list>
            </v-card-text>
        </v-card>

        <!-- Warnings -->
        <v-alert v-if="hasWarnings" type="warning" text class="mb-3">
            <div class="text-subtitle-2 mb-2">{{ $t('Panels.AcePanel.SetupWizard.Warnings') }}</div>
            <ul class="pl-4">
                <li v-if="unconfiguredGatesCount > 0">
                    {{ $t('Panels.AcePanel.SetupWizard.UnconfiguredGatesWarning', { count: unconfiguredGatesCount }) }}
                </li>
                <li v-if="disconnectedDevicesCount > 0">
                    {{ $t('Panels.AcePanel.SetupWizard.DisconnectedDevicesWarning', { count: disconnectedDevicesCount }) }}
                </li>
            </ul>
        </v-alert>

        <!-- Import/Export Configuration Options -->
        <v-expansion-panels flat>
            <!-- Import Configuration -->
            <v-expansion-panel>
                <v-expansion-panel-header>
                    <div>
                        <v-icon small left>{{ mdiUpload }}</v-icon>
                        {{ $t('Panels.AcePanel.SetupWizard.ImportConfiguration') }}
                    </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                    <p class="text-caption mb-2">
                        {{ $t('Panels.AcePanel.SetupWizard.ImportDescription') }}
                    </p>
                    <v-btn small outlined color="primary" @click="$refs.fileInput.click()">
                        <v-icon small left>{{ mdiUpload }}</v-icon>
                        {{ $t('Panels.AcePanel.SetupWizard.Import') }}
                    </v-btn>
                    <input
                        ref="fileInput"
                        type="file"
                        accept="application/json,.json"
                        style="display: none"
                        @change="importConfiguration" />
                </v-expansion-panel-content>
            </v-expansion-panel>

            <!-- Export Configuration -->
            <v-expansion-panel>
                <v-expansion-panel-header>
                    <div>
                        <v-icon small left>{{ mdiDownload }}</v-icon>
                        {{ $t('Panels.AcePanel.SetupWizard.ExportConfiguration') }}
                    </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                    <p class="text-caption mb-2">
                        {{ $t('Panels.AcePanel.SetupWizard.ExportDescription') }}
                    </p>
                    <v-btn small outlined @click="exportConfiguration">
                        <v-icon small left>{{ mdiDownload }}</v-icon>
                        {{ $t('Panels.AcePanel.SetupWizard.Export') }}
                    </v-btn>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import {
    mdiCheckCircleOutline,
    mdiServer,
    mdiGate,
    mdiCog,
    mdiPencil,
    mdiCheckCircle,
    mdiAlertCircle,
    mdiDownload,
    mdiUpload,
} from '@mdi/js'
import { DeviceSetupConfig, GateSetupConfig } from '@/store/ace/setup'

@Component
export default class AceWizardSummary extends Vue {
    mdiCheckCircleOutline = mdiCheckCircleOutline
    mdiServer = mdiServer
    mdiGate = mdiGate
    mdiCog = mdiCog
    mdiPencil = mdiPencil
    mdiCheckCircle = mdiCheckCircle
    mdiAlertCircle = mdiAlertCircle
    mdiDownload = mdiDownload
    mdiUpload = mdiUpload

    @Prop({ type: Array, required: true }) readonly devices!: DeviceSetupConfig[]
    @Prop({ type: Array, required: true }) readonly gates!: GateSetupConfig[]
    @Prop({ type: Boolean, default: false }) readonly endlessSpool!: boolean

    get configuredGatesCount(): number {
        return this.gates.filter((g) => g.configured).length
    }

    get totalGatesCount(): number {
        return this.gates.length
    }

    get unconfiguredGatesCount(): number {
        return this.totalGatesCount - this.configuredGatesCount
    }

    get disconnectedDevicesCount(): number {
        return this.devices.filter((d) => !d.connected).length
    }

    get hasWarnings(): boolean {
        return this.unconfiguredGatesCount > 0 || this.disconnectedDevicesCount > 0
    }

    async importConfiguration(event: Event) {
        const input = event.target as HTMLInputElement
        if (!input.files || input.files.length === 0) return

        const file = input.files[0]

        try {
            const text = await file.text()
            const config = JSON.parse(text)

            // Show confirmation dialog
            const confirmed = await this.$confirm(
                this.$t('Panels.AcePanel.SetupWizard.ImportWarning').toString(),
                this.$t('Panels.AcePanel.SetupWizard.ImportConfiguration').toString()
            )

            if (!confirmed) {
                input.value = ''
                return
            }

            // Import configuration via store action
            const result = await this.$store.dispatch('ace/setup/importConfiguration', config)

            // Show success or warnings
            if (result.warnings && result.warnings.length > 0) {
                const warningMsg = this.$t('Panels.AcePanel.SetupWizard.PartialImport').toString()
                this.$toast.warning(`${warningMsg}: ${result.warnings.join(', ')}`)
            } else {
                this.$toast.success(this.$t('Panels.AcePanel.SetupWizard.ImportSuccess').toString())
            }

            // Navigate to step 1 to review imported config
            this.$emit('edit-step', 0)
        } catch (error) {
            console.error('Failed to import configuration:', error)
            const errorMsg =
                error instanceof Error ? error.message : this.$t('Panels.AcePanel.SetupWizard.InvalidConfigFile')
            this.$toast.error(this.$t('Panels.AcePanel.SetupWizard.ImportFailed', { error: errorMsg }).toString())
        }

        // Reset file input
        input.value = ''
    }

    exportConfiguration() {
        const config = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            devices: this.devices.map((d) => ({
                deviceId: d.deviceId,
                alias: d.alias,
                gateOffset: d.gateOffset,
            })),
            gates: this.gates.map((g) => ({
                index: g.index,
                color: g.color,
                material: g.material,
                temp: g.temp,
            })),
            settings: {
                endlessSpool: this.endlessSpool,
            },
        }

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ace-config-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }
}
</script>

<style scoped>
.wizard-summary {
    max-width: 800px;
    margin: 0 auto;
}

.gate-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
}

.gate-summary-card {
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 6px;
    padding: 8px;
    transition: all 0.2s ease;
}

.gate-summary-card:hover {
    border-color: rgba(128, 128, 128, 0.4);
}

.gate-configured {
    background-color: rgba(76, 175, 80, 0.05);
    border-color: rgba(76, 175, 80, 0.3);
}

.gate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.color-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid rgba(128, 128, 128, 0.3);
    flex-shrink: 0;
}

.gap-2 {
    gap: 8px;
}
</style>
