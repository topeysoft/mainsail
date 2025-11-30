<template>
    <div class="ace-device-list">
        <!-- Header with Actions -->
        <v-row v-if="aceDevices.length > 0" class="mb-3 align-center">
            <v-col>
                <v-chip v-if="aceHasDisconnectedDevices" small color="warning" text-color="white">
                    <v-icon small left>{{ mdiAlertCircleOutline }}</v-icon>
                    {{ $t('Panels.AcePanel.DevicesWithIssues') }}
                </v-chip>
            </v-col>
            <v-col cols="auto">
                <v-btn x-small text @click="expandAll" class="mr-1">
                    {{ $t('Panels.AcePanel.ExpandAll') }}
                </v-btn>
                <v-btn x-small text @click="collapseAll" class="mr-2">
                    {{ $t('Panels.AcePanel.CollapseAll') }}
                </v-btn>
                <v-btn small @click="scanDevices" :loading="scanning" color="primary">
                    <v-icon small left>{{ mdiRefresh }}</v-icon>
                    {{ $t('Panels.AcePanel.ScanDevices') }}
                </v-btn>
            </v-col>
        </v-row>

        <!-- Alert if any devices are disconnected -->
        <v-alert v-if="aceHasDisconnectedDevices" type="warning" dense class="mb-3">
            {{ $t('Panels.AcePanel.DisconnectedDevicesWarning') }}
        </v-alert>

        <!-- Device list - Single column, full width -->
        <div v-if="aceDevices.length > 0">
            <ace-panel-device-card
                v-for="device in sortedDevices"
                :key="device.device_id"
                :device="device"
                :ref="`device-${device.device_id}`" />
        </div>

        <!-- Empty state -->
        <v-card v-else outlined class="empty-state">
            <v-card-text class="text-center py-8">
                <v-icon size="64" color="grey lighten-1">{{ mdiAlertCircleOutline }}</v-icon>
                <p class="text-h6 mt-4 mb-2">{{ $t('Panels.AcePanel.NoDevicesFound') }}</p>
                <p class="text-body-2 text--secondary mb-4">
                    {{ $t('Panels.AcePanel.NoDevicesFoundDescription') }}
                </p>
                <v-btn color="primary" @click="scanDevices" :loading="scanning">
                    <v-icon left>{{ mdiRefresh }}</v-icon>
                    {{ $t('Panels.AcePanel.ScanForDevices') }}
                </v-btn>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import { mdiRefresh, mdiAlertCircleOutline } from '@mdi/js'

@Component({
    components: {
        AcePanelDeviceCard: () => import('./AcePanelDeviceCard.vue'),
    },
})
export default class AcePanelDeviceList extends Mixins(BaseMixin, AceMixin) {
    mdiRefresh = mdiRefresh
    mdiAlertCircleOutline = mdiAlertCircleOutline

    scanning = false

    get sortedDevices(): any[] {
        // Sort devices by gate_offset to maintain logical order (0-3, 4-7, 8-11, etc.)
        return [...this.aceDevices].sort((a, b) => {
            const offsetA = a.gate_offset ?? 0
            const offsetB = b.gate_offset ?? 0
            return offsetA - offsetB
        })
    }

    get healthyDevicesCount(): number {
        return this.aceDevices.filter((dev) => {
            const connected = dev.connected ?? false
            const errorCount = dev.health?.error_count ?? 0
            const responseTime = dev.health?.avg_response_time_ms ?? 0
            const temp = dev.health?.temperature ?? 0
            return connected && errorCount <= 5 && responseTime <= 300 && temp <= 65
        }).length
    }

    get deviceSummaryText(): string {
        const total = this.aceNumDevices
        const healthy = this.healthyDevicesCount
        if (total === 0) {
            return this.$t('Panels.AcePanel.NoDevicesConnected').toString()
        } else if (total === 1) {
            return healthy === 1
                ? this.$t('Panels.AcePanel.OneDeviceHealthy').toString()
                : this.$t('Panels.AcePanel.OneDeviceIssues').toString()
        } else {
            return this.$t('Panels.AcePanel.DevicesSummary', { total, healthy }).toString()
        }
    }

    async scanDevices() {
        this.scanning = true
        try {
            // Send scan command
            this.aceScanDevices()

            // Show success toast
            this.$toast.success(this.$t('Panels.AcePanel.DeviceScanStarted').toString())
        } catch (error) {
            this.$toast.error(this.$t('Panels.AcePanel.DeviceScanFailed').toString())
        } finally {
            // Stop scanning indicator after a short delay
            setTimeout(() => {
                this.scanning = false
            }, 2000)
        }
    }

    expandAll() {
        // Expand all device cards
        this.aceDevices.forEach((device: any) => {
            const ref = this.$refs[`device-${device.device_id}`] as any
            if (ref && ref[0]) {
                // Access the expansion panel and set it to expanded
                const expansionPanel = ref[0].$el?.querySelector('.v-expansion-panel')
                if (expansionPanel) {
                    expansionPanel.click()
                }
            }
        })
    }

    collapseAll() {
        // Collapse all device cards
        this.aceDevices.forEach((device: any) => {
            const ref = this.$refs[`device-${device.device_id}`] as any
            if (ref && ref[0]) {
                // Access the expansion panel and collapse it
                const expansionPanel = ref[0].$el?.querySelector('.v-expansion-panel.v-expansion-panel--active')
                if (expansionPanel) {
                    expansionPanel.click()
                }
            }
        })
    }
}
</script>

<style scoped>
.ace-device-list {
    width: 100%;
}

.empty-state {
    border: 2px dashed rgba(128, 128, 128, 0.3) !important;
}
</style>
