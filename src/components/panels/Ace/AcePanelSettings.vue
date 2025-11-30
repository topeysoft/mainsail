<template>
    <div>
        <v-btn icon tile @click="showDialog = true">
            <v-icon>{{ mdiCog }}</v-icon>
        </v-btn>
        <v-dialog v-model="showDialog" max-width="400">
            <v-card>
                <v-toolbar flat dense>
                    <v-toolbar-title>
                        {{ $t('Panels.AcePanel.Settings') }}
                    </v-toolbar-title>
                    <v-spacer />
                    <v-btn icon @click="showDialog = false">
                        <v-icon>{{ mdiClose }}</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-card-text class="pt-4">
                    <!-- Setup Wizard Button -->
                    <v-btn
                        block
                        outlined
                        color="primary"
                        class="mb-4"
                        @click="openSetupWizard">
                        <v-icon left>{{ mdiWizardHat }}</v-icon>
                        {{ $t('Panels.AcePanel.SetupWizard.Title') }}
                    </v-btn>

                    <v-divider class="mb-4" />

                    <v-switch
                        v-model="showEndlessSpool"
                        :label="$t('Panels.AcePanel.ShowEndlessSpool')"
                        hide-details
                        class="mt-0" />
                    <v-switch
                        v-model="showGateWeights"
                        :label="$t('Panels.AcePanel.ShowGateWeights')"
                        hide-details
                        class="mb-3" />
                    <v-text-field
                        v-model.number="retractLength"
                        :label="$t('Panels.AcePanel.RetractLength')"
                        type="number"
                        min="100"
                        max="1000"
                        suffix="mm"
                        dense
                        outlined
                        hide-details />
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiCog, mdiClose, mdiWizardHat } from '@mdi/js'

@Component
export default class AcePanelSettings extends Mixins(BaseMixin) {
    mdiCog = mdiCog
    mdiClose = mdiClose
    mdiWizardHat = mdiWizardHat

    showDialog = false

    get showEndlessSpool() {
        return this.$store.state.gui.view.ace?.showEndlessSpool ?? true
    }

    set showEndlessSpool(value: boolean) {
        this.$store.dispatch('gui/saveSetting', {
            name: 'view.ace.showEndlessSpool',
            value,
        })
    }

    get showGateWeights() {
        return this.$store.state.gui.view.ace?.showGateWeights ?? true
    }

    set showGateWeights(value: boolean) {
        this.$store.dispatch('gui/saveSetting', {
            name: 'view.ace.showGateWeights',
            value,
        })
    }

    get retractLength() {
        return this.$store.state.gui.view.ace?.retractLength ?? 600
    }

    set retractLength(value: number) {
        this.$store.dispatch('gui/saveSetting', {
            name: 'view.ace.retractLength',
            value,
        })
    }

    openSetupWizard() {
        this.showDialog = false
        this.$store.dispatch('ace/setup/openWizard')
    }
}
</script>
