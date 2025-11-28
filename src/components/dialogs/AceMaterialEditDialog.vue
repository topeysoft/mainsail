<template>
    <v-dialog v-model="showDialog" max-width="600" persistent @keydown.esc="cancel">
        <v-card>
            <v-toolbar flat dense color="primary" dark>
                <v-toolbar-title>
                    <v-icon left>{{ editing ? mdiPencil : mdiPlus }}</v-icon>
                    {{ editing ? $t('Panels.AcePanel.EditMaterial') : $t('Panels.AcePanel.CreateMaterial') }}
                </v-toolbar-title>
                <v-spacer />
                <v-btn icon @click="cancel">
                    <v-icon>{{ mdiClose }}</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text class="pt-4">
                <v-form ref="form" v-model="formValid">
                    <!-- Material Name -->
                    <v-text-field
                        v-model="editedProfile.name"
                        :label="$t('Panels.AcePanel.MaterialName')"
                        :rules="[rules.required]"
                        outlined
                        dense
                        required
                        autofocus
                        class="mb-2" />

                    <!-- Description -->
                    <v-textarea
                        v-model="editedProfile.description"
                        :label="$t('Panels.AcePanel.Description')"
                        outlined
                        dense
                        rows="2"
                        class="mb-2" />

                    <v-divider class="my-4" />

                    <!-- Print Temperature -->
                    <div class="text-caption font-weight-bold mb-2">
                        <v-icon small class="mr-1">{{ mdiThermometer }}</v-icon>
                        {{ $t('Panels.AcePanel.PrintSettings') }}
                    </div>

                    <v-text-field
                        v-model.number="editedProfile.defaultTemp"
                        :label="$t('Panels.AcePanel.DefaultPrintTemp')"
                        :rules="[rules.required, rules.tempRange]"
                        type="number"
                        min="150"
                        max="300"
                        suffix="°C"
                        outlined
                        dense
                        class="mb-2" />

                    <v-divider class="my-4" />

                    <!-- Dryer Settings -->
                    <div class="text-caption font-weight-bold mb-2">
                        <v-icon small class="mr-1">{{ mdiHairDryer }}</v-icon>
                        {{ $t('Panels.AcePanel.DryerSettings') }}
                    </div>

                    <v-row dense>
                        <v-col cols="6">
                            <v-text-field
                                v-model.number="editedProfile.dryerTemp"
                                :label="$t('Panels.AcePanel.DryerTemp')"
                                :rules="[rules.required, rules.dryerTempRange]"
                                type="number"
                                min="30"
                                max="80"
                                suffix="°C"
                                outlined
                                dense />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field
                                v-model.number="editedProfile.dryerDuration"
                                :label="$t('Panels.AcePanel.DryerDuration')"
                                :rules="[rules.required, rules.durationRange]"
                                type="number"
                                min="1"
                                max="720"
                                suffix="min"
                                outlined
                                dense />
                        </v-col>
                    </v-row>

                    <v-divider class="my-4" />

                    <!-- Speed Settings -->
                    <div class="text-caption font-weight-bold mb-2">
                        <v-icon small class="mr-1">{{ mdiSpeedometer }}</v-icon>
                        {{ $t('Panels.AcePanel.SpeedSettings') }}
                    </div>

                    <v-row dense>
                        <v-col cols="6">
                            <v-text-field
                                v-model.number="editedProfile.feedSpeed"
                                :label="$t('Panels.AcePanel.FeedSpeed')"
                                :rules="[rules.required, rules.speedRange]"
                                type="number"
                                min="1"
                                max="100"
                                suffix="mm/s"
                                outlined
                                dense />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field
                                v-model.number="editedProfile.retractSpeed"
                                :label="$t('Panels.AcePanel.RetractSpeed')"
                                :rules="[rules.required, rules.speedRange]"
                                type="number"
                                min="1"
                                max="100"
                                suffix="mm/s"
                                outlined
                                dense />
                        </v-col>
                    </v-row>

                    <v-divider class="my-4" />

                    <!-- Color Suggestions -->
                    <div class="text-caption font-weight-bold mb-2">
                        <v-icon small class="mr-1">{{ mdiPalette }}</v-icon>
                        {{ $t('Panels.AcePanel.ColorSuggestions') }}
                    </div>

                    <div class="color-chips mb-2">
                        <v-chip
                            v-for="(color, index) in editedProfile.colorSuggestions"
                            :key="index"
                            small
                            close
                            :style="{ backgroundColor: `#${color}`, color: getContrastColor(color) }"
                            @click:close="removeColorSuggestion(index)">
                            #{{ color }}
                        </v-chip>
                    </div>

                    <v-text-field
                        v-model="newColorInput"
                        :label="$t('Panels.AcePanel.AddColor')"
                        placeholder="FF0000"
                        outlined
                        dense
                        maxlength="6"
                        @keyup.enter="addColorSuggestion">
                        <template #append>
                            <v-btn icon small @click="addColorSuggestion">
                                <v-icon>{{ mdiPlus }}</v-icon>
                            </v-btn>
                        </template>
                    </v-text-field>
                </v-form>
            </v-card-text>

            <v-card-actions>
                <v-btn text @click="cancel">
                    {{ $t('Panels.AcePanel.Cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn color="primary" :disabled="!formValid" @click="save">
                    {{ $t('Panels.AcePanel.Save') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { MaterialProfile } from '@/store/ace/materialLibrary'
import {
    mdiClose,
    mdiPlus,
    mdiPencil,
    mdiThermometer,
    mdiHairDryer,
    mdiSpeedometer,
    mdiPalette,
} from '@mdi/js'

@Component
export default class AceMaterialEditDialog extends Mixins(BaseMixin) {
    mdiClose = mdiClose
    mdiPlus = mdiPlus
    mdiPencil = mdiPencil
    mdiThermometer = mdiThermometer
    mdiHairDryer = mdiHairDryer
    mdiSpeedometer = mdiSpeedometer
    mdiPalette = mdiPalette

    @Prop({ type: Boolean, required: true }) readonly show!: boolean
    @Prop({ type: Object, default: null }) readonly profile!: MaterialProfile | null

    formValid = false
    newColorInput = ''

    editedProfile: Partial<MaterialProfile> = {
        name: '',
        description: '',
        defaultTemp: 200,
        dryerTemp: 50,
        dryerDuration: 240,
        feedSpeed: 50,
        retractSpeed: 50,
        colorSuggestions: [],
    }

    rules = {
        required: (v: any) => !!v || this.$t('Panels.AcePanel.Required'),
        tempRange: (v: number) =>
            (v >= 150 && v <= 300) || this.$t('Panels.AcePanel.TempRangeError'),
        dryerTempRange: (v: number) =>
            (v >= 30 && v <= 80) || this.$t('Panels.AcePanel.DryerTempRangeError'),
        durationRange: (v: number) =>
            (v >= 1 && v <= 720) || this.$t('Panels.AcePanel.DurationRangeError'),
        speedRange: (v: number) =>
            (v >= 1 && v <= 100) || this.$t('Panels.AcePanel.SpeedRangeError'),
    }

    get showDialog() {
        return this.show
    }

    get editing(): boolean {
        return this.profile !== null
    }

    mounted() {
        if (this.profile) {
            this.editedProfile = { ...this.profile }
        }
    }

    addColorSuggestion() {
        const color = this.newColorInput.replace('#', '').toUpperCase()
        if (/^[0-9A-F]{6}$/i.test(color)) {
            if (!this.editedProfile.colorSuggestions) {
                this.editedProfile.colorSuggestions = []
            }
            if (!this.editedProfile.colorSuggestions.includes(color)) {
                this.editedProfile.colorSuggestions.push(color)
                this.newColorInput = ''
            }
        }
    }

    removeColorSuggestion(index: number) {
        this.editedProfile.colorSuggestions?.splice(index, 1)
    }

    getContrastColor(hex: string): string {
        // Calculate luminance and return black or white for contrast
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return luminance > 0.5 ? '#000000' : '#FFFFFF'
    }

    save() {
        const form = this.$refs.form as any
        if (form.validate()) {
            this.$emit('save', {
                ...this.editedProfile,
                isCustom: true,
                id: this.profile?.id || `custom_${Date.now()}`,
            } as MaterialProfile)
        }
    }

    cancel() {
        this.$emit('close')
    }
}
</script>

<style scoped>
.color-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
