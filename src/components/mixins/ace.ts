import Vue from 'vue'
import Component from 'vue-class-component'

export interface AceGate {
    index: number
    status: string
    color: string
    material: string
    temp: number
    spool_id?: number
    loaded?: boolean
    selected?: boolean
    feed_assist?: boolean
}

export interface AceDryerStatus {
    active: boolean
    temp: number
    duration: number
    remaining: number
}

@Component
export default class AceMixin extends Vue {
    get ace() {
        // BunnyACE module registers as 'ace' in Klipper
        return this.$store.state.printer.ace ?? {}
    }

    get aceExists(): boolean {
        return Object.keys(this.ace).length > 0
    }

    get aceStatus(): string {
        // Check if any devices are connected
        if (this.aceDevices.length === 0) {
            return 'disconnected'
        }

        // If all devices are disconnected, status is disconnected
        const allDisconnected = this.aceDevices.every((dev) => !dev.connected)
        if (allDisconnected) {
            return 'disconnected'
        }

        // Check the status of the first connected device
        const connectedDevice = this.aceDevices.find((dev) => dev.connected)
        if (connectedDevice && connectedDevice.status) {
            return connectedDevice.status.status ?? 'idle'
        }

        // Default to idle if connected but no status
        return 'idle'
    }

    get aceTemperature(): number {
        return this.ace.temp ?? 0
    }

    get aceDryerStatus(): AceDryerStatus {
        const dryer = this.ace.dryer_status ?? {}
        return {
            active: dryer.status === 'drying',
            temp: dryer.target_temp ?? 0,
            duration: dryer.duration ?? 0,
            remaining: dryer.remain_time ?? 0,
        }
    }

    get aceGateColors(): string[] {
        return this.ace.gate_color ?? ['000000', '000000', '000000', '000000']
    }

    get aceGateMaterials(): string[] {
        return this.ace.gate_material ?? ['PLA', 'PLA', 'PLA', 'PLA']
    }

    get aceGateTemps(): number[] {
        return this.ace.gate_temp ?? [0, 0, 0, 0]
    }

    get aceActiveGateStates(): string[] {
        return this.ace.active_gate ?? ['empty', 'empty', 'empty', 'empty']
    }

    // Returns the index of the currently loaded gate, or -1 if none
    get aceActiveGate(): number {
        const states = this.aceActiveGateStates
        // Find gate that is 'loaded' or similar active state
        return states.findIndex((state) => state === 'loaded' || state === 'active')
    }

    get aceSelectedGate(): number {
        return this.ace.selected_gate ?? -1
    }

    get aceSpoolIds(): number[] {
        return this.ace.spool_id ?? [0, 0, 0, 0]
    }

    get aceEndlessSpool(): boolean {
        return this.ace.endless_spool ?? false
    }

    get aceFeedAssist(): boolean {
        // This may come from a different status field
        return this.ace.feed_assist ?? false
    }

    get aceGateFeedAssist(): boolean[] {
        return this.ace.gate_feed_assist ?? [false, false, false, false]
    }

    get aceFilamentPos(): string {
        return this.ace.filament_pos ?? 'unknown'
    }

    get aceCurrentIndex(): number {
        return this.ace.current_index ?? -1
    }

    // GUI settings for panel display preferences
    get aceShowGateWeights(): boolean {
        return this.$store.state.gui.view.ace?.showGateWeights ?? true
    }

    get aceShowEndlessSpool(): boolean {
        return this.$store.state.gui.view.ace?.showEndlessSpool ?? true
    }

    get aceMaxDryerTemp(): number {
        // Default max dryer temp from BunnyACE config
        return 70
    }

    get aceRetractLength(): number {
        return this.$store.state.gui.view.ace?.retractLength ?? 600
    }

    // Get a specific gate object with all its properties
    getAceGate(index: number): AceGate {
        // Always use top-level arrays for user-configured metadata (material, color, temp)
        // These are persisted configuration values
        const material = this.aceGateMaterials[index] ?? ''
        const color = this.aceGateColors[index] ?? 'FFFFFF'
        const temp = this.aceGateTemps[index] ?? 230
        const spoolId = this.aceSpoolIds[index] ?? 0

        // Check if we have device-specific data for runtime status
        const devices = this.ace.devices
        if (devices && Array.isArray(devices)) {
            // Find which device owns this gate
            const device = devices.find((d: any) => {
                const offset = d.gate_offset ?? 0
                return index >= offset && index < offset + 4
            })

            if (device && device.status) {
                // Calculate local gate index within this device
                const localIndex = index - (device.gate_offset ?? 0)
                const slot = device.status.slots?.[localIndex]

                if (slot) {
                    const gateState = slot.status ?? 'empty'

                    return {
                        index,
                        status: gateState,
                        color: color,
                        material: material,
                        temp: temp,
                        spool_id: spoolId,
                        loaded: gateState === 'loaded' || gateState === 'active',
                        selected: index === this.aceSelectedGate,
                        feed_assist: this.aceGateFeedAssist[index] ?? false,
                    }
                }
            }
        }

        // Fallback to top-level arrays for backward compatibility
        const gateState = this.aceActiveGateStates[index] ?? 'empty'
        return {
            index,
            status: gateState,
            color: color,
            material: material,
            temp: temp,
            spool_id: spoolId,
            loaded: gateState === 'loaded' || gateState === 'active',
            selected: index === this.aceSelectedGate,
            feed_assist: this.aceGateFeedAssist[index] ?? false,
        }
    }

    // Get all gates as an array (dynamic based on num_gates)
    get aceGates(): AceGate[] {
        const numGates = this.ace.num_gates ?? 4

        // CRITICAL: Access these getters directly to establish reactive dependencies
        // Without this, Vue won't know that aceGates depends on these arrays
        const colors = this.aceGateColors
        const materials = this.aceGateMaterials
        const temps = this.aceGateTemps
        const states = this.aceActiveGateStates
        const spoolIds = this.aceSpoolIds
        const selectedGate = this.aceSelectedGate
        const feedAssist = this.aceGateFeedAssist

        // Build gates array using the cached reactive values
        return Array.from({ length: numGates }, (_, index) => {
            const gateState = states[index] ?? 'empty'
            return {
                index,
                status: gateState,
                color: colors[index] ?? '000000',
                material: materials[index] ?? 'PLA',
                temp: temps[index] ?? 0,
                spool_id: spoolIds[index] ?? 0,
                loaded: gateState === 'loaded' || gateState === 'active',
                selected: index === selectedGate,
                feed_assist: feedAssist[index] ?? false,
            }
        })
    }

    // Get number of gates
    get aceNumGates(): number {
        return this.ace.num_gates ?? 4
    }

    // Get gates for a specific device (helper for device-grouped UI)
    getAceGatesForDevice(deviceId: string): AceGate[] {
        const device = this.getAceDevice(deviceId)
        if (!device) return []

        const offset = device.gate_offset ?? 0
        const gates: AceGate[] = []

        for (let i = 0; i < 4; i++) {
            gates.push(this.getAceGate(offset + i))
        }

        return gates
    }

    // Check if printer is in a state where ACE commands are safe
    // Note: Dryer commands are always safe to use, even during printing
    get aceCanSendCommands(): boolean {
        // Allow all commands - dryer operations don't interfere with printing
        return true
    }

    // Check if dryer is currently active
    get aceDryerActive(): boolean {
        return this.aceDryerStatus.active
    }

    // Format remaining dryer time as MM:SS
    get aceDryerRemainingFormatted(): string {
        const remaining = this.aceDryerStatus.remaining
        if (remaining <= 0) return '00:00'

        const minutes = Math.floor(remaining / 60)
        const seconds = remaining % 60
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    // Send G-code command to ACE
    doSendAce(gcode: string) {
        this.$store.dispatch('server/addEvent', { message: gcode, type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: gcode })
    }

    // Convenience methods for common ACE commands
    aceChangeTool(tool: number) {
        this.doSendAce(`T${tool}`)
    }

    aceUnload() {
        this.doSendAce('T-1')
    }

    aceStartDrying(temp: number, duration: number) {
        this.doSendAce(`ACE_START_DRYING TEMP=${temp} DURATION=${duration}`)
    }

    aceStopDrying() {
        this.doSendAce('ACE_STOP_DRYING')
    }

    // Per-device dryer control methods (for multi-device setups)
    aceStartDryingForDevice(gateOffset: number, temp: number, duration: number) {
        this.doSendAce(`ACE_START_DRYING GATE=${gateOffset} TEMP=${temp} DURATION=${duration}`)
    }

    aceStopDryingForDevice(gateOffset: number) {
        this.doSendAce(`ACE_STOP_DRYING GATE=${gateOffset}`)
    }

    aceEnableFeedAssist(index: number) {
        this.doSendAce(`ACE_ENABLE_FEED_ASSIST INDEX=${index}`)
    }

    aceDisableFeedAssist(index: number) {
        this.doSendAce(`ACE_DISABLE_FEED_ASSIST INDEX=${index}`)
    }

    aceSetGateMap(gate: number, color: string, type: string, temp: number) {
        this.doSendAce(`ACE_GATE_MAP GATE=${gate} COLOR=${color} TYPE=${type} TEMP=${temp}`)
    }

    aceSetEndlessSpool(enable: boolean) {
        this.doSendAce(`ACE_ENDLESS_SPOOL ENABLE=${enable ? 1 : 0}`)
    }

    aceFeed(index: number, length: number, speed?: number) {
        let cmd = `ACE_FEED INDEX=${index} LENGTH=${length}`
        if (speed !== undefined) cmd += ` SPEED=${speed}`
        this.doSendAce(cmd)
    }

    aceRetract(index: number, length: number, speed?: number) {
        let cmd = `ACE_RETRACT INDEX=${index} LENGTH=${length}`
        if (speed !== undefined) cmd += ` SPEED=${speed}`
        this.doSendAce(cmd)
    }

    aceSetSelectedGate(gate: number) {
        this.doSendAce(`ACE_SET_GATE GATE=${gate}`)
    }

    aceClearSelection() {
        this.doSendAce('ACE_CLEAR_SELECTION')
    }

    // Device management methods (Phase 2)

    get aceDevices(): any[] {
        return this.ace.devices ?? []
    }

    get aceNumDevices(): number {
        return this.ace.num_devices ?? 0
    }

    get aceHasMultipleDevices(): boolean {
        return this.aceNumDevices > 1
    }

    // Get device by ID
    getAceDevice(deviceId: string): any | null {
        return this.aceDevices.find((dev) => dev.device_id === deviceId) || null
    }

    // Get device for a specific gate number
    getAceDeviceForGate(gateIndex: number): any | null {
        for (const dev of this.aceDevices) {
            const offset = dev.gate_offset ?? 0
            if (gateIndex >= offset && gateIndex < offset + 4) {
                return dev
            }
        }
        return null
    }

    // Scan for ACE devices
    aceScanDevices(apply: boolean = false, verbose: boolean = false) {
        let cmd = 'ACE_SCAN_DEVICES'
        if (apply) cmd += ' APPLY=1'
        if (verbose) cmd += ' VERBOSE=1'
        this.doSendAce(cmd)
    }

    // List ACE devices
    aceListDevices() {
        this.doSendAce('ACE_LIST_DEVICES')
    }

    // Get device connection status
    getAceDeviceStatus(deviceId: string): string {
        const device = this.getAceDevice(deviceId)
        return device?.connection_status ?? 'unknown'
    }

    // Get device health
    getAceDeviceHealth(deviceId: string): any {
        const device = this.getAceDevice(deviceId)
        return device?.health ?? {}
    }

    // Check if any device is disconnected
    get aceHasDisconnectedDevices(): boolean {
        return this.aceDevices.some((dev) => !dev.connected)
    }

    // Get formatted uptime for a device
    getAceDeviceUptimeFormatted(deviceId: string): string {
        const device = this.getAceDevice(deviceId)
        const uptime = device?.health?.uptime ?? 0

        if (uptime === 0) return 'N/A'

        const hours = Math.floor(uptime / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }
}
