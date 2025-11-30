<template>
    <v-expansion-panels flat accordion class="ace-device-row">
        <v-expansion-panel :class="{ 'device-has-issues': hasIssues }">
            <!-- Collapsed Header - Minimal Info -->
            <v-expansion-panel-header class="device-header pa-3">
                <div class="d-flex align-center w-100">
                    <!-- Status Indicator -->
                    <v-icon :color="statusColor" class="mr-3">{{ mdiCircle }}</v-icon>

                    <!-- Device Name/Alias -->
                    <div class="device-name mr-4">
                        <div v-if="hasAlias">
                            <div class="text-h5 font-weight-bold">{{ device.alias }}</div>
                            <div class="text-caption text--secondary" style="font-size: 0.65rem; margin-top: -2px;">{{ device.device_id }}</div>
                        </div>
                        <div v-else>
                            <div class="text-subtitle-1 font-weight-medium text--secondary">{{ device.device_id || device.name || 'Unknown Device' }}</div>
                            <div class="text-caption text--disabled" style="font-size: 0.7rem; margin-top: -2px;">{{ $t('Panels.AcePanel.NoFriendlyName') }}</div>
                        </div>
                    </div>

                    <v-spacer />

                    <!-- Gate Range -->
                    <v-chip x-small outlined class="mr-3">
                        <v-icon x-small left>{{ mdiPrinter3dNozzle }}</v-icon>
                        T{{ device.gate_offset }} - T{{ device.gate_offset + 3 }}
                    </v-chip>

                    <!-- Connection Quality Bars -->
                    <div class="signal-bars-inline mr-3">
                        <div
                            v-for="i in 5"
                            :key="`bar-${i}`"
                            class="signal-bar-mini"
                            :class="{ active: i <= connectionQualityBars }"
                            :style="{ height: `${i * 2 + 4}px` }" />
                    </div>

                    <!-- Health Score -->
                    <v-chip x-small :color="healthScoreColor" text-color="white" class="mr-2">
                        {{ healthScore }}
                    </v-chip>
                </div>
            </v-expansion-panel-header>

            <!-- Expanded Content - Details on Demand -->
            <v-expansion-panel-content class="pt-2">
                <!-- Friendly Name Editor Section -->
                <v-row dense class="mb-3">
                    <v-col cols="12">
                        <div class="metric-section">
                            <div class="text-body-2 font-weight-bold mb-2">
                                <v-icon small class="mr-1">{{ mdiTag }}</v-icon>
                                {{ $t('Panels.AcePanel.FriendlyName') }}
                            </div>
                            <div class="d-flex align-center gap-2">
                                <v-text-field
                                    v-model="aliasInput"
                                    :placeholder="$t('Panels.AcePanel.EnterFriendlyName')"
                                    :rules="[aliasValidationRule]"
                                    dense
                                    outlined
                                    class="flex-grow-1"
                                    @keyup.enter="saveAlias"
                                    @input="validateAliasInput">
                                    <template #prepend-inner>
                                        <v-icon small color="grey">{{ mdiLabel }}</v-icon>
                                    </template>
                                </v-text-field>
                                <v-btn
                                    small
                                    color="primary"
                                    :disabled="!aliasChanged"
                                    @click="saveAlias">
                                    <v-icon small left>{{ mdiContentSave }}</v-icon>
                                    {{ $t('Panels.AcePanel.Save') }}
                                </v-btn>
                                <v-btn
                                    v-if="hasAlias"
                                    small
                                    outlined
                                    @click="clearAlias">
                                    <v-icon small left>{{ mdiClose }}</v-icon>
                                    {{ $t('Panels.AcePanel.Clear') }}
                                </v-btn>
                            </div>
                            <div class="text-caption text--secondary mt-2">
                                {{ $t('Panels.AcePanel.FriendlyNameDescription') }}
                            </div>
                        </div>
                    </v-col>
                </v-row>

                <!-- Key Metrics (Only if Relevant) -->
                <v-row dense class="mb-3">
                    <!-- Show Errors only if > 0 -->
                    <v-col v-if="device.health?.error_count > 0" cols="6" sm="4">
                        <div class="metric-card-mini">
                            <v-icon small :color="errorIconColor" class="mr-1">{{ mdiAlertCircleOutline }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.Errors') }}: </span>
                            <span class="text-subtitle-2 font-weight-bold" :class="errorClass">
                                {{ device.health.error_count }}
                            </span>
                        </div>
                    </v-col>

                    <!-- Response Time -->
                    <v-col cols="6" sm="4">
                        <div class="metric-card-mini">
                            <v-icon small :color="responseTimeColor" class="mr-1">{{ mdiSpeedometer }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.Response') }}: </span>
                            <span class="text-subtitle-2 font-weight-bold">
                                {{ device.health?.avg_response_time_ms || 0 }}ms
                            </span>
                        </div>
                    </v-col>

                    <!-- Show Temperature only if > 0°C or if reported -->
                    <v-col v-if="device.health?.temperature !== undefined && device.health.temperature > 0" cols="6" sm="4">
                        <div class="metric-card-mini">
                            <v-icon small :color="temperatureColor" class="mr-1">{{ mdiThermometer }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.DeviceTemp') }}: </span>
                            <span class="text-subtitle-2 font-weight-bold">
                                {{ device.health.temperature }}°C
                            </span>
                        </div>
                    </v-col>

                    <!-- Uptime -->
                    <v-col cols="6" sm="4">
                        <div class="metric-card-mini">
                            <v-icon small color="primary" class="mr-1">{{ mdiClockOutline }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.Uptime') }}: </span>
                            <span class="text-subtitle-2 font-weight-bold">{{ uptimeFormatted }}</span>
                        </div>
                    </v-col>
                </v-row>

                <!-- Dryer Management -->
                <v-row dense class="mb-3">
                    <v-col cols="12">
                        <ace-panel-device-dryer-card v-if="deviceDryer" :device="deviceDryer" />
                        <v-card v-else outlined class="pa-3">
                            <div class="text-center text--secondary">
                                <v-icon>{{ mdiHairDryer }}</v-icon>
                                <p class="text-caption mb-0 mt-1">{{ $t('Panels.AcePanel.NoDryerAvailable') }}</p>
                            </div>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Actions -->
                <v-row dense class="mb-2">
                    <v-col cols="12">
                        <div class="d-flex gap-2 flex-wrap">
                            <v-btn x-small outlined @click="copyDeviceId">
                                <v-icon x-small left>{{ mdiContentCopy }}</v-icon>
                                {{ $t('Panels.AcePanel.CopyDeviceID') }}
                            </v-btn>
                            <v-btn x-small outlined @click="reconnect">
                                <v-icon x-small left>{{ mdiRefresh }}</v-icon>
                                {{ $t('Panels.AcePanel.Reconnect') }}
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>

                <!-- Diagnostics Section (Collapsible) -->
                <v-expansion-panels flat accordion>
                    <v-expansion-panel>
                        <v-expansion-panel-header class="px-0 py-2">
                            <span class="text-caption font-weight-bold">
                                <v-icon x-small class="mr-1">{{ mdiChartLine }}</v-icon>
                                {{ $t('Panels.AcePanel.Diagnostics') }}
                            </span>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <v-simple-table dense class="diagnostics-table">
                                <tbody>
                                    <tr>
                                        <td class="text-caption">{{ $t('Panels.AcePanel.Port') }}</td>
                                        <td class="text-caption font-weight-mono text-right">{{ device.port }}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-caption">{{ $t('Panels.AcePanel.DeviceID') }}</td>
                                        <td class="text-caption font-weight-mono text-right">{{ device.device_id }}</td>
                                    </tr>
                                    <tr v-if="device.model">
                                        <td class="text-caption">{{ $t('Panels.AcePanel.Model') }}</td>
                                        <td class="text-caption text-right">{{ device.model }} v{{ device.firmware || '1.0' }}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-caption">{{ $t('Panels.AcePanel.ConnectionQuality') }}</td>
                                        <td class="text-caption text-right">
                                            {{ connectionQualityText }} ({{ device.health?.avg_response_time_ms || 0 }}ms)
                                        </td>
                                    </tr>
                                    <tr v-if="device.health?.last_error">
                                        <td class="text-caption">{{ $t('Panels.AcePanel.LastError') }}</td>
                                        <td class="text-caption error--text text-right">{{ device.health.last_error }}</td>
                                    </tr>
                                    <tr v-if="device.health?.reconnect_count !== undefined">
                                        <td class="text-caption">{{ $t('Panels.AcePanel.Reconnections') }}</td>
                                        <td class="text-caption text-right">{{ device.health.reconnect_count }}</td>
                                    </tr>
                                    <tr v-if="device.health?.packets_sent !== undefined">
                                        <td class="text-caption">{{ $t('Panels.AcePanel.PacketsSent') }}</td>
                                        <td class="text-caption text-right">{{ device.health.packets_sent }}</td>
                                    </tr>
                                    <tr v-if="device.health?.packets_received !== undefined">
                                        <td class="text-caption">{{ $t('Panels.AcePanel.PacketsReceived') }}</td>
                                        <td class="text-caption text-right">{{ device.health.packets_received }}</td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

                <!-- Issue Alert -->
                <v-alert v-if="hasIssues" dense outlined type="warning" class="mt-3 mb-0" text>
                    <div class="text-caption">{{ issuesText }}</div>
                </v-alert>
            </v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import {
    mdiCircle,
    mdiAlertCircleOutline,
    mdiThermometer,
    mdiClockOutline,
    mdiPrinter3dNozzle,
    mdiTag,
    mdiLabel,
    mdiContentCopy,
    mdiContentSave,
    mdiRefresh,
    mdiChartLine,
    mdiClose,
    mdiSpeedometer,
    mdiHairDryer,
} from '@mdi/js'

@Component({
    components: {
        AcePanelDeviceDryerCard: () => import('./AcePanelDeviceDryerCard.vue'),
    },
})
export default class AcePanelDeviceCard extends Mixins(BaseMixin, AceMixin) {
    @Prop({ type: Object, required: true }) readonly device!: any

    mdiCircle = mdiCircle
    mdiAlertCircleOutline = mdiAlertCircleOutline
    mdiThermometer = mdiThermometer
    mdiClockOutline = mdiClockOutline
    mdiPrinter3dNozzle = mdiPrinter3dNozzle
    mdiTag = mdiTag
    mdiLabel = mdiLabel
    mdiContentCopy = mdiContentCopy
    mdiContentSave = mdiContentSave
    mdiRefresh = mdiRefresh
    mdiChartLine = mdiChartLine
    mdiClose = mdiClose
    mdiSpeedometer = mdiSpeedometer
    mdiHairDryer = mdiHairDryer

    aliasInput = ''

    mounted() {
        this.aliasInput = this.device.alias || ''
    }

    @Watch('device.alias')
    onAliasChange(newAlias: string) {
        this.aliasInput = newAlias || ''
    }

    get deviceDisplayName(): string {
        // Show alias if set, otherwise show device_id
        return this.device.alias || this.device.device_id || this.device.name || 'Unknown Device'
    }

    get hasAlias(): boolean {
        return !!(this.device.alias && this.device.alias !== this.device.device_id)
    }

    get aliasChanged(): boolean {
        const currentAlias = this.device.alias || ''
        return this.aliasInput.trim() !== currentAlias && this.aliasInput.trim() !== ''
    }

    get statusColor(): string {
        if (this.hasIssues) return 'warning'
        const connected = this.device.connected ?? false
        return connected ? 'success' : 'error'
    }

    get healthScore(): number {
        let score = 100
        const errorCount = this.device.health?.error_count ?? 0
        score -= Math.min(errorCount * 5, 50)
        const responseTime = this.device.health?.avg_response_time_ms ?? 0
        if (responseTime > 300) score -= 30
        else if (responseTime > 150) score -= 15
        else if (responseTime > 50) score -= 5
        const temp = this.device.health?.temperature ?? 0
        if (temp > 70) score -= 20
        else if (temp > 60) score -= 10
        const connected = this.device.connected ?? false
        if (!connected) score -= 50
        return Math.max(0, Math.min(100, score))
    }

    get healthScoreColor(): string {
        if (this.healthScore >= 80) return 'success'
        if (this.healthScore >= 60) return 'info'
        if (this.healthScore >= 40) return 'warning'
        return 'error'
    }

    get connectionQualityBars(): number {
        const responseTime = this.device.health?.avg_response_time_ms ?? 999
        const connected = this.device.connected ?? false
        if (!connected) return 0
        if (responseTime < 50) return 5
        if (responseTime < 100) return 4
        if (responseTime < 200) return 3
        if (responseTime < 400) return 2
        return 1
    }

    get connectionQualityText(): string {
        const bars = this.connectionQualityBars
        if (bars === 0) return this.$t('Panels.AcePanel.Disconnected').toString()
        if (bars === 5) return this.$t('Panels.AcePanel.Excellent').toString()
        if (bars === 4) return this.$t('Panels.AcePanel.Good').toString()
        if (bars === 3) return this.$t('Panels.AcePanel.Fair').toString()
        if (bars === 2) return this.$t('Panels.AcePanel.Poor').toString()
        return this.$t('Panels.AcePanel.VeryPoor').toString()
    }

    get responseTimeColor(): string {
        const responseTime = this.device.health?.avg_response_time_ms ?? 0
        if (responseTime < 50) return 'success'
        if (responseTime < 150) return 'info'
        if (responseTime < 300) return 'warning'
        return 'error'
    }

    get uptimeFormatted(): string {
        const uptime = this.device.health?.uptime ?? 0
        if (uptime === 0) return 'N/A'
        const days = Math.floor(uptime / 86400)
        const hours = Math.floor((uptime % 86400) / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)
        if (days > 0) return `${days}d ${hours}h`
        else if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    get errorClass(): string {
        const errorCount = this.device.health?.error_count ?? 0
        if (errorCount === 0) return 'success--text'
        if (errorCount < 5) return 'warning--text'
        return 'error--text'
    }

    get errorIconColor(): string {
        const errorCount = this.device.health?.error_count ?? 0
        if (errorCount === 0) return 'success'
        if (errorCount < 5) return 'warning'
        return 'error'
    }

    get temperatureColor(): string {
        const temp = this.device.health?.temperature ?? 0
        if (temp < 40) return 'info'
        if (temp < 55) return 'success'
        if (temp < 65) return 'warning'
        return 'error'
    }

    get hasIssues(): boolean {
        const errorCount = this.device.health?.error_count ?? 0
        const temp = this.device.health?.temperature ?? 0
        const responseTime = this.device.health?.avg_response_time_ms ?? 0
        const connected = this.device.connected ?? false
        return errorCount > 5 || temp > 65 || responseTime > 300 || !connected
    }

    get issuesText(): string {
        const issues: string[] = []
        const errorCount = this.device.health?.error_count ?? 0
        if (errorCount > 10) issues.push(this.$t('Panels.AcePanel.HighErrorCount').toString())
        else if (errorCount > 5) issues.push(this.$t('Panels.AcePanel.ModerateErrorCount').toString())
        const temp = this.device.health?.temperature ?? 0
        if (temp > 70) issues.push(this.$t('Panels.AcePanel.CriticalTemp').toString())
        else if (temp > 65) issues.push(this.$t('Panels.AcePanel.HighTemp').toString())
        const responseTime = this.device.health?.avg_response_time_ms ?? 0
        if (responseTime > 400) issues.push(this.$t('Panels.AcePanel.VerySlowResponse').toString())
        else if (responseTime > 300) issues.push(this.$t('Panels.AcePanel.SlowResponse').toString())
        const connected = this.device.connected ?? false
        if (!connected) issues.push(this.$t('Panels.AcePanel.DeviceDisconnected').toString())
        return issues.join('. ')
    }

    get deviceDryer(): any | null {
        // The device prop already contains dryer status in device.status.dryer_status
        // If device has dryer data, return the device itself (it's the expected format)
        if (this.device.status?.dryer_status) {
            return this.device
        }

        // Fallback: Check ace.dryers array for multi-device dryer data
        const dryers = this.ace.dryers ?? []
        const dryerData = dryers.find((d: any) => d.device_id === this.device.device_id)

        if (dryerData) {
            // Map dryer data to device format expected by AcePanelDeviceDryerCard
            return {
                device_id: this.device.device_id,
                device_name: this.device.name || this.device.alias,
                name: this.device.name,
                gate_offset: this.device.gate_offset,
                status: {
                    temp: dryerData.current_temp ?? 0,
                    dryer_status: {
                        status: dryerData.status,
                        target_temp: dryerData.target_temp,
                        duration: dryerData.duration,
                        remain_time: dryerData.remain_time,
                    }
                }
            }
        }

        // No dryer data available
        return null
    }

    aliasValidationRule(value: string): boolean | string {
        if (!value || value.trim() === '') return true
        const validPattern = /^[a-zA-Z0-9_]+$/
        if (!validPattern.test(value)) {
            return this.$t('Panels.AcePanel.InvalidAlias').toString()
        }
        return true
    }

    validateAliasInput(value: string) {
        // Remove invalid characters as user types
        const cleaned = value.replace(/[^a-zA-Z0-9_]/g, '')
        if (cleaned !== value) {
            this.aliasInput = cleaned
        }
    }

    saveAlias() {
        if (this.aliasInput.trim() && this.aliasChanged) {
            // Validate before saving
            const validation = this.aliasValidationRule(this.aliasInput)
            if (validation === true) {
                this.doSendAce(`ACE_ALIAS DEVICE=${this.device.device_id} NAME=${this.aliasInput.trim()}`)
                this.$toast.success(this.$t('Panels.AcePanel.FriendlyNameSaved').toString())
            } else {
                this.$toast.error(validation)
            }
        }
    }

    clearAlias() {
        this.doSendAce(`ACE_UNALIAS DEVICE=${this.device.device_id}`)
        this.aliasInput = ''
        this.$toast.success(this.$t('Panels.AcePanel.FriendlyNameCleared').toString())
    }

    copyDeviceId() {
        navigator.clipboard.writeText(this.device.device_id)
        this.$toast.success(this.$t('Panels.AcePanel.DeviceIDCopied').toString())
    }

    reconnect() {
        this.doSendAce(`ACE_RECONNECT_DEVICE DEVICE=${this.device.device_id}`)
        this.$toast.info(this.$t('Panels.AcePanel.ReconnectingDevice').toString())
    }
}
</script>

<style scoped>
.ace-device-row {
    margin-bottom: 8px;
}

.device-header {
    border-left: 4px solid transparent;
    transition: all 0.2s ease;
}

.device-has-issues .device-header {
    border-left-color: var(--v-warning-base);
}

.device-name {
    min-width: 150px;
}

/* Mini Signal Bars for Collapsed View */
.signal-bars-inline {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 14px;
}

.signal-bar-mini {
    width: 3px;
    background-color: rgba(128, 128, 128, 0.2);
    border-radius: 1px;
    transition: all 0.3s ease;
}

.signal-bar-mini.active {
    background-color: var(--v-success-base);
}

.gap-1 {
    gap: 4px;
}

.gap-2 {
    gap: 8px;
}

/* Metric Sections */
.metric-section {
    padding: 12px;
    border-radius: 8px;
    background-color: rgba(var(--v-theme-surface), 0.03);
    border: 1px solid rgba(128, 128, 128, 0.1);
}

.metric-card-mini {
    padding: 8px;
    border-radius: 6px;
    background-color: rgba(var(--v-theme-surface), 0.03);
    border: 1px solid rgba(128, 128, 128, 0.1);
    display: flex;
    align-items: center;
}

/* Diagnostics Table */
.diagnostics-table {
    background-color: transparent !important;
}

.diagnostics-table td {
    border-bottom: 1px solid rgba(128, 128, 128, 0.1) !important;
    padding: 4px 8px !important;
}

.diagnostics-table tbody tr:last-child td {
    border-bottom: none !important;
}

.font-weight-mono {
    font-family: monospace;
    font-size: 0.9em;
}
</style>

<style>
/* Dark theme adjustments */
html.theme--dark .signal-bar-mini {
    background-color: rgba(255, 255, 255, 0.1);
}

html.theme--dark .metric-section,
html.theme--dark .metric-card-mini,
html.theme--dark .gate-mini-card {
    background-color: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
}

/* Light theme adjustments */
html.theme--light .signal-bar-mini {
    background-color: rgba(0, 0, 0, 0.05);
}

html.theme--light .metric-section,
html.theme--light .metric-card-mini,
html.theme--light .gate-mini-card {
    background-color: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.08);
}
</style>
