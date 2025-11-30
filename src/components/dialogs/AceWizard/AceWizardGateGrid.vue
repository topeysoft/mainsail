<template>
    <div class="gate-grid-container">
        <!-- Toolbar -->
        <div class="toolbar mb-4">
            <div class="d-flex align-center justify-space-between flex-wrap gap-2">
                <div class="d-flex align-center gap-2">
                    <v-checkbox
                        v-model="selectAll"
                        dense
                        hide-details
                        class="mt-0"
                        :label="$t('Panels.AcePanel.SetupWizard.SelectAll')" />

                    <v-chip small outlined>
                        {{ selectedGates.length }} {{ $t('Panels.AcePanel.SetupWizard.Selected') }}
                    </v-chip>
                </div>

                <div v-if="selectedGates.length > 0" class="bulk-actions d-flex gap-2">
                    <template v-if="mode === 'material'">
                        <v-select
                            v-model="bulkMaterial"
                            :items="materialOptions"
                            dense
                            outlined
                            hide-details
                            style="max-width: 150px"
                            :label="$t('Panels.AcePanel.Material')">
                            <template #prepend-inner>
                                <v-icon small>{{ mdiCubeOutline }}</v-icon>
                            </template>
                        </v-select>

                        <v-text-field
                            v-model.number="bulkTemp"
                            type="number"
                            dense
                            outlined
                            hide-details
                            suffix="°C"
                            style="max-width: 100px"
                            :label="$t('Panels.AcePanel.Temp')" />

                        <v-btn small color="primary" @click="applyBulkMaterial">
                            <v-icon small left>{{ mdiCheckAll }}</v-icon>
                            {{ $t('Panels.AcePanel.SetupWizard.ApplyToSelected') }}
                        </v-btn>
                    </template>

                    <template v-else-if="mode === 'color'">
                        <div class="d-flex align-center gap-2">
                            <div class="color-preview" :style="{ backgroundColor: bulkColorHash }" />
                            <v-text-field
                                v-model="bulkColor"
                                dense
                                outlined
                                hide-details
                                maxlength="6"
                                style="max-width: 120px"
                                placeholder="FF0000"
                                :label="$t('Panels.AcePanel.Color')" />

                            <v-menu offset-y :close-on-content-click="false">
                                <template #activator="{ on, attrs }">
                                    <v-btn small icon v-bind="attrs" v-on="on">
                                        <v-icon>{{ mdiPalette }}</v-icon>
                                    </v-btn>
                                </template>
                                <v-card>
                                    <v-color-picker
                                        :value="bulkColorHash"
                                        hide-mode-switch
                                        mode="hexa"
                                        flat
                                        @update:color="onBulkColorChange" />
                                </v-card>
                            </v-menu>

                            <v-btn small color="primary" @click="applyBulkColor">
                                <v-icon small left>{{ mdiCheckAll }}</v-icon>
                                {{ $t('Panels.AcePanel.SetupWizard.ApplyToSelected') }}
                            </v-btn>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Gate Grid by Device -->
        <div v-for="device in devices" :key="device.deviceId" class="device-section mb-4">
            <div class="device-header mb-2">
                <v-icon small class="mr-2">{{ mdiServer }}</v-icon>
                <span class="font-weight-medium">{{ device.alias || device.deviceId }}</span>
                <v-chip x-small class="ml-2">
                    Gates {{ device.gateOffset }}-{{ device.gateOffset + 3 }}
                </v-chip>
            </div>

            <v-row dense>
                <v-col
                    v-for="gateIndex in getDeviceGateIndices(device)"
                    :key="gateIndex"
                    cols="6"
                    sm="3">
                    <gate-card
                        :gate="getGate(gateIndex)"
                        :selected="isSelected(gateIndex)"
                        :mode="mode"
                        @click="toggleSelection(gateIndex)"
                        @update="updateGate" />
                </v-col>
            </v-row>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'
import { mdiCubeOutline, mdiCheckAll, mdiPalette, mdiServer } from '@mdi/js'
import { DeviceSetupConfig, GateSetupConfig } from '@/store/ace/setup'
import GateCard from './GateCard.vue'

@Component({
    components: {
        GateCard,
    },
})
export default class AceWizardGateGrid extends Vue {
    mdiCubeOutline = mdiCubeOutline
    mdiCheckAll = mdiCheckAll
    mdiPalette = mdiPalette
    mdiServer = mdiServer

    @Prop({ type: Array, required: true }) readonly gates!: GateSetupConfig[]
    @Prop({ type: Array, required: true }) readonly devices!: DeviceSetupConfig[]
    @Prop({ type: String, default: 'material' }) readonly mode!: 'material' | 'color'

    selectedGates: number[] = []
    bulkMaterial = 'PLA'
    bulkTemp = 50
    bulkColor = 'FFFFFF'

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

    materialTempMap: Record<string, number> = {
        PLA: 50,
        PETG: 55,
        ABS: 60,
        ASA: 60,
        TPU: 50,
        Nylon: 70,
        PC: 70,
        PVA: 50,
        HIPS: 55,
        Wood: 50,
        Carbon: 55,
        Other: 50,
    }

    get selectAll() {
        return this.selectedGates.length === this.gates.length && this.gates.length > 0
    }

    set selectAll(value: boolean) {
        if (value) {
            this.selectedGates = this.gates.map((g) => g.index)
        } else {
            this.selectedGates = []
        }
    }

    get bulkColorHash() {
        return `#${this.bulkColor.replace('#', '')}`
    }

    @Watch('bulkMaterial')
    onBulkMaterialChange(newVal: string) {
        // Auto-update temp when material changes
        this.bulkTemp = this.materialTempMap[newVal] || 50
    }

    getDeviceGateIndices(device: DeviceSetupConfig): number[] {
        return [
            device.gateOffset,
            device.gateOffset + 1,
            device.gateOffset + 2,
            device.gateOffset + 3,
        ]
    }

    getGate(index: number): GateSetupConfig | undefined {
        return this.gates.find((g) => g.index === index)
    }

    isSelected(index: number): boolean {
        return this.selectedGates.includes(index)
    }

    toggleSelection(index: number) {
        const idx = this.selectedGates.indexOf(index)
        if (idx >= 0) {
            this.selectedGates.splice(idx, 1)
        } else {
            this.selectedGates.push(index)
        }
    }

    updateGate(payload: { index: number; updates: Partial<GateSetupConfig> }) {
        this.$emit('update', payload)
    }

    applyBulkMaterial() {
        if (this.selectedGates.length === 0) return

        this.$emit('update-bulk', {
            indices: this.selectedGates,
            updates: {
                material: this.bulkMaterial,
                temp: this.bulkTemp,
            },
        })

        // Clear selection after applying
        this.selectedGates = []
    }

    applyBulkColor() {
        if (this.selectedGates.length === 0) return

        this.$emit('update-bulk', {
            indices: this.selectedGates,
            updates: {
                color: this.bulkColor.replace('#', ''),
            },
        })

        // Clear selection after applying
        this.selectedGates = []
    }

    onBulkColorChange(color: any) {
        this.bulkColor = color.hex.replace('#', '')
    }
}
</script>

<style scoped>
.gate-grid-container {
    max-width: 100%;
}

.toolbar {
    background: rgba(128, 128, 128, 0.05);
    padding: 12px;
    border-radius: 8px;
}

.gap-2 {
    gap: 8px;
}

.bulk-actions {
    flex-wrap: wrap;
}

.device-section {
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 8px;
    padding: 12px;
}

.device-header {
    display: flex;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.color-preview {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 2px solid rgba(128, 128, 128, 0.3);
    flex-shrink: 0;
}
</style>
