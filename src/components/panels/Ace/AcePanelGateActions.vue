<template>
    <div class="px-1 pb-1">
        <v-item-group class="_btn-group d-flex flex-nowrap w-100">
            <!-- Load Button - always available to switch tools -->
            <v-tooltip top>
                <template #activator="{ on, attrs }">
                    <v-btn
                        :disabled="!aceCanSendCommands || (gate.loaded && gate.selected)"
                        x-small
                        class="flex-grow-1 px-0"
                        v-bind="attrs"
                        v-on="on"
                        @click="loadGate">
                        <v-icon x-small>{{ mdiArrowDownBold }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ $t('Panels.AcePanel.LoadFilament') }}</span>
            </v-tooltip>

            <!-- Unload Button - only for selected gate that is loaded -->
            <v-tooltip top>
                <template #activator="{ on, attrs }">
                    <v-btn
                        :disabled="!aceCanSendCommands || !gate.loaded || !gate.selected"
                        x-small
                        class="flex-grow-1 px-0"
                        v-bind="attrs"
                        v-on="on"
                        @click="unloadGate">
                        <v-icon x-small>{{ mdiArrowUpBold }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ $t('Panels.AcePanel.UnloadFilament') }}</span>
            </v-tooltip>

            <!-- Feed Button - push filament forward -->
            <v-tooltip top>
                <template #activator="{ on, attrs }">
                    <v-btn
                        :disabled="!aceCanSendCommands || gate.status === 'empty'"
                        x-small
                        class="flex-grow-1 px-0"
                        v-bind="attrs"
                        v-on="on"
                        @click="feedGate">
                        <v-icon x-small>{{ mdiRedoVariant }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ $t('Panels.AcePanel.FeedFilament') }}</span>
            </v-tooltip>

            <!-- Retract/Respool Button - only when gate has filament (not empty) -->
            <v-tooltip top>
                <template #activator="{ on, attrs }">
                    <v-btn
                        :disabled="!aceCanSendCommands || gate.status === 'empty'"
                        x-small
                        class="flex-grow-1 px-0"
                        v-bind="attrs"
                        v-on="on"
                        @click="retractGate">
                        <v-icon x-small>{{ mdiUndoVariant }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ $t('Panels.AcePanel.RetractFilament') }}</span>
            </v-tooltip>
        </v-item-group>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin, { AceGate } from '@/components/mixins/ace'
import { mdiArrowDownBold, mdiArrowUpBold, mdiUndoVariant, mdiRedoVariant } from '@mdi/js'

@Component
export default class AcePanelGateActions extends Mixins(BaseMixin, AceMixin) {
    mdiArrowUpBold = mdiArrowUpBold
    mdiArrowDownBold = mdiArrowDownBold
    mdiUndoVariant = mdiUndoVariant
    mdiRedoVariant = mdiRedoVariant

    @Prop({ type: Object, required: true }) readonly gate!: AceGate

    loadGate() {
        this.aceChangeTool(this.gate.index)
    }

    unloadGate() {
        this.aceUnload()
    }

    feedGate() {
        this.aceFeed(this.gate.index, this.aceRetractLength)
    }

    retractGate() {
        this.aceRetract(this.gate.index, this.aceRetractLength)
    }
}
</script>

<style scoped>
._btn-group {
    border-radius: 4px;
}

._btn-group .v-btn {
    border-radius: 4px;
    border-color: rgba(255, 255, 255, 0.12);
    border-style: solid;
    border-width: thin;
    box-shadow: none;
    height: 20px;
    opacity: 0.8;
    min-width: auto !important;
}

html.theme--light ._btn-group .v-btn {
    border-color: rgba(0, 0, 0, 0.12);
}
</style>
