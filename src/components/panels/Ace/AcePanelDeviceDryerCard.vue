<template>
    <v-card outlined class="device-dryer-card" :class="{ 'dryer-active': isDryerActive }">
        <!-- Device Header -->
        <v-card-subtitle class="py-2 px-3 d-flex align-center">
            <v-icon small class="mr-2" :color="isDryerActive ? 'warning' : 'grey'">
                {{ mdiHairDryer }}
            </v-icon>
            <span class="text-subtitle-2 font-weight-bold">{{ deviceName }}</span>
            <v-spacer />
            <v-chip v-if="isDryerActive" x-small color="warning" class="px-2">
                <v-icon x-small left>{{ mdiTimerSand }}</v-icon>
                {{ remainingTimeFormatted }}
            </v-chip>
            <v-chip v-else x-small color="grey" class="px-2">
                {{ $t('Panels.AcePanel.DryerInactive') }}
            </v-chip>
        </v-card-subtitle>

        <v-divider />

        <v-card-text class="py-3 px-3">
            <!-- Temperature Display -->
            <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                    <v-icon small class="mr-2">{{ mdiThermometer }}</v-icon>
                    <span class="text-caption">{{ $t('Panels.AcePanel.Temperature') }}:</span>
                </div>
                <div>
                    <span class="text-subtitle-2 font-weight-bold">
                        {{ currentTemp }}°C
                    </span>
                    <span v-if="isDryerActive" class="text-caption text--secondary">
                        / {{ targetTemp }}°C
                    </span>
                </div>
            </div>

            <!-- Temperature Progress (when active) -->
            <v-progress-linear
                v-if="isDryerActive"
                :value="tempProgress"
                color="warning"
                height="4"
                rounded
                class="mb-3" />

            <!-- Active Dryer Info -->
            <div v-if="isDryerActive" class="active-dryer-info mb-3">
                <div class="d-flex justify-space-between mb-2">
                    <span class="text-caption">{{ $t('Panels.AcePanel.Duration') }}:</span>
                    <span class="text-caption font-weight-bold">{{ totalDuration }} min</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                    <span class="text-caption">{{ $t('Panels.AcePanel.Remaining') }}:</span>
                    <span class="text-caption font-weight-bold">{{ remainingTimeFormatted }}</span>
                </div>
                <v-progress-linear
                    :value="dryingProgress"
                    color="success"
                    height="6"
                    rounded
                    class="mt-1">
                    <template #default="{ value }">
                        <span class="text-caption white--text">{{ Math.ceil(value) }}%</span>
                    </template>
                </v-progress-linear>
            </div>

            <!-- Idle Controls -->
            <div v-if="!isDryerActive" class="dryer-controls">
                <!-- Material Preset Selector -->
                <v-select
                    v-model="selectedMaterialPreset"
                    :items="materialPresets"
                    :label="$t('Panels.AcePanel.MaterialPreset')"
                    dense
                    outlined
                    hide-details
                    class="mb-3"
                    @change="applyMaterialPreset">
                    <template #selection="{ item }">
                        <span class="text-caption">{{ item.text }}</span>
                    </template>
                    <template #item="{ item }">
                        <div class="d-flex flex-column py-1">
                            <span class="text-body-2">{{ item.text }}</span>
                            <span class="text-caption text--secondary">
                                {{ item.temp }}°C • {{ item.duration }} min
                            </span>
                        </div>
                    </template>
                </v-select>

                <!-- Manual Controls -->
                <div class="d-flex gap-2 mb-3">
                    <v-text-field
                        v-model.number="dryerTemp"
                        :label="$t('Panels.AcePanel.Temperature')"
                        type="number"
                        :max="maxDryerTemp"
                        min="30"
                        suffix="°C"
                        dense
                        outlined
                        hide-details
                        class="flex-grow-1" />
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
                        class="flex-grow-1" />
                </div>

                <!-- Start Button -->
                <v-btn
                    color="primary"
                    block
                    small
                    :disabled="!canSendCommands"
                    @click="startDrying">
                    <v-icon small left>{{ mdiPlay }}</v-icon>
                    {{ $t('Panels.AcePanel.StartDrying') }}
                </v-btn>
            </div>

            <!-- Active Controls -->
            <div v-else class="active-controls">
                <v-btn
                    color="error"
                    block
                    small
                    :disabled="!canSendCommands"
                    @click="stopDrying">
                    <v-icon small left>{{ mdiStop }}</v-icon>
                    {{ $t('Panels.AcePanel.StopDrying') }}
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import { mdiHairDryer, mdiPlay, mdiStop, mdiThermometer, mdiTimerSand } from '@mdi/js'

interface MaterialPreset {
    text: string
    value: string
    temp: number
    duration: number
}

@Component
export default class AcePanelDeviceDryerCard extends Mixins(BaseMixin, AceMixin) {
    mdiHairDryer = mdiHairDryer
    mdiPlay = mdiPlay
    mdiStop = mdiStop
    mdiThermometer = mdiThermometer
    mdiTimerSand = mdiTimerSand

    @Prop({ type: Object, required: true }) readonly device!: any

    dryerTemp = 55
    dryerDuration = 240
    selectedMaterialPreset = 'custom'

    // Material presets with recommended drying temperatures and durations
    materialPresets: MaterialPreset[] = [
        { text: 'Custom', value: 'custom', temp: 55, duration: 240 },
        { text: 'PLA', value: 'pla', temp: 45, duration: 120 },
        { text: 'PETG', value: 'petg', temp: 55, duration: 240 },
        { text: 'ABS/ASA', value: 'abs', temp: 60, duration: 240 },
        { text: 'TPU', value: 'tpu', temp: 50, duration: 180 },
        { text: 'Nylon', value: 'nylon', temp: 65, duration: 360 },
        { text: 'PC', value: 'pc', temp: 70, duration: 360 },
    ]

    get deviceId(): string {
        return this.device.device_id ?? ''
    }

    get deviceName(): string {
        return this.device.device_name ?? this.device.name ?? 'ACE Device'
    }

    get gateOffset(): number {
        return this.device.gate_offset ?? 0
    }

    get isDryerActive(): boolean {
        return this.device.status === 'drying'
    }

    get currentTemp(): number {
        return this.device.temp ?? 0
    }

    get targetTemp(): number {
        return this.device.target_temp ?? 0
    }

    get totalDuration(): number {
        return this.device.duration ?? 0
    }

    get remainingTime(): number {
        return this.device.remain_time ?? 0
    }

    get remainingTimeFormatted(): string {
        if (this.remainingTime <= 0) return '00:00'

        const minutes = Math.floor(this.remainingTime / 60)
        const seconds = this.remainingTime % 60
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    get tempProgress(): number {
        if (this.targetTemp === 0) return 0
        return Math.min(100, (this.currentTemp / this.targetTemp) * 100)
    }

    get dryingProgress(): number {
        if (this.totalDuration === 0) return 0
        const elapsed = this.totalDuration - Math.floor(this.remainingTime / 60)
        return Math.min(100, (elapsed / this.totalDuration) * 100)
    }

    get canSendCommands(): boolean {
        return this.aceCanSendCommands
    }

    get maxDryerTemp(): number {
        return this.aceMaxDryerTemp
    }

    applyMaterialPreset() {
        const preset = this.materialPresets.find((p) => p.value === this.selectedMaterialPreset)
        if (preset && preset.value !== 'custom') {
            this.dryerTemp = preset.temp
            this.dryerDuration = preset.duration
        }
    }

    startDrying() {
        // Use gate offset to target this specific device
        this.aceStartDryingForDevice(this.gateOffset, this.dryerTemp, this.dryerDuration)
    }

    stopDrying() {
        // Use gate offset to target this specific device
        this.aceStopDryingForDevice(this.gateOffset)
    }
}
</script>

<style scoped>
.device-dryer-card {
    transition: all 0.3s ease;
    border-width: 2px;
}

.device-dryer-card.dryer-active {
    border-color: var(--v-warning-base);
    box-shadow: 0 0 8px rgba(255, 152, 0, 0.3);
}

.active-dryer-info {
    background-color: rgba(255, 152, 0, 0.05);
    border-radius: 8px;
    padding: 8px;
}

.gap-2 {
    gap: 8px;
}

.dryer-controls,
.active-controls {
    margin-top: 8px;
}
</style>
