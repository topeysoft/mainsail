<template>
    <panel
        v-if="aceExists && klipperReadyForGui"
        :title="$t('Panels.AcePanel.Headline')"
        :icon="mdiPrinter3dNozzle"
        :collapsible="true"
        card-class="ace-control-panel">
        <template #buttons>
            <ace-panel-settings />
        </template>
        <v-card-text class="pt-1">
            <!-- Tabs - always shown when ACE panel is visible -->
            <v-tabs v-model="activeTab" class="mb-3">
                <v-tab>{{ $t('Panels.AcePanel.Gates') }}</v-tab>
                <v-tab>
                    {{ $t('Panels.AcePanel.Devices') }}
                    <v-chip x-small class="ml-2">{{ aceNumDevices }}</v-chip>
                </v-tab>
            </v-tabs>

            <!-- Tab content - always available -->
            <v-tabs-items v-model="activeTab">
                <!-- Gates Tab -->
                <v-tab-item>
                    <ace-panel-status />

                    <!-- Gates view -->
                    <div v-if="aceNumDevices >= 1" class="mt-3">
                        <v-row align="center" class="mb-2">
                            <v-col>
                                <span class="text-caption text--secondary">
                                    {{ $t('Panels.AcePanel.TotalGates', { count: aceNumGates }) }}
                                </span>
                            </v-col>
                            <v-col cols="auto">
                                <v-btn x-small text @click="expandAll">
                                    {{ $t('Panels.AcePanel.ExpandAll') }}
                                </v-btn>
                                <v-btn x-small text @click="collapseAll">
                                    {{ $t('Panels.AcePanel.CollapseAll') }}
                                </v-btn>
                            </v-col>
                        </v-row>

                        <ace-panel-device-gate-group
                            v-for="device in aceDevices"
                            :key="device.device_id"
                            :device="device"
                            :default-expanded="deviceExpanded[device.device_id]"
                            :ref="`device-${device.device_id}`" />
                    </div>

                    <!-- No devices empty state -->
                    <v-card v-else outlined class="empty-state mt-3">
                        <v-card-text class="text-center py-8">
                            <v-icon size="64" color="grey lighten-1">{{ mdiAlertCircleOutline }}</v-icon>
                            <p class="text-h6 mt-4 mb-2">{{ $t('Panels.AcePanel.NoDevicesFound') }}</p>
                            <p class="text-body-2 text--secondary mb-4">
                                {{ $t('Panels.AcePanel.NoDevicesFoundDescription') }}
                            </p>
                            <v-btn color="primary" @click="activeTab = 1">
                                <v-icon left>{{ mdiViewDashboard }}</v-icon>
                                {{ $t('Panels.AcePanel.GoToDevicesTab') }}
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-tab-item>

                <!-- Devices Tab -->
                <v-tab-item>
                    <ace-panel-device-list />
                </v-tab-item>
            </v-tabs-items>
        </v-card-text>

        <!-- Setup Wizard Dialog -->
        <ace-setup-wizard-dialog />
    </panel>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import { mdiPrinter3dNozzle, mdiAlertCircleOutline, mdiViewDashboard } from '@mdi/js'

@Component({
    components: {
        AcePanelDeviceList: () => import('./Ace/AcePanelDeviceList.vue'),
        AcePanelDeviceGateGroup: () => import('./Ace/AcePanelDeviceGateGroup.vue'),
        AceSetupWizardDialog: () => import('@/components/dialogs/AceSetupWizardDialog.vue'),
    },
})
export default class AcePanel extends Mixins(BaseMixin, AceMixin) {
    mdiPrinter3dNozzle = mdiPrinter3dNozzle
    mdiAlertCircleOutline = mdiAlertCircleOutline
    mdiViewDashboard = mdiViewDashboard
    activeTab = 0
    deviceExpanded: Record<string, boolean> = {}

    mounted() {
        // Initialize all devices as expanded by default
        this.aceDevices.forEach((device: any) => {
            this.$set(this.deviceExpanded, device.device_id, true)
        })

        // Check if first time setup and open wizard
        this.checkFirstTimeSetup()
    }

    checkFirstTimeSetup() {
        const isFirstTime = this.$store.getters['ace/setup/isFirstTimeSetup']
        const hasNoDevices = this.aceNumDevices === 0
        const aceExists = this.aceExists

        // Auto-open wizard ONLY if:
        // 1. ACE module is detected
        // 2. No devices configured yet (needs setup)
        // 3. First time (wizard never completed)
        if (aceExists && hasNoDevices && isFirstTime) {
            // Small delay to let panel render first
            setTimeout(() => {
                this.$store.dispatch('ace/setup/openWizard')
            }, 1000)
        }
    }

    expandAll() {
        this.aceDevices.forEach((device: any) => {
            this.$set(this.deviceExpanded, device.device_id, true)
            const ref = this.$refs[`device-${device.device_id}`] as any
            if (ref && ref[0]) {
                ref[0].expanded = true
            }
        })
    }

    collapseAll() {
        this.aceDevices.forEach((device: any) => {
            this.$set(this.deviceExpanded, device.device_id, false)
            const ref = this.$refs[`device-${device.device_id}`] as any
            if (ref && ref[0]) {
                ref[0].expanded = false
            }
        })
    }
}
</script>

<style scoped>
.ace-control-panel {
    overflow: visible;
}

.empty-state {
    border: 2px dashed rgba(128, 128, 128, 0.3) !important;
}
</style>
