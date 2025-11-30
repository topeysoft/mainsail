import Vue from 'vue'
import { Module } from 'vuex'
import { RootState } from '@/store/types'

export interface DeviceSetupConfig {
    deviceId: string
    alias: string
    port: string
    gateOffset: number
    connected: boolean
}

export interface GateSetupConfig {
    index: number
    color: string
    material: string
    temp: number
    configured: boolean
}

export interface SetupWizardState {
    showWizard: boolean
    currentStep: number
    completed: boolean
    firstTimeSetup: boolean
    devices: DeviceSetupConfig[]
    gates: GateSetupConfig[]
    endlessSpool: boolean
    skipCount: number
    lastModified: number
}

const STORAGE_KEY = 'ace_wizard_state'
const SETUP_COMPLETED_KEY = 'ace_setup_completed'

// Load initial state from localStorage
const loadState = (): Partial<SetupWizardState> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('Failed to load wizard state:', e)
    }
    return {}
}

const loadSetupCompleted = (): boolean => {
    try {
        const completed = localStorage.getItem(SETUP_COMPLETED_KEY)
        return completed === 'true'
    } catch (e) {
        return false
    }
}

const getDefaultState = (): SetupWizardState => ({
    showWizard: false,
    currentStep: 0,
    completed: loadSetupCompleted(),
    firstTimeSetup: !loadSetupCompleted(),
    devices: [],
    gates: [],
    endlessSpool: false,
    skipCount: 0,
    lastModified: Date.now(),
})

export const setup: Module<SetupWizardState, RootState> = {
    namespaced: true,

    state: {
        ...getDefaultState(),
        ...loadState(),
    },

    getters: {
        isWizardOpen: (state) => state.showWizard,
        currentStep: (state) => state.currentStep,
        isCompleted: (state) => state.completed,
        isFirstTimeSetup: (state) => state.firstTimeSetup,
        devices: (state) => state.devices,
        gates: (state) => state.gates,
        endlessSpool: (state) => state.endlessSpool,
        canProceedToNextStep: (state) => {
            switch (state.currentStep) {
                case 0: // Welcome - can always proceed
                    return true
                case 1: // Device naming - require at least one device
                    return state.devices.length > 0
                case 2: // Material config - require all gates configured
                    return state.gates.every((g) => g.material !== '')
                case 3: // Color assignment - can proceed without colors
                    return true
                case 4: // Summary - can always proceed
                    return true
                default:
                    return false
            }
        },
        totalSteps: () => 5,
        progress: (state, getters) => {
            const totalSteps = getters.totalSteps
            return Math.round(((state.currentStep + 1) / totalSteps) * 100)
        },
        configuredGatesCount: (state) => state.gates.filter((g) => g.configured).length,
        totalGatesCount: (state) => state.gates.length,
        hasUnsavedChanges: (state) => {
            // Check if state differs from defaults
            return state.devices.some((d) => d.alias !== '') || state.gates.some((g) => g.configured)
        },
    },

    mutations: {
        OPEN_WIZARD(state) {
            state.showWizard = true
        },

        CLOSE_WIZARD(state) {
            state.showWizard = false
        },

        SET_STEP(state, step: number) {
            state.currentStep = Math.max(0, Math.min(step, 4))
            state.lastModified = Date.now()
        },

        NEXT_STEP(state) {
            if (state.currentStep < 4) {
                state.currentStep++
                state.lastModified = Date.now()
            }
        },

        PREV_STEP(state) {
            if (state.currentStep > 0) {
                state.currentStep--
                state.lastModified = Date.now()
            }
        },

        SET_DEVICES(state, devices: DeviceSetupConfig[]) {
            state.devices = devices
            state.lastModified = Date.now()
        },

        UPDATE_DEVICE(state, { deviceId, updates }: { deviceId: string; updates: Partial<DeviceSetupConfig> }) {
            const device = state.devices.find((d) => d.deviceId === deviceId)
            if (device) {
                Object.assign(device, updates)
                state.lastModified = Date.now()
            }
        },

        SET_GATES(state, gates: GateSetupConfig[]) {
            state.gates = gates
            state.lastModified = Date.now()
        },

        UPDATE_GATE(state, { index, updates }: { index: number; updates: Partial<GateSetupConfig> }) {
            const gate = state.gates.find((g) => g.index === index)
            if (gate) {
                Object.assign(gate, updates)
                if (updates.color || updates.material || updates.temp !== undefined) {
                    gate.configured = true
                }
                state.lastModified = Date.now()
            }
        },

        UPDATE_GATES_BULK(state, { indices, updates }: { indices: number[]; updates: Partial<GateSetupConfig> }) {
            indices.forEach((index) => {
                const gate = state.gates.find((g) => g.index === index)
                if (gate) {
                    Object.assign(gate, updates)
                    if (updates.color || updates.material || updates.temp !== undefined) {
                        gate.configured = true
                    }
                }
            })
            state.lastModified = Date.now()
        },

        SET_ENDLESS_SPOOL(state, enabled: boolean) {
            state.endlessSpool = enabled
            state.lastModified = Date.now()
        },

        MARK_COMPLETED(state) {
            state.completed = true
            state.firstTimeSetup = false
            localStorage.setItem(SETUP_COMPLETED_KEY, 'true')
        },

        INCREMENT_SKIP_COUNT(state) {
            state.skipCount++
        },

        RESET_WIZARD(state) {
            const defaults = getDefaultState()
            Object.assign(state, {
                ...defaults,
                completed: state.completed, // Preserve completion status
                firstTimeSetup: false, // No longer first time if reset
            })
        },

        SAVE_STATE(state) {
            try {
                const stateToSave = {
                    currentStep: state.currentStep,
                    devices: state.devices,
                    gates: state.gates,
                    endlessSpool: state.endlessSpool,
                    skipCount: state.skipCount,
                    lastModified: state.lastModified,
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
            } catch (e) {
                console.error('Failed to save wizard state:', e)
            }
        },

        CLEAR_SAVED_STATE() {
            try {
                localStorage.removeItem(STORAGE_KEY)
            } catch (e) {
                console.error('Failed to clear wizard state:', e)
            }
        },
    },

    actions: {
        async openWizard({ commit, dispatch }) {
            commit('OPEN_WIZARD')
            // Initialize devices and gates from current ACE state
            await dispatch('loadFromAceState')
        },

        closeWizard({ commit, state }) {
            // Save state before closing
            if (state.currentStep > 0 && !state.completed) {
                commit('SAVE_STATE')
            }
            commit('CLOSE_WIZARD')
        },

        skipWizard({ commit }) {
            commit('INCREMENT_SKIP_COUNT')
            commit('CLOSE_WIZARD')
        },

        goToStep({ commit, state }, step: number) {
            // Save state before changing steps
            if (state.currentStep !== step) {
                commit('SET_STEP', step)
                commit('SAVE_STATE')
            }
        },

        nextStep({ commit, state }) {
            commit('NEXT_STEP')
            commit('SAVE_STATE')
        },

        prevStep({ commit, state }) {
            commit('PREV_STEP')
            commit('SAVE_STATE')
        },

        async loadFromAceState({ commit, rootState }) {
            const ace = rootState.printer?.ace
            if (!ace) return

            // Load devices
            const devices: DeviceSetupConfig[] = (ace.devices || []).map((dev: any) => ({
                deviceId: dev.device_id || '',
                alias: dev.name || '',
                port: dev.port || '',
                gateOffset: dev.gate_offset || 0,
                connected: dev.connected || false,
            }))
            commit('SET_DEVICES', devices)

            // Load gates
            const numGates = ace.num_gates || ace.total_gates || 4
            const gates: GateSetupConfig[] = Array.from({ length: numGates }, (_, i) => ({
                index: i,
                color: ace.gate_color?.[i] || 'FFFFFF',
                material: ace.gate_material?.[i] || '',
                temp: ace.gate_temp?.[i] || 50,
                configured: !!(ace.gate_material?.[i] && ace.gate_color?.[i]),
            }))
            commit('SET_GATES', gates)

            // Load endless spool setting
            commit('SET_ENDLESS_SPOOL', ace.endless_spool || false)
        },

        updateDevice({ commit }, payload: { deviceId: string; updates: Partial<DeviceSetupConfig> }) {
            commit('UPDATE_DEVICE', payload)
            commit('SAVE_STATE')
        },

        updateGate({ commit }, payload: { index: number; updates: Partial<GateSetupConfig> }) {
            commit('UPDATE_GATE', payload)
            commit('SAVE_STATE')
        },

        updateGatesBulk({ commit }, payload: { indices: number[]; updates: Partial<GateSetupConfig> }) {
            commit('UPDATE_GATES_BULK', payload)
            commit('SAVE_STATE')
        },

        setEndlessSpool({ commit }, enabled: boolean) {
            commit('SET_ENDLESS_SPOOL', enabled)
            commit('SAVE_STATE')
        },

        async completeWizard({ commit, state, dispatch }) {
            // Apply all settings to backend
            await dispatch('applySettings')

            // Mark as completed
            commit('MARK_COMPLETED')
            commit('CLEAR_SAVED_STATE')
            commit('CLOSE_WIZARD')
        },

        async applySettings({ state, rootState }) {
            const socket = (Vue.prototype as any).$socket

            // Apply device aliases
            for (const device of state.devices) {
                if (device.alias && device.alias !== device.deviceId) {
                    const gcode = `ACE_ALIAS DEVICE=${device.deviceId} NAME=${device.alias}`
                    socket.emit('printer.gcode.script', { script: gcode })
                    await new Promise((resolve) => setTimeout(resolve, 100))
                }
            }

            // Apply gate configurations
            for (const gate of state.gates) {
                if (gate.configured) {
                    const gcode = `ACE_GATE_MAP GATE=${gate.index} COLOR=${gate.color} TYPE=${gate.material} TEMP=${gate.temp}`
                    socket.emit('printer.gcode.script', { script: gcode })
                    await new Promise((resolve) => setTimeout(resolve, 50))
                }
            }

            // Apply endless spool setting
            const endlessSpoolGcode = `ACE_ENDLESS_SPOOL ENABLE=${state.endlessSpool ? 1 : 0}`
            socket.emit('printer.gcode.script', { script: endlessSpoolGcode })
        },

        resetWizard({ commit }) {
            commit('RESET_WIZARD')
            commit('CLEAR_SAVED_STATE')
        },

        async importConfiguration({ commit, state }, config: any) {
            // Validate configuration structure
            if (!config || typeof config !== 'object') {
                throw new Error('Invalid configuration file format')
            }

            // Check version (for future compatibility)
            if (config.version && config.version !== '1.0') {
                console.warn(`Configuration version mismatch: ${config.version} (expected 1.0)`)
            }

            // Track warnings for partial imports
            const warnings: string[] = []

            // Import device aliases
            if (config.devices && Array.isArray(config.devices)) {
                for (const importedDevice of config.devices) {
                    const currentDevice = state.devices.find(
                        (d) => d.deviceId === importedDevice.deviceId || d.gateOffset === importedDevice.gateOffset
                    )

                    if (currentDevice) {
                        commit('UPDATE_DEVICE', {
                            deviceId: currentDevice.deviceId,
                            updates: {
                                alias: importedDevice.alias || '',
                            },
                        })
                    } else {
                        warnings.push(`Device ${importedDevice.deviceId || importedDevice.alias} not found`)
                    }
                }
            }

            // Import gate configurations
            if (config.gates && Array.isArray(config.gates)) {
                for (const importedGate of config.gates) {
                    const gateIndex = importedGate.index

                    if (gateIndex >= 0 && gateIndex < state.gates.length) {
                        commit('UPDATE_GATE', {
                            index: gateIndex,
                            updates: {
                                color: importedGate.color || 'FFFFFF',
                                material: importedGate.material || '',
                                temp: importedGate.temp || 50,
                                configured: !!(importedGate.material && importedGate.color),
                            },
                        })
                    } else {
                        warnings.push(`Gate ${gateIndex} index out of range`)
                    }
                }
            }

            // Import settings
            if (config.settings) {
                if (config.settings.endlessSpool !== undefined) {
                    commit('SET_ENDLESS_SPOOL', config.settings.endlessSpool)
                }
            }

            // Save imported state
            commit('SAVE_STATE')

            return {
                success: true,
                warnings,
            }
        },
    },
}

export default setup
