<template>
    <div class="ace-device-list">
        <v-row class="mb-2 align-center">
            <v-col>
                <h3 class="text-h6">
                    {{ $t('Panels.AcePanel.DeviceManagement') }}
                    <v-chip x-small class="ml-2">{{ aceNumDevices }} {{ $t('Panels.AcePanel.Devices') }}</v-chip>
                </h3>
            </v-col>
            <v-col class="text-right">
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

        <!-- Device cards grid -->
        <v-row>
            <v-col v-for="device in aceDevices" :key="device.device_id" cols="12" sm="6" md="4">
                <ace-panel-device-card :device="device" />
            </v-col>
        </v-row>

        <!-- Empty state -->
        <v-row v-if="aceDevices.length === 0">
            <v-col>
                <v-card outlined>
                    <v-card-text class="text-center py-8">
                        <v-icon large color="grey">{{ mdiAlertCircleOutline }}</v-icon>
                        <p class="text-body-1 mt-3">{{ $t('Panels.AcePanel.NoDevicesFound') }}</p>
                        <v-btn small color="primary" @click="scanDevices" :loading="scanning">
                            {{ $t('Panels.AcePanel.ScanForDevices') }}
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
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
}
</script>

<style scoped>
.ace-device-list {
    width: 100%;
}
</style>
