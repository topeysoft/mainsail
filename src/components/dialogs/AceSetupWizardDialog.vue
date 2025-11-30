<template>
    <v-dialog
        v-model="showDialog"
        max-width="900"
        persistent
        scrollable
        @keydown.esc="handleEscape">
        <v-card>
            <!-- Header -->
            <v-toolbar flat>
                <v-icon left large color="primary">{{ mdiWizardHat }}</v-icon>
                <v-toolbar-title>
                    {{ $t('Panels.AcePanel.SetupWizard.Title') }}
                </v-toolbar-title>
                <v-spacer />
                <v-chip small outlined class="mr-2">
                    {{ $t('Panels.AcePanel.SetupWizard.Step') }} {{ currentStep + 1 }} / {{ totalSteps }}
                </v-chip>
                <v-btn icon @click="handleClose">
                    <v-icon>{{ mdiClose }}</v-icon>
                </v-btn>
            </v-toolbar>

            <!-- Progress Bar -->
            <v-progress-linear :value="progress" color="primary" height="4" />

            <!-- Stepper Content -->
            <v-card-text style="min-height: 450px; max-height: 600px">
                <v-stepper v-model="stepperModel" vertical class="elevation-0">
                    <!-- Step 1: Welcome & Device Detection -->
                    <v-stepper-step :complete="currentStep > 0" step="1" editable>
                        {{ $t('Panels.AcePanel.SetupWizard.WelcomeTitle') }}
                        <small>{{ $t('Panels.AcePanel.SetupWizard.WelcomeSubtitle') }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="1">
                        <div class="wizard-content">
                            <div class="text-center mb-6">
                                <v-icon size="80" color="primary">{{ mdiPrinter3dNozzle }}</v-icon>
                                <h2 class="text-h5 mt-4">{{ $t('Panels.AcePanel.SetupWizard.WelcomeHeading') }}</h2>
                                <p class="text-body-1 mt-3 grey--text">
                                    {{ $t('Panels.AcePanel.SetupWizard.WelcomeMessage') }}
                                </p>
                            </div>

                            <v-card outlined class="mb-4">
                                <v-card-text>
                                    <div class="d-flex align-center justify-space-between mb-3">
                                        <div>
                                            <div class="text-subtitle-1 font-weight-bold">
                                                {{ $t('Panels.AcePanel.SetupWizard.DeviceDetection') }}
                                            </div>
                                            <div class="text-caption grey--text">
                                                {{ devicesDetectedText }}
                                            </div>
                                        </div>
                                        <v-btn
                                            small
                                            outlined
                                            color="primary"
                                            :loading="scanning"
                                            @click="scanDevices">
                                            <v-icon small left>{{ mdiRefresh }}</v-icon>
                                            {{ $t('Panels.AcePanel.SetupWizard.Rescan') }}
                                        </v-btn>
                                    </div>

                                    <v-expand-transition>
                                        <div v-if="devices.length > 0">
                                            <v-divider class="mb-3" />
                                            <div class="device-preview-list">
                                                <v-chip
                                                    v-for="device in devices"
                                                    :key="device.deviceId"
                                                    small
                                                    class="ma-1">
                                                    <v-icon small left :color="device.connected ? 'success' : 'error'">
                                                        {{ device.connected ? mdiCheckCircle : mdiAlertCircle }}
                                                    </v-icon>
                                                    {{ device.alias || device.deviceId }}
                                                    <span class="ml-1 grey--text">(Gates {{ device.gateOffset }}-{{ device.gateOffset + 3 }})</span>
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-expand-transition>
                                </v-card-text>
                            </v-card>

                            <v-alert v-if="devices.length === 0" type="warning" text>
                                {{ $t('Panels.AcePanel.SetupWizard.NoDevicesWarning') }}
                            </v-alert>

                            <!-- Quick Import Option -->
                            <v-divider class="my-4" />
                            <div class="text-center">
                                <p class="text-caption grey--text mb-2">
                                    {{ $t('Panels.AcePanel.SetupWizard.OrImportConfig') }}
                                </p>
                                <v-btn
                                    small
                                    text
                                    color="primary"
                                    @click="$refs.welcomeFileInput.click()">
                                    <v-icon small left>{{ mdiUpload }}</v-icon>
                                    {{ $t('Panels.AcePanel.SetupWizard.ImportConfiguration') }}
                                </v-btn>
                                <input
                                    ref="welcomeFileInput"
                                    type="file"
                                    accept="application/json,.json"
                                    style="display: none"
                                    @change="handleImportFromWelcome" />
                            </div>
                        </div>
                    </v-stepper-content>

                    <!-- Step 2: Device Naming -->
                    <v-stepper-step :complete="currentStep > 1" step="2" editable>
                        {{ $t('Panels.AcePanel.SetupWizard.DeviceNamingTitle') }}
                        <small>{{ $t('Panels.AcePanel.SetupWizard.DeviceNamingSubtitle') }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="2">
                        <div class="wizard-content">
                            <p class="text-body-2 mb-4">
                                {{ $t('Panels.AcePanel.SetupWizard.DeviceNamingDescription') }}
                            </p>

                            <v-row>
                                <v-col
                                    v-for="device in devices"
                                    :key="device.deviceId"
                                    cols="12"
                                    md="6">
                                    <ace-wizard-device-card
                                        :device="device"
                                        @update="updateDevice" />
                                </v-col>
                            </v-row>
                        </div>
                    </v-stepper-content>

                    <!-- Step 3: Material Configuration -->
                    <v-stepper-step :complete="currentStep > 2" step="3" editable>
                        {{ $t('Panels.AcePanel.SetupWizard.MaterialConfigTitle') }}
                        <small>{{ configuredGatesText }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="3">
                        <div class="wizard-content">
                            <div class="d-flex align-center justify-space-between mb-4">
                                <p class="text-body-2 mb-0">
                                    {{ $t('Panels.AcePanel.SetupWizard.MaterialConfigDescription') }}
                                </p>
                                <v-btn
                                    small
                                    text
                                    color="primary"
                                    @click="showMaterialLibrary = true">
                                    <v-icon small left>{{ mdiBookshelf }}</v-icon>
                                    {{ $t('Panels.AcePanel.Library') }}
                                </v-btn>
                            </div>

                            <ace-wizard-gate-grid
                                :gates="gates"
                                :devices="devices"
                                mode="material"
                                @update="updateGate"
                                @update-bulk="updateGatesBulk" />
                        </div>
                    </v-stepper-content>

                    <!-- Step 4: Color Assignment -->
                    <v-stepper-step :complete="currentStep > 3" step="4" editable>
                        {{ $t('Panels.AcePanel.SetupWizard.ColorAssignmentTitle') }}
                        <small>{{ $t('Panels.AcePanel.SetupWizard.ColorAssignmentSubtitle') }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="4">
                        <div class="wizard-content">
                            <p class="text-body-2 mb-4">
                                {{ $t('Panels.AcePanel.SetupWizard.ColorAssignmentDescription') }}
                            </p>

                            <ace-wizard-gate-grid
                                :gates="gates"
                                :devices="devices"
                                mode="color"
                                @update="updateGate"
                                @update-bulk="updateGatesBulk" />
                        </div>
                    </v-stepper-content>

                    <!-- Step 5: Summary & Finish -->
                    <v-stepper-step :complete="currentStep > 4" step="5">
                        {{ $t('Panels.AcePanel.SetupWizard.SummaryTitle') }}
                        <small>{{ $t('Panels.AcePanel.SetupWizard.SummarySubtitle') }}</small>
                    </v-stepper-step>
                    <v-stepper-content step="5">
                        <div class="wizard-content">
                            <ace-wizard-summary
                                :devices="devices"
                                :gates="gates"
                                :endless-spool="endlessSpool"
                                @edit-step="goToStep"
                                @toggle-endless-spool="toggleEndlessSpool" />
                        </div>
                    </v-stepper-content>
                </v-stepper>
            </v-card-text>

            <!-- Footer Navigation -->
            <v-divider />
            <v-card-actions class="pa-4">
                <v-btn
                    v-if="currentStep === 0"
                    text
                    @click="skipWizard">
                    {{ $t('Panels.AcePanel.SetupWizard.SkipForNow') }}
                </v-btn>
                <v-btn
                    v-else
                    text
                    @click="prevStep">
                    <v-icon left>{{ mdiChevronLeft }}</v-icon>
                    {{ $t('Panels.AcePanel.SetupWizard.Back') }}
                </v-btn>

                <v-spacer />

                <v-btn
                    v-if="currentStep < totalSteps - 1"
                    color="primary"
                    :disabled="!canProceed"
                    @click="nextStep">
                    {{ $t('Panels.AcePanel.SetupWizard.Next') }}
                    <v-icon right>{{ mdiChevronRight }}</v-icon>
                </v-btn>
                <v-btn
                    v-else
                    color="primary"
                    :loading="completing"
                    @click="completeWizard">
                    <v-icon left>{{ mdiCheck }}</v-icon>
                    {{ $t('Panels.AcePanel.SetupWizard.Complete') }}
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
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin from '@/components/mixins/ace'
import {
    mdiWizardHat,
    mdiClose,
    mdiPrinter3dNozzle,
    mdiRefresh,
    mdiCheckCircle,
    mdiAlertCircle,
    mdiChevronLeft,
    mdiChevronRight,
    mdiCheck,
    mdiBookshelf,
    mdiUpload,
} from '@mdi/js'
import { MaterialProfile } from '@/store/ace/materialLibrary'
import { DeviceSetupConfig, GateSetupConfig } from '@/store/ace/setup'

@Component({
    components: {
        AceWizardDeviceCard: () => import('./AceWizard/AceWizardDeviceCard.vue'),
        AceWizardGateGrid: () => import('./AceWizard/AceWizardGateGrid.vue'),
        AceWizardSummary: () => import('./AceWizard/AceWizardSummary.vue'),
        AceMaterialLibraryDialog: () => import('./AceMaterialLibraryDialog.vue'),
    },
})
export default class AceSetupWizardDialog extends Mixins(BaseMixin, AceMixin) {
    mdiWizardHat = mdiWizardHat
    mdiClose = mdiClose
    mdiPrinter3dNozzle = mdiPrinter3dNozzle
    mdiRefresh = mdiRefresh
    mdiCheckCircle = mdiCheckCircle
    mdiAlertCircle = mdiAlertCircle
    mdiChevronLeft = mdiChevronLeft
    mdiChevronRight = mdiChevronRight
    mdiCheck = mdiCheck
    mdiBookshelf = mdiBookshelf
    mdiUpload = mdiUpload

    scanning = false
    completing = false
    showMaterialLibrary = false

    get showDialog() {
        return this.$store.getters['ace/setup/isWizardOpen']
    }

    set showDialog(value: boolean) {
        if (!value) {
            this.$store.dispatch('ace/setup/closeWizard')
        }
    }

    get currentStep() {
        return this.$store.getters['ace/setup/currentStep']
    }

    get totalSteps() {
        return this.$store.getters['ace/setup/totalSteps']
    }

    get progress() {
        return this.$store.getters['ace/setup/progress']
    }

    get canProceed() {
        return this.$store.getters['ace/setup/canProceedToNextStep']
    }

    get devices(): DeviceSetupConfig[] {
        return this.$store.getters['ace/setup/devices']
    }

    get gates(): GateSetupConfig[] {
        return this.$store.getters['ace/setup/gates']
    }

    get endlessSpool(): boolean {
        return this.$store.getters['ace/setup/endlessSpool']
    }

    get stepperModel() {
        return this.currentStep + 1
    }

    set stepperModel(value: number) {
        this.$store.dispatch('ace/setup/goToStep', value - 1)
    }

    get devicesDetectedText() {
        const count = this.devices.length
        if (count === 0) {
            return this.$t('Panels.AcePanel.SetupWizard.NoDevicesDetected')
        } else if (count === 1) {
            return this.$t('Panels.AcePanel.SetupWizard.OneDeviceDetected')
        } else {
            return this.$t('Panels.AcePanel.SetupWizard.MultipleDevicesDetected', { count })
        }
    }

    get configuredGatesText() {
        const configured = this.$store.getters['ace/setup/configuredGatesCount']
        const total = this.$store.getters['ace/setup/totalGatesCount']
        return `${configured} / ${total} ${this.$t('Panels.AcePanel.SetupWizard.GatesConfigured')}`
    }

    async mounted() {
        // Load current ACE state when wizard opens
        await this.$store.dispatch('ace/setup/loadFromAceState')

        // Note: Removed auto-scan on mount to prevent console spam
        // Users can manually click "Rescan" button if needed
    }

    async scanDevices() {
        this.scanning = true
        try {
            // Trigger device scan via G-code
            this.doSendAce('ACE_SCAN_DEVICES')

            // Wait for scan to complete
            await new Promise((resolve) => setTimeout(resolve, 1500))

            // Reload state from ACE
            await this.$store.dispatch('ace/setup/loadFromAceState')
        } catch (error) {
            console.error('Device scan failed:', error)
        } finally {
            this.scanning = false
        }
    }

    updateDevice(payload: { deviceId: string; updates: Partial<DeviceSetupConfig> }) {
        this.$store.dispatch('ace/setup/updateDevice', payload)
    }

    updateGate(payload: { index: number; updates: Partial<GateSetupConfig> }) {
        this.$store.dispatch('ace/setup/updateGate', payload)
    }

    updateGatesBulk(payload: { indices: number[]; updates: Partial<GateSetupConfig> }) {
        this.$store.dispatch('ace/setup/updateGatesBulk', payload)
    }

    toggleEndlessSpool(enabled: boolean) {
        this.$store.dispatch('ace/setup/setEndlessSpool', enabled)
    }

    applyMaterialProfile(profile: MaterialProfile) {
        // Apply to all unconfigured gates or show selection dialog
        const unconfiguredGates = this.gates.filter((g) => !g.configured).map((g) => g.index)

        if (unconfiguredGates.length > 0) {
            this.updateGatesBulk({
                indices: unconfiguredGates,
                updates: {
                    material: profile.name,
                    temp: profile.dryerTemp,
                },
            })
        }

        this.showMaterialLibrary = false
    }

    goToStep(step: number) {
        this.$store.dispatch('ace/setup/goToStep', step)
    }

    nextStep() {
        this.$store.dispatch('ace/setup/nextStep')
    }

    prevStep() {
        this.$store.dispatch('ace/setup/prevStep')
    }

    skipWizard() {
        this.$store.dispatch('ace/setup/skipWizard')
    }

    async completeWizard() {
        this.completing = true
        try {
            await this.$store.dispatch('ace/setup/completeWizard')
            this.$toast.success(this.$t('Panels.AcePanel.SetupWizard.SetupComplete').toString())
        } catch (error) {
            console.error('Failed to complete setup:', error)
            this.$toast.error(this.$t('Panels.AcePanel.SetupWizard.SetupFailed').toString())
        } finally {
            this.completing = false
        }
    }

    handleEscape() {
        if (this.currentStep === 0) {
            this.skipWizard()
        }
    }

    handleClose() {
        // Close wizard - progress is automatically saved
        if (this.currentStep === 0) {
            // On welcome screen, count as skip
            this.skipWizard()
        } else {
            // On other steps, just close (auto-saves progress)
            this.$store.dispatch('ace/setup/closeWizard')
        }
    }

    async handleImportFromWelcome(event: Event) {
        const input = event.target as HTMLInputElement
        if (!input.files || input.files.length === 0) return

        const file = input.files[0]

        try {
            const text = await file.text()
            const config = JSON.parse(text)

            // Import configuration via store action
            const result = await this.$store.dispatch('ace/setup/importConfiguration', config)

            // Show success or warnings
            if (result.warnings && result.warnings.length > 0) {
                const warningMsg = this.$t('Panels.AcePanel.SetupWizard.PartialImport').toString()
                this.$toast.warning(`${warningMsg}: ${result.warnings.join(', ')}`)
            } else {
                this.$toast.success(this.$t('Panels.AcePanel.SetupWizard.ImportSuccess').toString())
            }

            // Move to next step to review imported settings
            this.nextStep()
        } catch (error) {
            console.error('Failed to import configuration:', error)
            const errorMsg =
                error instanceof Error ? error.message : this.$t('Panels.AcePanel.SetupWizard.InvalidConfigFile')
            this.$toast.error(this.$t('Panels.AcePanel.SetupWizard.ImportFailed', { error: errorMsg }).toString())
        }

        // Reset file input
        input.value = ''
    }
}
</script>

<style scoped>
.wizard-content {
    padding: 16px;
    min-height: 350px;
}

.device-preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

/* Remove stepper connector lines for cleaner look */
::v-deep .v-stepper__step__step {
    margin-right: 12px !important;
}

::v-deep .v-stepper--vertical .v-stepper__content {
    padding-left: 36px;
}

::v-deep .v-stepper--vertical {
    box-shadow: none !important;
}
</style>
