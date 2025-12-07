<template>
    <div class="px-1 pb-1">
        <v-item-group class="_btn-group d-flex flex-nowrap w-100">
            <!-- Edit Button - opens gate metadata dialog -->
            <v-tooltip top>
                <template #activator="{ on, attrs }">
                    <v-btn
                        x-small
                        class="flex-grow-1 px-0"
                        v-bind="attrs"
                        v-on="on"
                        @click="editGate">
                        <v-icon x-small>{{ mdiPencil }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ $t('Panels.AcePanel.EditGate') }}</span>
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

            <!-- Feed Assist Button - toggle feed assist on/off -->
            <v-tooltip top>
                <template #activator="{ on, attrs }">
                    <v-btn
                        x-small
                        :color="feedAssistActive ? 'orange' : ''"
                        class="flex-grow-1 px-0"
                        v-bind="attrs"
                        v-on="on"
                        @click="toggleFeedAssist">
                        <v-icon x-small>{{ feedAssistIcon }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ feedAssistTooltip }}</span>
            </v-tooltip>
        </v-item-group>
    </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import AceMixin, { AceGate } from '@/components/mixins/ace'
import { mdiPencil, mdiUndoVariant, mdiRedoVariant, mdiLightningBolt, mdiLightningBoltOutline } from '@mdi/js'

@Component
export default class AcePanelGateActions extends Mixins(BaseMixin, AceMixin) {
    mdiPencil = mdiPencil
    mdiUndoVariant = mdiUndoVariant
    mdiRedoVariant = mdiRedoVariant
    mdiLightningBolt = mdiLightningBolt
    mdiLightningBoltOutline = mdiLightningBoltOutline

    @Prop({ type: Object, required: true }) readonly gate!: AceGate

    editGate() {
        this.$emit('edit')
    }

    feedGate() {
        this.aceFeed(this.gate.index, this.aceRetractLength)
    }

    retractGate() {
        this.aceRetract(this.gate.index, this.aceRetractLength)
    }

    get feedAssistActive(): boolean {
        return this.gate.feed_assist ?? false
    }

    get feedAssistIcon(): string {
        return this.feedAssistActive ? this.mdiLightningBolt : this.mdiLightningBoltOutline
    }

    get feedAssistTooltip(): string {
        const status = this.feedAssistActive ? 'On' : 'Off'
        return `Feed Assist: ${status}`
    }

    toggleFeedAssist() {
        if (this.feedAssistActive) {
            this.aceDisableFeedAssist(this.gate.index)
        } else {
            this.aceEnableFeedAssist(this.gate.index)
        }
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
