<template>
    <v-card
        outlined
        class="gate-card"
        :class="{ 'gate-selected': selected, 'gate-configured': gate.configured }"
        @click="$emit('click')">
        <v-card-text class="pa-2">
            <!-- Gate Header -->
            <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-caption font-weight-bold">
                    T{{ gate.index }}
                </div>
                <v-checkbox
                    :input-value="selected"
                    dense
                    hide-details
                    class="mt-0 pt-0"
                    @click.stop
                    @change="$emit('click')" />
            </div>

            <!-- Material Mode -->
            <template v-if="mode === 'material'">
                <v-select
                    :value="gate.material"
                    :items="materialOptions"
                    dense
                    outlined
                    hide-details
                    class="mb-2"
                    @click.stop
                    @change="updateMaterial">
                    <template #prepend-inner>
                        <v-icon x-small>{{ mdiCubeOutline }}</v-icon>
                    </template>
                </v-select>

                <v-text-field
                    :value="gate.temp"
                    type="number"
                    dense
                    outlined
                    hide-details
                    suffix="°C"
                    @click.stop
                    @input="updateTemp">
                    <template #prepend-inner>
                        <v-icon x-small>{{ mdiThermometer }}</v-icon>
                    </template>
                </v-text-field>
            </template>

            <!-- Color Mode -->
            <template v-else-if="mode === 'color'">
                <div class="d-flex align-center gap-2 mb-2">
                    <div
                        class="color-preview-large"
                        :style="{ backgroundColor: colorHash }"
                        @click.stop="showColorPicker = !showColorPicker" />
                    <v-text-field
                        :value="gate.color"
                        dense
                        outlined
                        hide-details
                        maxlength="6"
                        placeholder="FFFFFF"
                        @click.stop
                        @input="updateColor">
                        <template #prepend-inner>
                            <span class="text-caption grey--text">#</span>
                        </template>
                    </v-text-field>
                </div>

                <!-- Color Picker Expansion -->
                <v-expand-transition>
                    <div v-show="showColorPicker" @click.stop>
                        <v-color-picker
                            :value="colorHash"
                            hide-mode-switch
                            mode="hexa"
                            flat
                            width="100%"
                            class="color-picker-mini"
                            @update:color="onColorChange" />
                    </div>
                </v-expand-transition>

                <!-- Show material if configured -->
                <div v-if="gate.material" class="text-caption grey--text text-center mt-1">
                    {{ gate.material }}
                </div>
            </template>

            <!-- Configuration Status -->
            <div v-if="gate.configured" class="mt-2 text-center">
                <v-icon x-small color="success">{{ mdiCheckCircle }}</v-icon>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { mdiCubeOutline, mdiThermometer, mdiCheckCircle } from '@mdi/js'
import { GateSetupConfig } from '@/store/ace/setup'

@Component
export default class GateCard extends Vue {
    mdiCubeOutline = mdiCubeOutline
    mdiThermometer = mdiThermometer
    mdiCheckCircle = mdiCheckCircle

    @Prop({ type: Object, required: true }) readonly gate!: GateSetupConfig
    @Prop({ type: Boolean, default: false }) readonly selected!: boolean
    @Prop({ type: String, default: 'material' }) readonly mode!: 'material' | 'color'

    showColorPicker = false

    materialOptions = [
        'PLA',
        'PETG',
        'ABS',
        'ASA',
        'TPU',
        'Nylon',
        'PC',
        'PVA',
        'HIPS',
        'Wood',
        'Carbon',
        'Other',
    ]

    get colorHash() {
        return `#${this.gate.color.replace('#', '')}`
    }

    updateMaterial(value: string) {
        this.$emit('update', {
            index: this.gate.index,
            updates: { material: value },
        })
    }

    updateTemp(value: number) {
        this.$emit('update', {
            index: this.gate.index,
            updates: { temp: value },
        })
    }

    updateColor(value: string) {
        this.$emit('update', {
            index: this.gate.index,
            updates: { color: value.replace('#', '') },
        })
    }

    onColorChange(color: any) {
        this.updateColor(color.hex)
    }
}
</script>

<style scoped>
.gate-card {
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.gate-card:hover {
    border-color: rgba(128, 128, 128, 0.3);
}

.gate-selected {
    border-color: var(--v-primary-base) !important;
    background-color: rgba(var(--v-primary-base-rgb), 0.05);
}

.gate-configured {
    background-color: rgba(76, 175, 80, 0.05);
}

.color-preview-large {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    border: 2px solid rgba(128, 128, 128, 0.3);
    cursor: pointer;
    transition: transform 0.15s ease;
    flex-shrink: 0;
}

.color-preview-large:hover {
    transform: scale(1.05);
}

.gap-2 {
    gap: 8px;
}

.color-picker-mini ::v-deep .v-color-picker__canvas {
    height: 100px;
}
</style>
