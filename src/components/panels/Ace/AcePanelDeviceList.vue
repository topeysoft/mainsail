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
            <v-col cols="auto" class="d-flex align-center">
                <v-btn x-small text @click="expandAll" class="mr-1">
                    {{ $t('Panels.AcePanel.ExpandAll') }}
                </v-btn>
                <v-btn x-small text @click="collapseAll" class="mr-2">
                    {{ $t('Panels.AcePanel.CollapseAll') }}
                </v-btn>
                <v-tooltip v-if="aceDevices.length > 1" top>
                    <template #activator="{ on, attrs }">
                        <v-btn
                            small
                            icon
                            :outlined="!reorderMode"
                            :color="reorderMode ? 'primary' : undefined"
                            class="mr-2 gate-order-toggle"
                            v-bind="attrs"
                            v-on="on"
                            @click="toggleReorder">
                            <v-icon small>{{ mdiSwapVertical }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('Panels.AcePanel.GateOrder') }}</span>
                </v-tooltip>
                <v-btn small @click="scanDevices" :loading="scanning" color="primary">
                    <v-icon small left>{{ mdiRefresh }}</v-icon>
                    {{ $t('Panels.AcePanel.ScanDevices') }}
                </v-btn>
            </v-col>
        </v-row>

        <!-- Gate order editor -->
        <v-card v-if="reorderMode" outlined class="gate-order-editor mb-3">
            <v-card-text class="pb-2">
                <div class="d-flex align-center mb-2">
                    <v-icon small class="mr-2">{{ mdiSwapVertical }}</v-icon>
                    <span class="text-subtitle-2">{{ $t('Panels.AcePanel.GateOrder') }}</span>
                    <v-spacer />
                    <v-btn
                        v-if="pendingOrder.length === 2"
                        x-small
                        outlined
                        @click="swapPending">
                        <v-icon x-small left>{{ mdiSwapVertical }}</v-icon>
                        {{ $t('Panels.AcePanel.GateOrderSwap') }}
                    </v-btn>
                </div>
                <div class="text-caption text--secondary mb-3">{{ $t('Panels.AcePanel.GateOrderHint') }}</div>

                <div
                    v-for="(device, index) in pendingDevices"
                    :key="device.device_id"
                    class="gate-order-row d-flex align-center"
                    :class="{ 'gate-order-row--moved': orderChangedFor(device) }">
                    <div class="gate-order-range mr-3 text-center">
                        <v-chip small label :color="orderChangedFor(device) ? 'primary' : undefined">
                            T{{ index * 4 }} – T{{ index * 4 + 3 }}
                        </v-chip>
                        <div v-if="orderChangedFor(device)" class="text-caption text--secondary gate-order-was">
                            {{ $t('Panels.AcePanel.GateOrderWas', { range: currentRange(device) }) }}
                        </div>
                    </div>
                    <div class="flex-grow-1 overflow-hidden">
                        <div class="text-body-2 font-weight-medium text-truncate">{{ deviceLabel(device) }}</div>
                        <div class="text-caption text-truncate">{{ slotSummary(device) }}</div>
                        <div class="text-caption text--disabled text-truncate">{{ device.device_id }}</div>
                    </div>
                    <v-btn icon small :disabled="index === 0" :title="$t('Panels.AcePanel.MoveUp')" @click="movePending(index, -1)">
                        <v-icon>{{ mdiChevronUp }}</v-icon>
                    </v-btn>
                    <v-btn
                        icon
                        small
                        :disabled="index === pendingDevices.length - 1"
                        :title="$t('Panels.AcePanel.MoveDown')"
                        @click="movePending(index, 1)">
                        <v-icon>{{ mdiChevronDown }}</v-icon>
                    </v-btn>
                </div>
            </v-card-text>
            <v-card-actions class="pt-0">
                <v-spacer />
                <v-btn text small @click="toggleReorder">{{ $t('Panels.AcePanel.Cancel') }}</v-btn>
                <v-btn small color="primary" :disabled="!orderChanged" @click="confirmDialog = true">
                    <v-icon small left>{{ mdiCheck }}</v-icon>
                    {{ $t('Panels.AcePanel.GateOrderApply') }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <v-dialog v-model="confirmDialog" max-width="480">
            <v-card>
                <v-card-title class="text-h6">{{ $t('Panels.AcePanel.GateOrderConfirmTitle') }}</v-card-title>
                <v-card-text>
                    <p class="mb-3">{{ $t('Panels.AcePanel.GateOrderConfirmText') }}</p>
                    <div v-for="(device, index) in pendingDevices" :key="`c-${device.device_id}`" class="d-flex align-center mb-1">
                        <v-chip x-small label class="mr-2">T{{ index * 4 }} – T{{ index * 4 + 3 }}</v-chip>
                        <span class="text-body-2">{{ deviceLabel(device) }}</span>
                        <span v-if="orderChangedFor(device)" class="text-caption text--secondary ml-2">
                            ← {{ currentRange(device) }}
                        </span>
                    </div>
                    <v-alert v-if="aceSelectedGate >= 0" dense text type="warning" class="mt-3 mb-0">
                        {{ $t('Panels.AcePanel.GateOrderSelectedToolWarning', { tool: aceSelectedGate }) }}
                    </v-alert>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="confirmDialog = false">{{ $t('Panels.AcePanel.Cancel') }}</v-btn>
                    <v-btn color="primary" @click="applyOrder">{{ $t('Panels.AcePanel.GateOrderApply') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

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
import { mdiRefresh, mdiAlertCircleOutline, mdiSwapVertical, mdiChevronUp, mdiChevronDown, mdiCheck } from '@mdi/js'

@Component({
    components: {
        AcePanelDeviceCard: () => import('./AcePanelDeviceCard.vue'),
    },
})
export default class AcePanelDeviceList extends Mixins(BaseMixin, AceMixin) {
    mdiRefresh = mdiRefresh
    mdiAlertCircleOutline = mdiAlertCircleOutline
    mdiSwapVertical = mdiSwapVertical
    mdiChevronUp = mdiChevronUp
    mdiChevronDown = mdiChevronDown
    mdiCheck = mdiCheck

    scanning = false
    reorderMode = false
    confirmDialog = false
    pendingOrder: string[] = []

    // --- gate order editor ---------------------------------------------------

    get pendingDevices(): any[] {
        const byId = new Map(this.aceDevices.map((d: any) => [d.device_id, d]))
        return this.pendingOrder.map((id) => byId.get(id)).filter((d) => d !== undefined)
    }

    get orderChanged(): boolean {
        const current = this.sortedDevices.map((d: any) => d.device_id)
        return current.join(',') !== this.pendingOrder.join(',')
    }

    toggleReorder() {
        this.reorderMode = !this.reorderMode
        if (this.reorderMode) this.pendingOrder = this.sortedDevices.map((d: any) => d.device_id)
    }

    movePending(index: number, delta: number) {
        const target = index + delta
        if (target < 0 || target >= this.pendingOrder.length) return
        const next = [...this.pendingOrder]
        ;[next[index], next[target]] = [next[target], next[index]]
        this.pendingOrder = next
    }

    swapPending() {
        this.pendingOrder = [...this.pendingOrder].reverse()
    }

    orderChangedFor(device: any): boolean {
        const newIndex = this.pendingOrder.indexOf(device.device_id)
        return newIndex >= 0 && newIndex * 4 !== (device.gate_offset ?? 0)
    }

    currentRange(device: any): string {
        const offset = device.gate_offset ?? 0
        return `T${offset} – T${offset + 3}`
    }

    // Stable identity for a unit: its alias, else the USB port it is plugged into.
    // (ACE_1/ACE_2 are positional and change with the order, so they would mislead here.)
    deviceLabel(device: any): string {
        if (device.alias) return device.alias
        const match = (device.port ?? '').match(/usb(?:v2)?-\d+:([\d.]+):/)
        return match
            ? this.$t('Panels.AcePanel.GateOrderUnitOnPort', { port: match[1] }).toString()
            : device.device_id
    }

    slotSummary(device: any): string {
        const slots = device.status?.slots ?? []
        if (!slots.length) return this.$t('Panels.AcePanel.NoSlotInfo').toString()
        const loaded = this.$t('Panels.AcePanel.GateOrderSlotLoaded').toString()
        return slots.map((s: any) => (s.status === 'empty' ? '–' : s.type || loaded)).join(' · ')
    }

    applyOrder() {
        this.confirmDialog = false
        const refs = this.pendingOrder.join(',')
        this.doSendAce(`ACE_SET_DEVICE_ORDER DEVICES=${refs}`)
        this.$toast.success(this.$t('Panels.AcePanel.GateOrderApplied').toString())
        this.reorderMode = false
    }

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
            // Send scan command with APPLY=1 to automatically apply discovered devices
            this.aceScanDevices(true, false)

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

.gate-order-row {
    padding: 6px 4px;
    border-radius: 4px;
}

.gate-order-row + .gate-order-row {
    border-top: 1px solid rgba(128, 128, 128, 0.15);
}

.gate-order-row--moved {
    background: rgba(var(--v-primary-base-rgb, 33, 150, 243), 0.06);
}

.gate-order-range {
    min-width: 84px;
    font-variant-numeric: tabular-nums;
}

.gate-order-was {
    font-size: 0.65rem;
    line-height: 1.1;
    margin-top: 2px;
}
</style>
