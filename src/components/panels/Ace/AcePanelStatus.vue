<template>
    <div class="d-flex flex-wrap align-center gap-2">
        <v-chip x-small :color="statusColor" class="px-2">
            {{ statusText }}
        </v-chip>

        <v-tooltip v-if="aceShowEndlessSpool" top>
            <template #activator="{ on, attrs }">
                <v-btn
                    x-small
                    :color="aceEndlessSpool ? 'primary' : 'grey'"
                    :outlined="!aceEndlessSpool"
                    v-bind="attrs"
                    v-on="on"
                    @click="toggleEndlessSpool">
                    <v-icon x-small left>{{ mdiInfinity }}</v-icon>
                    {{ $t('Panels.AcePanel.EndlessSpool') }}
                </v-btn>
            </template>
            <span>{{ $t('Panels.AcePanel.ToggleEndlessSpool') }}</span>
        </v-tooltip>

        <v-tooltip top>
            <template #activator="{ on, attrs }">
                <v-btn
                    x-small
                    color="grey"
                    outlined
                    v-bind="attrs"
                    v-on="on"
                    @click="showSyncDialog = true">
                    <v-icon x-small left>{{ mdiSync }}</v-icon>
                    {{ $t('Panels.AcePanel.SyncSelection') }}
                </v-btn>
            </template>
            <span>{{ $t('Panels.AcePanel.SyncSelectionTooltip') }}</span>
        </v-tooltip>

        <v-dialog v-model="showSyncDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    {{ $t('Panels.AcePanel.SyncSelectionTitle') }}
                </v-card-title>
                <v-card-text>
                    <p class="mb-4">{{ $t('Panels.AcePanel.SyncSelectionDescription') }}</p>
                    <v-select
                        v-model="syncDialogValue"
                        :items="gateSelectionItems"
                        :label="$t('Panels.AcePanel.StatusSelected')"
                        dense
                        outlined
                        hide-details />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="showSyncDialog = false">
                        {{ $t('Panels.AcePanel.Cancel') }}
                    </v-btn>
                    <v-btn color="primary" text @click="applySyncSelection">
                        {{ $t('Panels.AcePanel.Save') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import { mdiInfinity, mdiSync } from '@mdi/js'

@Component
export default class AcePanelStatus extends Mixins(BaseMixin, AceMixin) {
    mdiInfinity = mdiInfinity
    mdiSync = mdiSync

    showSyncDialog = false
    syncDialogValue = -1

    get gateSelectionItems() {
        return [
            { text: 'None', value: -1 },
            { text: 'T0', value: 0 },
            { text: 'T1', value: 1 },
            { text: 'T2', value: 2 },
            { text: 'T3', value: 3 },
        ]
    }

    applySyncSelection() {
        if (this.syncDialogValue === -1) {
            this.aceClearSelection()
        } else {
            this.aceSetSelectedGate(this.syncDialogValue)
        }
        this.showSyncDialog = false
    }

    get statusColor() {
        switch (this.aceStatus) {
            case 'ready':
            case 'idle':
                return 'success'
            case 'busy':
                return 'warning'
            case 'error':
                return 'error'
            default:
                return 'grey'
        }
    }

    get statusText() {
        const status = this.aceStatus.charAt(0).toUpperCase() + this.aceStatus.slice(1)
        return status
    }

    toggleEndlessSpool() {
        this.aceSetEndlessSpool(!this.aceEndlessSpool)
    }
}
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>
