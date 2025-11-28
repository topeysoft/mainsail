<template>
    <div class="ace-dryer-container">
        <!-- Collapsible Section Header -->
        <div
            class="dryer-header d-flex align-center mb-2 pa-2 rounded cursor-pointer"
            :class="{ 'dryer-header-active': hasActiveDryers }"
            @click="toggleExpanded">
            <v-icon class="mr-1">{{ expanded ? mdiChevronDown : mdiChevronRight }}</v-icon>
            <v-icon class="mr-2">{{ mdiHairDryer }}</v-icon>
            <span class="text-h6">{{ $t('Panels.AcePanel.DryerManagement') }}</span>
            <v-spacer />

            <!-- Status badges -->
            <v-chip v-if="hasActiveDryers" x-small color="warning" class="mr-1">
                <v-icon x-small left>{{ mdiAlertCircle }}</v-icon>
                {{ activeDryerCount }}
            </v-chip>

            <!-- Compact status when collapsed -->
            <template v-if="!expanded && hasActiveDryers">
                <v-chip x-small class="mr-1">
                    <v-icon x-small left>{{ mdiThermometer }}</v-icon>
                    {{ highestTemp }}°C
                </v-chip>
                <v-chip x-small>
                    <v-icon x-small left>{{ mdiTimerSand }}</v-icon>
                    {{ shortestRemainingFormatted }}
                </v-chip>
            </template>
        </div>

        <!-- Expandable Content -->
        <v-expand-transition>
            <div v-show="expanded">
                <!-- Multi-Device Dryer Cards -->
                <v-row v-if="aceHasMultipleDevices">
                    <v-col
                        v-for="dryer in deviceDryers"
                        :key="dryer.device_id"
                        cols="12"
                        sm="6"
                        md="6"
                        lg="4">
                        <ace-panel-device-dryer-card :device="dryer" />
                    </v-col>
                </v-row>

                <!-- Single Device Dryer (Legacy/Simple View) -->
                <div v-else class="single-dryer-card">
                    <ace-panel-device-dryer-card v-if="deviceDryers.length > 0" :device="deviceDryers[0]" />

                    <!-- Fallback to legacy single dryer (backward compatibility) -->
                    <v-card v-else outlined class="pa-3">
                        <div class="d-flex justify-space-between align-center mb-2">
                            <span class="text-subtitle-2 font-weight-bold">
                                <v-icon small left>{{ mdiHairDryer }}</v-icon>
                                {{ $t('Panels.AcePanel.Dryer') }}
                            </span>
                            <v-chip v-if="aceDryerActive" x-small color="warning" class="px-2">
                                {{ aceDryerRemainingFormatted }}
                            </v-chip>
                        </div>

                        <div class="d-flex align-center mb-2">
                            <span class="text-caption mr-2">{{ $t('Panels.AcePanel.Temperature') }}:</span>
                            <span class="text-caption font-weight-bold">
                                {{ aceTemperature }}°C
                                <span v-if="aceDryerActive"> / {{ aceDryerStatus.temp }}°C</span>
                            </span>
                        </div>

                        <div v-if="aceDryerActive" class="d-flex align-center mb-2">
                            <span class="text-caption mr-2">{{ $t('Panels.AcePanel.Duration') }}:</span>
                            <span class="text-caption font-weight-bold">{{ aceDryerStatus.duration }} min</span>
                        </div>

                        <div v-if="!aceDryerActive" class="d-flex flex-wrap gap-2">
                            <v-text-field
                                v-model.number="dryerTemp"
                                :label="$t('Panels.AcePanel.Temperature')"
                                type="number"
                                :max="aceMaxDryerTemp"
                                min="30"
                                suffix="°C"
                                dense
                                outlined
                                hide-details
                                class="flex-grow-1"
                                style="max-width: 100px" />
                            <v-text-field
                                v-model.number="dryerDuration"
                                :label="$t('Panels.AcePanel.Duration')"
                                type="number"
                                min="1"
                                max="480"
                                suffix="min"
                                dense
                                outlined
                                hide-details
                                class="flex-grow-1"
                                style="max-width: 100px" />
                            <v-btn color="primary" small :disabled="!aceCanSendCommands" @click="startDrying">
                                <v-icon small left>{{ mdiPlay }}</v-icon>
                                {{ $t('Panels.AcePanel.Start') }}
                            </v-btn>
                        </div>

                        <div v-else class="d-flex justify-center">
                            <v-btn color="error" small :disabled="!aceCanSendCommands" @click="stopDrying">
                                <v-icon small left>{{ mdiStop }}</v-icon>
                                {{ $t('Panels.AcePanel.Stop') }}
                            </v-btn>
                        </div>
                    </v-card>
                </div>
            </div>
        </v-expand-transition>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import { mdiHairDryer, mdiPlay, mdiStop, mdiAlertCircle, mdiChevronDown, mdiChevronRight, mdiThermometer, mdiTimerSand } from '@mdi/js'

@Component({
    components: {
        AcePanelDeviceDryerCard: () => import('./AcePanelDeviceDryerCard.vue'),
    },
})
export default class AcePanelDryer extends Mixins(BaseMixin, AceMixin) {
    mdiHairDryer = mdiHairDryer
    mdiPlay = mdiPlay
    mdiStop = mdiStop
    mdiAlertCircle = mdiAlertCircle
    mdiChevronDown = mdiChevronDown
    mdiChevronRight = mdiChevronRight
    mdiThermometer = mdiThermometer
    mdiTimerSand = mdiTimerSand

    dryerTemp = 50
    dryerDuration = 60
    expanded = false

    mounted() {
        // Auto-expand if there are active dryers on mount
        this.expanded = this.hasActiveDryers
    }

    get deviceDryers(): any[] {
        // Get per-device dryer status from ace.dryers array (new backend format)
        const dryers = this.ace.dryers ?? []
        return dryers
    }

    get hasActiveDryers(): boolean {
        return this.deviceDryers.some((d) => d.status === 'drying') || this.aceDryerActive
    }

    get activeDryerCount(): number {
        return this.deviceDryers.filter((d) => d.status === 'drying').length
    }

    // Highest temperature across all active dryers
    get highestTemp(): number {
        const temps = this.deviceDryers
            .filter((d) => d.status === 'drying')
            .map((d) => d.target_temp ?? 0)

        // Include legacy single dryer temp
        if (this.aceDryerActive) {
            temps.push(this.aceDryerStatus.temp)
        }

        return temps.length > 0 ? Math.max(...temps) : 0
    }

    // Shortest remaining time across all active dryers (most urgent)
    get shortestRemaining(): number {
        const times = this.deviceDryers
            .filter((d) => d.status === 'drying')
            .map((d) => d.remain_time ?? 0)

        // Include legacy single dryer time
        if (this.aceDryerActive) {
            times.push(this.aceDryerStatus.remaining)
        }

        return times.length > 0 ? Math.min(...times) : 0
    }

    get shortestRemainingFormatted(): string {
        const remaining = this.shortestRemaining
        if (remaining <= 0) return '00:00'

        const minutes = Math.floor(remaining / 60)
        const seconds = remaining % 60
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    // Auto-expand when a dryer becomes active
    @Watch('hasActiveDryers')
    onActiveDryersChange(newVal: boolean) {
        if (newVal && !this.expanded) {
            this.expanded = true
        }
    }

    toggleExpanded() {
        this.expanded = !this.expanded
    }

    // Legacy methods for backward compatibility with single-device mode
    startDrying() {
        this.aceStartDrying(this.dryerTemp, this.dryerDuration)
    }

    stopDrying() {
        this.aceStopDrying()
    }
}
</script>

<style scoped>
.ace-dryer-container {
    margin-top: 16px;
}

.dryer-header {
    transition: all 0.2s ease;
    user-select: none;
}

.dryer-header:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.dryer-header-active {
    background-color: rgba(255, 152, 0, 0.08);
    border-left: 3px solid var(--v-warning-base);
}

.dryer-header-active:hover {
    background-color: rgba(255, 152, 0, 0.12);
}

.cursor-pointer {
    cursor: pointer;
}

.single-dryer-card {
    max-width: 600px;
}

.gap-2 {
    gap: 8px;
}
</style>
