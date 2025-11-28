<template>
    <div class="d-flex justify-space-between align-center px-3 pt-2">
        <span class="text-subtitle-2 font-weight-bold">
            T{{ gate.index }}
        </span>
        <v-tooltip bottom>
            <template #activator="{ on, attrs }">
                <v-chip
                    x-small
                    :color="statusConfig.color"
                    :text-color="statusConfig.textColor"
                    class="px-2 status-chip"
                    v-bind="attrs"
                    v-on="on">
                    <v-icon v-if="statusConfig.icon" x-small left class="mr-1">
                        {{ statusConfig.icon }}
                    </v-icon>
                    <v-progress-circular
                        v-if="statusConfig.loading"
                        indeterminate
                        size="10"
                        width="1"
                        class="mr-1" />
                    {{ statusConfig.label }}
                </v-chip>
            </template>
            <span>{{ $t('Panels.AcePanel.GateStatus') }}: {{ gate.status }}</span>
        </v-tooltip>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { AceGate } from '@/components/mixins/ace'
import { mdiCheck, mdiAlertCircle, mdiCircleOutline, mdiTrayFull, mdiCheckboxMarkedCircle } from '@mdi/js'

interface StatusConfig {
    color: string
    textColor?: string
    icon?: string
    label: string
    loading?: boolean
}

@Component
export default class AcePanelGateHeader extends Vue {
    mdiCheck = mdiCheck
    mdiAlertCircle = mdiAlertCircle
    mdiCircleOutline = mdiCircleOutline
    mdiTrayFull = mdiTrayFull
    mdiCheckboxMarkedCircle = mdiCheckboxMarkedCircle

    @Prop({ type: Object, required: true }) readonly gate!: AceGate

    get statusConfig(): StatusConfig {
        const status = this.gate.status?.toLowerCase() ?? 'unknown'

        // Priority: show selected state if selected but not loaded
        if (this.gate.selected && !this.gate.loaded) {
            return {
                color: 'info',
                icon: mdiCheckboxMarkedCircle,
                label: this.$t('Panels.AcePanel.StatusSelected').toString(),
            }
        }

        switch (status) {
            case 'ready':
                return {
                    color: 'success',
                    icon: mdiTrayFull,
                    label: this.$t('Panels.AcePanel.StatusReady').toString(),
                }
            case 'feeding':
                return {
                    color: 'warning',
                    label: this.$t('Panels.AcePanel.StatusFeeding').toString(),
                    loading: true,
                }
            case 'unwinding':
                return {
                    color: 'info',
                    label: this.$t('Panels.AcePanel.StatusUnwinding').toString(),
                    loading: true,
                }
            case 'shifting':
                return {
                    color: 'warning',
                    label: this.$t('Panels.AcePanel.StatusShifting').toString(),
                    loading: true,
                }
            case 'preload':
                return {
                    color: 'info',
                    label: this.$t('Panels.AcePanel.StatusPreload').toString(),
                    loading: true,
                }
            case 'empty':
                return {
                    color: 'grey',
                    textColor: 'grey darken-1',
                    icon: mdiCircleOutline,
                    label: this.$t('Panels.AcePanel.StatusEmpty').toString(),
                }
            case 'error':
                return {
                    color: 'error',
                    icon: mdiAlertCircle,
                    label: this.$t('Panels.AcePanel.StatusError').toString(),
                }
            default:
                return {
                    color: 'grey',
                    label: status,
                }
        }
    }
}
</script>

<style scoped>
.status-chip {
    font-size: 0.65rem;
    height: 18px !important;
}
</style>
