<template>
    <v-dialog v-model="showDialog" max-width="450" @click:outside="closeDialog" @keydown.esc="closeDialog">
        <v-card>
            <v-toolbar flat dense>
                <v-toolbar-title>
                    {{ $t('Panels.AcePanel.GateMapping') }} - T{{ gate.index }}
                </v-toolbar-title>
                <v-spacer />
                <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                        <v-btn icon v-bind="attrs" v-on="on" @click="showMaterialLibrary = true">
                            <v-icon>{{ mdiBookshelf }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('Panels.AcePanel.OpenMaterialLibrary') }}</span>
                </v-tooltip>
                <v-btn icon @click="closeDialog">
                    <v-icon>{{ mdiClose }}</v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text class="pt-4">
                <!-- Color Section -->
                <div class="section-label mb-2">
                    <v-icon small class="mr-1">{{ mdiPalette }}</v-icon>
                    {{ $t('Panels.AcePanel.Color') }}
                </div>

                <!-- Color Preview -->
                <div class="d-flex align-center mb-3">
                    <div
                        class="color-preview-large mr-3"
                        :style="{ backgroundColor: colorWithHash }" />
                    <div class="flex-grow-1">
                        <v-text-field
                            v-model="editColor"
                            :label="$t('Panels.AcePanel.ColorHex')"
                            outlined
                            dense
                            hide-details
                            placeholder="FF5733"
                            maxlength="6"
                            class="color-input" />
                    </div>
                </div>

                <!-- Color Presets -->
                <div class="color-presets mb-3">
                    <div class="presets-label text-caption mb-1">{{ $t('Panels.AcePanel.CommonColors') }}</div>
                    <div class="preset-grid">
                        <v-tooltip v-for="preset in colorPresets" :key="preset.hex" bottom>
                            <template #activator="{ on, attrs }">
                                <button
                                    v-bind="attrs"
                                    class="preset-btn"
                                    :class="{ 'preset-selected': editColor.toLowerCase() === preset.hex.toLowerCase() }"
                                    :style="{ backgroundColor: `#${preset.hex}` }"
                                    v-on="on"
                                    @click="selectPreset(preset.hex)" />
                            </template>
                            <span>{{ preset.name }}</span>
                        </v-tooltip>
                    </div>
                </div>

                <!-- Color Picker Toggle -->
                <v-btn
                    x-small
                    text
                    class="mb-3"
                    @click="showColorPicker = !showColorPicker">
                    <v-icon x-small left>{{ showColorPicker ? mdiChevronUp : mdiChevronDown }}</v-icon>
                    {{ showColorPicker ? $t('Panels.AcePanel.HideColorPicker') : $t('Panels.AcePanel.ShowColorPicker') }}
                </v-btn>

                <!-- Color Picker -->
                <v-expand-transition>
                    <div v-show="showColorPicker" class="mb-3">
                        <v-color-picker
                            :value="colorWithHash"
                            hide-mode-switch
                            mode="hexa"
                            flat
                            class="mx-auto color-picker-compact"
                            @update:color="onColorPickerChange" />
                    </div>
                </v-expand-transition>

                <v-divider class="mb-3" />

                <!-- Material Section -->
                <div class="section-label mb-2 d-flex align-center justify-space-between">
                    <div>
                        <v-icon small class="mr-1">{{ mdiCubeOutline }}</v-icon>
                        {{ $t('Panels.AcePanel.Material') }}
                    </div>
                    <v-btn x-small text color="primary" @click="showMaterialLibrary = true">
                        <v-icon x-small left>{{ mdiBookshelf }}</v-icon>
                        {{ $t('Panels.AcePanel.Library') }}
                    </v-btn>
                </div>
                <v-select
                    v-model="editMaterial"
                    :items="materialOptions"
                    outlined
                    dense
                    hide-details
                    class="mb-3">
                    <template #prepend-item>
                        <v-list-item @click="showMaterialLibrary = true">
                            <v-list-item-icon>
                                <v-icon>{{ mdiBookshelf }}</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title class="primary--text">
                                    {{ $t('Panels.AcePanel.OpenMaterialLibrary') }}
                                </v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-divider class="my-2" />
                    </template>
                </v-select>

                <v-divider class="mb-3" />

                <!-- Temperature Section -->
                <div class="section-label mb-2">
                    <v-icon small class="mr-1">{{ mdiThermometer }}</v-icon>
                    {{ $t('Panels.AcePanel.ExtrusionTemperature') }}
                </div>
                <v-text-field
                    v-model.number="editTemp"
                    type="number"
                    min="150"
                    max="300"
                    suffix="°C"
                    outlined
                    dense
                    :hint="tempHint"
                    persistent-hint>
                    <template #append>
                        <v-tooltip bottom>
                            <template #activator="{ on, attrs }">
                                <v-btn
                                    icon
                                    x-small
                                    v-bind="attrs"
                                    v-on="on"
                                    @click="resetTempToDefault">
                                    <v-icon small>{{ mdiRefresh }}</v-icon>
                                </v-btn>
                            </template>
                            <span>{{ $t('Panels.AcePanel.ResetToDefault') }}</span>
                        </v-tooltip>
                    </template>
                </v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-btn text small @click="resetAll">
                    <v-icon small left>{{ mdiUndoVariant }}</v-icon>
                    {{ $t('Panels.AcePanel.Reset') }}
                </v-btn>
                <v-spacer />
                <v-btn text @click="closeDialog">
                    {{ $t('Panels.AcePanel.Cancel') }}
                </v-btn>
                <v-btn color="primary" text @click="saveChanges">
                    {{ $t('Panels.AcePanel.Save') }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Material Library Dialog -->
        <ace-material-library-dialog
            :show="showMaterialLibrary"
            @apply="applyMaterialProfile"
            @close="showMaterialLibrary = false" />
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin, { AceGate } from '@/components/mixins/ace'
import {
    mdiClose,
    mdiPalette,
    mdiCubeOutline,
    mdiThermometer,
    mdiChevronUp,
    mdiChevronDown,
    mdiRefresh,
    mdiUndoVariant,
    mdiBookshelf
} from '@mdi/js'
import { Debounce } from 'vue-debounce-decorator'
import { VColorPickerColor } from 'vuetify/src/components/VColorPicker/util'
import { MaterialProfile } from '@/store/ace/materialLibrary'

interface ColorPreset {
    name: string
    hex: string
}

@Component({
    components: {
        AceMaterialLibraryDialog: () => import('./AceMaterialLibraryDialog.vue'),
    },
})
export default class AceGateMapDialog extends Mixins(BaseMixin, AceMixin) {
    mdiClose = mdiClose
    mdiPalette = mdiPalette
    mdiCubeOutline = mdiCubeOutline
    mdiThermometer = mdiThermometer
    mdiChevronUp = mdiChevronUp
    mdiChevronDown = mdiChevronDown
    mdiRefresh = mdiRefresh
    mdiUndoVariant = mdiUndoVariant
    mdiBookshelf = mdiBookshelf

    @Prop({ type: Boolean, required: true }) readonly show!: boolean
    @Prop({ type: Object, required: true }) readonly gate!: AceGate

    editColor = ''
    editMaterial = 'PLA'
    editTemp = 50
    showColorPicker = false
    tempManuallySet = false
    showMaterialLibrary = false

    // Color presets for common filament colors
    colorPresets: ColorPreset[] = [
        // Basic colors
        { name: 'Black', hex: '000000' },
        { name: 'White', hex: 'FFFFFF' },
        { name: 'Red', hex: 'FF0000' },
        { name: 'Blue', hex: '0000FF' },
        { name: 'Green', hex: '00FF00' },
        { name: 'Yellow', hex: 'FFFF00' },
        { name: 'Orange', hex: 'FF8C00' },
        { name: 'Purple', hex: '800080' },
        { name: 'Pink', hex: 'FF69B4' },
        { name: 'Gray', hex: '808080' },
        { name: 'Brown', hex: '8B4513' },
        { name: 'Cyan', hex: '00FFFF' },
        // Metallic/Special
        { name: 'Silver', hex: 'C0C0C0' },
        { name: 'Gold', hex: 'FFD700' },
        { name: 'Transparent', hex: 'E8E8E8' },
    ]

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

    // Default print/extrusion temperatures for each material type
    materialTempMap: Record<string, number> = {
        'PLA': 210,
        'PETG': 230,
        'ABS': 250,
        'ASA': 250,
        'TPU': 220,
        'Nylon': 260,
        'PC': 270,
        'PVA': 200,
        'HIPS': 230,
        'Wood': 200,
        'Carbon': 230,
        'Other': 210,
    }

    get showDialog() {
        return this.show
    }

    set showDialog(value: boolean) {
        if (!value) this.$emit('close')
    }

    get colorWithHash() {
        const color = this.editColor.replace('#', '')
        return `#${color}`
    }

    get defaultTempForMaterial(): number {
        return this.materialTempMap[this.editMaterial] ?? 50
    }

    get tempHint(): string {
        if (this.editTemp === this.defaultTempForMaterial) {
            return this.$t('Panels.AcePanel.RecommendedForMaterial', { material: this.editMaterial }).toString()
        }
        return this.$t('Panels.AcePanel.DefaultTemp', { temp: this.defaultTempForMaterial }).toString()
    }

    @Watch('show')
    onShowChange(newVal: boolean) {
        if (newVal) {
            // Initialize with current gate values
            this.editColor = this.gate.color.replace('#', '')
            this.editMaterial = this.gate.material
            this.editTemp = this.gate.temp
            this.showColorPicker = false
            this.tempManuallySet = false
        }
    }

    @Watch('editMaterial')
    onMaterialChange(newVal: string, oldVal: string) {
        // Only auto-update temperature if user hasn't manually set it
        if (!this.tempManuallySet && oldVal !== newVal) {
            this.editTemp = this.defaultTempForMaterial
        }
    }

    selectPreset(hex: string) {
        this.editColor = hex
    }

    @Debounce(300)
    onColorPickerChange(color: VColorPickerColor) {
        this.editColor = color.hex.replace('#', '')
    }

    resetTempToDefault() {
        this.editTemp = this.defaultTempForMaterial
        this.tempManuallySet = false
    }

    resetAll() {
        this.editColor = this.gate.color.replace('#', '')
        this.editMaterial = this.gate.material
        this.editTemp = this.gate.temp
        this.tempManuallySet = false
    }

    closeDialog() {
        this.$emit('close')
    }

    saveChanges() {
        // Remove # from color if present
        const color = this.editColor.replace('#', '')

        // Optimistically update the Vuex store to provide immediate visual feedback
        // This will be overwritten when the backend responds, but prevents UI lag
        const aceState = this.$store.state.printer.ace
        if (aceState && aceState.gate_color && aceState.gate_material && aceState.gate_temp) {
            // Create new arrays with the modified values
            const gateColors = [...aceState.gate_color]
            const gateMaterials = [...aceState.gate_material]
            const gateTemps = [...aceState.gate_temp]

            // Update the specific gate values
            gateColors[this.gate.index] = color
            gateMaterials[this.gate.index] = this.editMaterial
            gateTemps[this.gate.index] = this.editTemp

            // Create a completely new ace object to ensure reactivity
            // This forces Vue to detect the change at the top level
            const newAceState = {
                ...aceState,
                gate_color: gateColors,
                gate_material: gateMaterials,
                gate_temp: gateTemps,
            }

            // Use proper Vuex mutation to update state reactively
            this.$store.commit('printer/setData', {
                ace: newAceState
            })
        }

        // Send command to backend (will eventually overwrite optimistic update)
        this.aceSetGateMap(this.gate.index, color, this.editMaterial, this.editTemp)
        this.closeDialog()
    }

    applyMaterialProfile(profile: MaterialProfile) {
        // Apply material profile settings to current gate
        this.editMaterial = profile.name
        this.editTemp = profile.defaultTemp // Use print temp, not dryer temp
        this.tempManuallySet = false

        // Optionally apply a color suggestion if available
        if (profile.colorSuggestions && profile.colorSuggestions.length > 0) {
            this.editColor = profile.colorSuggestions[0]
        }

        // Close material library
        this.showMaterialLibrary = false
    }
}
</script>

<style scoped>
.section-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    opacity: 0.7;
    display: flex;
    align-items: center;
}

.color-preview-large {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    border: 2px solid rgba(128, 128, 128, 0.3);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.color-input {
    font-family: monospace;
}

.preset-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
}

.preset-btn {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.preset-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.preset-selected {
    border-color: var(--v-primary-base);
    box-shadow: 0 0 0 2px var(--v-primary-base);
}

.color-picker-compact {
    max-width: 100%;
}

.color-picker-compact ::v-deep .v-color-picker__canvas {
    height: 120px;
}

.presets-label {
    opacity: 0.6;
}
</style>
