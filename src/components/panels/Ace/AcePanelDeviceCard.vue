<template>
    <v-card outlined class="ace-device-card" :class="{ 'card-has-issues': hasIssues }">
        <!-- Card Header -->
        <v-card-title class="py-2 px-3">
            <v-icon left :color="statusColor">{{ statusIcon }}</v-icon>
            <span class="text-subtitle-1 font-weight-bold">{{ device.name }}</span>
            <v-spacer />

            <!-- Health Score Badge -->
            <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                    <v-chip
                        x-small
                        :color="healthScoreColor"
                        text-color="white"
                        class="mr-2"
                        v-bind="attrs"
                        v-on="on">
                        <v-icon x-small left>{{ mdiHeart }}</v-icon>
                        {{ healthScore }}
                    </v-chip>
                </template>
                <span>{{ $t('Panels.AcePanel.DeviceHealth') }}: {{ healthScore }}/100</span>
            </v-tooltip>

            <!-- Connection Status -->
            <v-chip x-small :color="statusColor" text-color="white">
                <v-icon x-small left>{{ mdiSignal }}</v-icon>
                {{ connectionQualityText }}
            </v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text class="py-2 px-3">
            <!-- Basic Info -->
            <v-row dense class="mb-2">
                <v-col cols="12">
                    <div class="d-flex justify-space-between align-center">
                        <div>
                            <div class="text-caption text--secondary">{{ $t('Panels.AcePanel.Model') }}</div>
                            <div class="text-body-2">{{ device.model || 'ACE Pro' }} <span class="text-caption text--secondary">v{{ device.firmware || '1.0' }}</span></div>
                        </div>
                        <div class="text-right">
                            <div class="text-caption text--secondary">{{ $t('Panels.AcePanel.Gates') }}</div>
                            <div class="text-body-2 font-weight-bold">T{{ device.gate_offset }} - T{{ device.gate_offset + 3 }}</div>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <!-- Connection Quality Indicator -->
            <div class="connection-quality-section mb-3">
                <div class="d-flex align-center justify-space-between mb-1">
                    <span class="text-caption font-weight-bold">{{ $t('Panels.AcePanel.ConnectionQuality') }}</span>
                    <v-chip x-small :color="responseTimeColor" class="px-2">
                        {{ device.health?.avg_response_time_ms || 0 }}ms
                    </v-chip>
                </div>
                <div class="signal-bars d-flex align-center gap-1">
                    <div
                        v-for="i in 5"
                        :key="`bar-${i}`"
                        class="signal-bar"
                        :class="{ active: i <= connectionQualityBars }"
                        :style="{ height: `${i * 3 + 6}px` }" />
                    <span class="text-caption ml-2">{{ connectionQualityText }}</span>
                </div>
            </div>

            <!-- Health Metrics Grid -->
            <v-row dense class="health-metrics">
                <!-- Uptime -->
                <v-col cols="6">
                    <div class="metric-card">
                        <div class="d-flex align-center justify-space-between">
                            <v-icon small color="primary">{{ mdiClockOutline }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.Uptime') }}</span>
                        </div>
                        <div class="text-subtitle-2 font-weight-bold mt-1">{{ uptimeFormatted }}</div>
                    </div>
                </v-col>

                <!-- Error Count with Trend -->
                <v-col cols="6">
                    <div class="metric-card">
                        <div class="d-flex align-center justify-space-between">
                            <v-icon small :color="errorIconColor">{{ mdiAlertCircleOutline }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.Errors') }}</span>
                        </div>
                        <div class="d-flex align-center mt-1">
                            <span class="text-subtitle-2 font-weight-bold" :class="errorClass">
                                {{ device.health?.error_count || 0 }}
                            </span>
                            <v-spacer />
                            <ace-panel-device-health-chart
                                v-if="errorHistory.length > 1"
                                :data="errorHistory"
                                :width="50"
                                :height="20"
                                type="error"
                                :show-fill="false"
                                :stroke-width="1.5" />
                        </div>
                    </div>
                </v-col>

                <!-- Temperature -->
                <v-col cols="6" v-if="device.health?.temperature !== undefined">
                    <div class="metric-card">
                        <div class="d-flex align-center justify-space-between">
                            <v-icon small :color="temperatureColor">{{ mdiThermometer }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.DeviceTemp') }}</span>
                        </div>
                        <div class="d-flex align-center mt-1">
                            <span class="text-subtitle-2 font-weight-bold">
                                {{ device.health.temperature }}°C
                            </span>
                            <v-icon v-if="device.health.temperature > 60" x-small color="warning" class="ml-1">
                                {{ mdiAlertCircle }}
                            </v-icon>
                        </div>
                    </div>
                </v-col>

                <!-- Response Time Trend -->
                <v-col cols="6">
                    <div class="metric-card">
                        <div class="d-flex align-center justify-space-between">
                            <v-icon small color="info">{{ mdiSpeedometer }}</v-icon>
                            <span class="text-caption text--secondary">{{ $t('Panels.AcePanel.Response') }}</span>
                        </div>
                        <div class="d-flex align-center mt-1">
                            <span class="text-subtitle-2 font-weight-bold">{{ device.health?.avg_response_time_ms || 0 }}ms</span>
                            <v-spacer />
                            <ace-panel-device-health-chart
                                v-if="responseTimeHistory.length > 1"
                                :data="responseTimeHistory"
                                :width="50"
                                :height="20"
                                type="response_time"
                                :show-fill="false"
                                :stroke-width="1.5" />
                        </div>
                    </div>
                </v-col>
            </v-row>

            <!-- Expandable Diagnostics Section -->
            <v-expand-transition>
                <div v-show="showDiagnostics" class="diagnostics-section mt-3">
                    <v-divider class="mb-2" />

                    <div class="text-caption font-weight-bold mb-2">
                        <v-icon x-small class="mr-1">{{ mdiChartLine }}</v-icon>
                        {{ $t('Panels.AcePanel.DiagnosticsDetails') }}
                    </div>

                    <v-simple-table dense class="diagnostics-table">
                        <tbody>
                            <tr>
                                <td class="text-caption">{{ $t('Panels.AcePanel.Port') }}</td>
                                <td class="text-caption font-weight-mono text-right">{{ device.port }}</td>
                            </tr>
                            <tr v-if="device.device_id">
                                <td class="text-caption">{{ $t('Panels.AcePanel.DeviceID') }}</td>
                                <td class="text-caption font-weight-mono text-right">{{ device.device_id }}</td>
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

                    <!-- Alert Badge for Critical Issues -->
                    <v-alert
                        v-if="hasIssues"
                        dense
                        outlined
                        type="warning"
                        class="mt-2 mb-0"
                        text>
                        <div class="text-caption">
                            {{ issuesText }}
                        </div>
                    </v-alert>
                </div>
            </v-expand-transition>

            <!-- Toggle Diagnostics Button -->
            <v-btn
                text
                x-small
                block
                class="mt-2"
                @click="showDiagnostics = !showDiagnostics">
                <v-icon x-small left>{{ showDiagnostics ? mdiChevronUp : mdiChevronDown }}</v-icon>
                {{ showDiagnostics ? $t('Panels.AcePanel.HideDiagnostics') : $t('Panels.AcePanel.ShowDiagnostics') }}
            </v-btn>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import {
    mdiCheckCircle,
    mdiAlertCircle,
    mdiHelpCircle,
    mdiHeart,
    mdiSignal,
    mdiClockOutline,
    mdiAlertCircleOutline,
    mdiThermometer,
    mdiSpeedometer,
    mdiChartLine,
    mdiChevronUp,
    mdiChevronDown,
} from '@mdi/js'

@Component({
    components: {
        AcePanelDeviceHealthChart: () => import('./AcePanelDeviceHealthChart.vue'),
    },
})
export default class AcePanelDeviceCard extends Mixins(BaseMixin) {
    @Prop({ type: Object, required: true }) readonly device!: any

    mdiCheckCircle = mdiCheckCircle
    mdiAlertCircle = mdiAlertCircle
    mdiHelpCircle = mdiHelpCircle
    mdiHeart = mdiHeart
    mdiSignal = mdiSignal
    mdiClockOutline = mdiClockOutline
    mdiAlertCircleOutline = mdiAlertCircleOutline
    mdiThermometer = mdiThermometer
    mdiSpeedometer = mdiSpeedometer
    mdiChartLine = mdiChartLine
    mdiChevronUp = mdiChevronUp
    mdiChevronDown = mdiChevronDown

    showDiagnostics = false

    get statusColor(): string {
        if (this.hasIssues) return 'warning'

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

    get connectionStatusText(): string {
        return this.device.connection_status?.charAt(0).toUpperCase() + this.device.connection_status?.slice(1) || 'Unknown'
    }

    // Health Score (0-100) based on multiple factors
    get healthScore(): number {
        let score = 100

        // Deduct for errors
        const errorCount = this.device.health?.error_count ?? 0
        score -= Math.min(errorCount * 5, 50) // Up to -50 for errors

        // Deduct for slow response time
        const responseTime = this.device.health?.avg_response_time_ms ?? 0
        if (responseTime > 300) score -= 30
        else if (responseTime > 150) score -= 15
        else if (responseTime > 50) score -= 5

        // Deduct for high temperature
        const temp = this.device.health?.temperature ?? 0
        if (temp > 70) score -= 20
        else if (temp > 60) score -= 10

        // Deduct if disconnected
        if (this.device.connection_status === 'disconnected') score -= 50

        return Math.max(0, Math.min(100, score))
    }

    get healthScoreColor(): string {
        if (this.healthScore >= 80) return 'success'
        if (this.healthScore >= 60) return 'info'
        if (this.healthScore >= 40) return 'warning'
        return 'error'
    }

    // Connection Quality (1-5 bars)
    get connectionQualityBars(): number {
        const responseTime = this.device.health?.avg_response_time_ms ?? 999
        if (this.device.connection_status !== 'connected') return 0
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

        if (days > 0) {
            return `${days}d ${hours}h`
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
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

    // Mock historical data (in production, this would come from the backend)
    get errorHistory(): number[] {
        const history = this.device.health?.error_history ?? []
        if (history.length > 0) return history

        // Generate mock data for demonstration
        const current = this.device.health?.error_count ?? 0
        return [
            Math.max(0, current - 3),
            Math.max(0, current - 2),
            Math.max(0, current - 1),
            current,
        ]
    }

    get responseTimeHistory(): number[] {
        const history = this.device.health?.response_time_history ?? []
        if (history.length > 0) return history

        // Generate mock data for demonstration
        const current = this.device.health?.avg_response_time_ms ?? 0
        return [
            current + Math.random() * 20 - 10,
            current + Math.random() * 20 - 10,
            current + Math.random() * 20 - 10,
            current,
        ]
    }

    get hasIssues(): boolean {
        const errorCount = this.device.health?.error_count ?? 0
        const temp = this.device.health?.temperature ?? 0
        const responseTime = this.device.health?.avg_response_time_ms ?? 0

        return errorCount > 5 || temp > 65 || responseTime > 300 || this.device.connection_status === 'disconnected'
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

        if (this.device.connection_status === 'disconnected') {
            issues.push(this.$t('Panels.AcePanel.DeviceDisconnected').toString())
        }

        return issues.join('. ')
    }
}
</script>

<style scoped>
.ace-device-card {
    transition: all 0.3s ease;
    position: relative;
}

.ace-device-card:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.ace-device-card.card-has-issues {
    border-color: rgba(255, 152, 0, 0.5);
    border-width: 2px;
}

.font-weight-mono {
    font-family: monospace;
    font-size: 0.9em;
}

/* Connection Quality Signal Bars */
.signal-bars {
    padding: 4px 0;
}

.signal-bar {
    width: 4px;
    background-color: rgba(128, 128, 128, 0.2);
    border-radius: 2px;
    transition: all 0.3s ease;
}

.signal-bar.active {
    background-color: var(--v-success-base);
}

.signal-bars .signal-bar:nth-child(1).active {
    background-color: var(--v-error-base);
}

.signal-bars .signal-bar:nth-child(2).active {
    background-color: var(--v-warning-base);
}

.signal-bars .signal-bar:nth-child(3).active {
    background-color: var(--v-info-base);
}

.signal-bars .signal-bar:nth-child(4).active,
.signal-bars .signal-bar:nth-child(5).active {
    background-color: var(--v-success-base);
}

.gap-1 {
    gap: 4px;
}

/* Metric Cards */
.metric-card {
    padding: 8px;
    border-radius: 6px;
    background-color: rgba(var(--v-theme-surface), 0.05);
    border: 1px solid rgba(128, 128, 128, 0.1);
    transition: all 0.2s ease;
}

.metric-card:hover {
    background-color: rgba(var(--v-theme-surface), 0.1);
    border-color: rgba(var(--v-primary-base), 0.3);
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

.diagnostics-section {
    border-radius: 8px;
    padding: 8px;
    background-color: rgba(var(--v-theme-surface), 0.03);
}

/* Health Metrics */
.health-metrics {
    margin-top: 8px;
}
</style>

<style>
/* Dark theme adjustments */
html.theme--dark .signal-bar {
    background-color: rgba(255, 255, 255, 0.1);
}

html.theme--dark .metric-card {
    background-color: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.1);
}

html.theme--dark .metric-card:hover {
    background-color: rgba(255, 255, 255, 0.07);
}

/* Light theme adjustments */
html.theme--light .signal-bar {
    background-color: rgba(0, 0, 0, 0.05);
}

html.theme--light .metric-card {
    background-color: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.08);
}

html.theme--light .metric-card:hover {
    background-color: rgba(0, 0, 0, 0.04);
}
</style>
