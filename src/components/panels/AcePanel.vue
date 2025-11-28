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
            <!-- Tabs for multi-device support -->
            <v-tabs v-if="aceHasMultipleDevices" v-model="activeTab" class="mb-3">
                <v-tab>{{ $t('Panels.AcePanel.Gates') }}</v-tab>
                <v-tab>
                    {{ $t('Panels.AcePanel.Devices') }}
                    <v-chip x-small class="ml-2">{{ aceNumDevices }}</v-chip>
                </v-tab>
            </v-tabs>

            <!-- Tab content -->
            <v-tabs-items v-if="aceHasMultipleDevices" v-model="activeTab">
                <!-- Gates Tab -->
                <v-tab-item>
                    <ace-panel-status />

                    <!-- Multi-device: Show gates grouped by device -->
                    <div class="mt-3">
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

                    <ace-panel-dryer class="mt-3" />
                </v-tab-item>

                <!-- Devices Tab -->
                <v-tab-item>
                    <ace-panel-device-list />
                </v-tab-item>
            </v-tabs-items>

            <!-- Single device view (no tabs) -->
            <div v-else>
                <ace-panel-status />
                <v-row class="mt-2">
                    <v-col
                        v-for="gate in aceGates"
                        :key="gate.index"
                        cols="6"
                        sm="6"
                        md="3"
                        class="pa-2">
                        <ace-panel-gate :gate="gate" />
                    </v-col>
                </v-row>
                <ace-panel-dryer class="mt-3" />
            </div>
        </v-card-text>
    </panel>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import { mdiPrinter3dNozzle } from '@mdi/js'

@Component({
    components: {
        AcePanelDeviceList: () => import('./Ace/AcePanelDeviceList.vue'),
        AcePanelDeviceGateGroup: () => import('./Ace/AcePanelDeviceGateGroup.vue'),
    },
})
export default class AcePanel extends Mixins(BaseMixin, AceMixin) {
    mdiPrinter3dNozzle = mdiPrinter3dNozzle
    activeTab = 0
    deviceExpanded: Record<string, boolean> = {}

    mounted() {
        // Initialize all devices as expanded by default
        this.aceDevices.forEach((device: any) => {
            this.$set(this.deviceExpanded, device.device_id, true)
        })
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
</style>
