<template>
    <v-btn :disabled="printerIsPrintingOnly" dense class="flex-grow-1 px-0" :style="buttonStyle" @click="changeTool">
        {{ name.toUpperCase() }}
    </v-btn>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import ControlMixin from '@/components/mixins/control'
import AceMixin from '@/components/mixins/ace'
import AfcMixin from '@/components/mixins/afc'
import { ServerSpoolmanStateSpool } from '@/store/server/spoolman/types'

@Component({
    components: {},
})
export default class ExtruderControlPanel extends Mixins(BaseMixin, ControlMixin, AceMixin, AfcMixin) {
    @Prop({ type: String }) name!: string

    get macro() {
        const objectName = Object.keys(this.$store.state.printer).find(
            (key) => key.toLowerCase() === `gcode_macro ${this.name?.toLowerCase()}`
        )
        if (!objectName) return undefined

        return this.$store.state.printer[objectName] ?? {}
    }

    get active() {
        // Check macro's active state first
        if (this.macro?.active) return true

        // Also check if this tool is the selected gate in ACE
        if (this.aceExists && this.toolIndex >= 0 && this.toolIndex === this.aceSelectedGate) {
            return true
        }

        return false
    }

    // Extract tool index from name (e.g., "T0" → 0, "T1" → 1)
    get toolIndex(): number {
        const match = this.name?.match(/^T(\d+)$/i)
        return match ? parseInt(match[1], 10) : -1
    }

    // Check if AFC exists
    get afcExists(): boolean {
        return Object.keys(this.afc).length > 0
    }

    // Get gate color from ACE if available
    get aceGateColor(): string | null {
        if (!this.aceExists || this.toolIndex < 0 || this.toolIndex >= this.aceGateColors.length) {
            return null
        }
        const color = this.aceGateColors[this.toolIndex]
        return color && color !== '000000' ? color : null
    }

    // Get lane color from AFC if available
    get afcLaneColor(): string | null {
        if (!this.afcExists || this.afcLanes.length === 0) {
            return null
        }

        // Find lane that maps to this tool
        for (const laneName of this.afcLanes) {
            const lane = this.getAfcLaneObject(laneName)
            if (lane?.map === this.name.toUpperCase()) {
                const color = lane.color?.replace('#', '') ?? null
                return color && color !== '000000' ? color : null
            }
        }

        return null
    }

    get color(): string | null {
        // Priority: ACE gate color > AFC lane color > Spoolman spool > Macro color
        if (this.aceGateColor) {
            return this.aceGateColor
        }

        if (this.afcLaneColor) {
            return this.afcLaneColor
        }

        if (this.spool) {
            return this.spool.filament?.color_hex ?? '000000'
        }

        const color = this.macro?.color ?? this.macro?.colour ?? null
        if (color === '' || color === 'undefined') return null

        return color
    }

    get spoolId() {
        return this.macro?.spool_id ?? null
    }

    get spool() {
        const spools = this.$store.state.server.spoolman.spools ?? []

        return spools.find((spool: ServerSpoolmanStateSpool) => spool.id === this.spoolId) ?? null
    }

    get primaryColor(): string {
        return this.$store.state.gui.uiSettings.primary
    }

    // Calculate readable text color based on background luminance
    getTextColorForBackground(hexColor: string): string {
        let splits = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor)
        if (splits) {
            const r = parseInt(splits[1], 16) * 0.2126
            const g = parseInt(splits[2], 16) * 0.7152
            const b = parseInt(splits[3], 16) * 0.0722
            const perceivedLightness = (r + g + b) / 255

            return perceivedLightness > 0.5 ? '#222' : '#fff'
        }

        return '#ffffff'
    }

    get primaryTextColor(): string {
        return this.getTextColorForBackground(this.primaryColor)
    }

    get warningColor(): string {
        return this.$vuetify?.theme?.currentTheme?.warning?.toString() ?? '#ff8300'
    }

    get buttonStyle() {
        let backgroundColor = ''
        let textColor = ''

        if (this.active) {
            // Active state: use gate color if available, otherwise primary/warning
            if (this.color) {
                backgroundColor = '#' + this.color
                textColor = this.getTextColorForBackground(backgroundColor)
            } else {
                backgroundColor = this.homedAxes.includes('xyz') ? this.primaryColor : this.warningColor
                textColor = this.primaryTextColor
            }
        } else if (this.color) {
            // Inactive state with color: show subtle tint
            backgroundColor = '#' + this.color + '40' // 25% opacity
            textColor = ''
        }

        return {
            color: textColor,
            'background-color': backgroundColor,
        }
    }

    changeTool() {
        this.doSend(this.name.toUpperCase())
    }
}
</script>

<style lang="scss" scoped>
</style>
