import { Module } from 'vuex'
import { RootState } from '@/store/types'

export interface MaterialProfile {
    id: string
    name: string
    defaultTemp: number
    dryerTemp: number
    dryerDuration: number // minutes
    retractSpeed: number
    feedSpeed: number
    colorSuggestions: string[] // hex colors
    isCustom: boolean
    description?: string
}

export interface MaterialLibraryState {
    profiles: MaterialProfile[]
    selectedProfileId: string | null
}

// Default material profiles
const DEFAULT_PROFILES: MaterialProfile[] = [
    {
        id: 'pla',
        name: 'PLA',
        defaultTemp: 200,
        dryerTemp: 45,
        dryerDuration: 120,
        retractSpeed: 50,
        feedSpeed: 50,
        colorSuggestions: ['FFFFFF', '000000', 'FF0000', '00FF00', '0000FF', 'FFFF00'],
        isCustom: false,
        description: 'Standard PLA filament - low temperature, easy to print',
    },
    {
        id: 'petg',
        name: 'PETG',
        defaultTemp: 230,
        dryerTemp: 55,
        dryerDuration: 240,
        retractSpeed: 45,
        feedSpeed: 45,
        colorSuggestions: ['FFFFFF', '000000', '00FFFF', 'FF8C00'],
        isCustom: false,
        description: 'Strong and flexible, good layer adhesion',
    },
    {
        id: 'abs',
        name: 'ABS',
        defaultTemp: 240,
        dryerTemp: 60,
        dryerDuration: 240,
        retractSpeed: 50,
        feedSpeed: 50,
        colorSuggestions: ['000000', 'FFFFFF', 'FF0000', '808080'],
        isCustom: false,
        description: 'Strong and heat-resistant, requires heated enclosure',
    },
    {
        id: 'asa',
        name: 'ASA',
        defaultTemp: 245,
        dryerTemp: 60,
        dryerDuration: 240,
        retractSpeed: 50,
        feedSpeed: 50,
        colorSuggestions: ['000000', 'FFFFFF', 'FF0000', '808080'],
        isCustom: false,
        description: 'UV-resistant alternative to ABS, better outdoor durability',
    },
    {
        id: 'tpu',
        name: 'TPU',
        defaultTemp: 220,
        dryerTemp: 50,
        dryerDuration: 180,
        retractSpeed: 25,
        feedSpeed: 25,
        colorSuggestions: ['000000', 'FFFFFF', 'FF69B4', '00FFFF'],
        isCustom: false,
        description: 'Flexible and elastic, requires slow speeds',
    },
    {
        id: 'nylon',
        name: 'Nylon',
        defaultTemp: 250,
        dryerTemp: 65,
        dryerDuration: 360,
        retractSpeed: 45,
        feedSpeed: 45,
        colorSuggestions: ['FFFFFF', '000000', 'E8E8E8'],
        isCustom: false,
        description: 'Very strong and durable, hygroscopic (needs drying)',
    },
    {
        id: 'pc',
        name: 'Polycarbonate',
        defaultTemp: 270,
        dryerTemp: 70,
        dryerDuration: 360,
        retractSpeed: 40,
        feedSpeed: 40,
        colorSuggestions: ['E8E8E8', '000000'],
        isCustom: false,
        description: 'Industrial strength, very high temperature resistant',
    },
    {
        id: 'pva',
        name: 'PVA',
        defaultTemp: 200,
        dryerTemp: 45,
        dryerDuration: 120,
        retractSpeed: 50,
        feedSpeed: 50,
        colorSuggestions: ['FFFFFF', 'E8E8E8'],
        isCustom: false,
        description: 'Water-soluble support material for PLA',
    },
    {
        id: 'hips',
        name: 'HIPS',
        defaultTemp: 230,
        dryerTemp: 55,
        dryerDuration: 180,
        retractSpeed: 50,
        feedSpeed: 50,
        colorSuggestions: ['FFFFFF', '000000'],
        isCustom: false,
        description: 'Limonene-soluble support material for ABS',
    },
    {
        id: 'wood',
        name: 'Wood PLA',
        defaultTemp: 200,
        dryerTemp: 45,
        dryerDuration: 120,
        retractSpeed: 50,
        feedSpeed: 50,
        colorSuggestions: ['8B4513', 'D2691E', 'CD853F'],
        isCustom: false,
        description: 'PLA with wood fiber, realistic wood appearance',
    },
    {
        id: 'carbon',
        name: 'Carbon Fiber',
        defaultTemp: 240,
        dryerTemp: 55,
        dryerDuration: 240,
        retractSpeed: 45,
        feedSpeed: 45,
        colorSuggestions: ['000000', '1C1C1C', '2F2F2F'],
        isCustom: false,
        description: 'Reinforced with carbon fiber, very strong and stiff',
    },
    {
        id: 'silk',
        name: 'Silk PLA',
        defaultTemp: 210,
        dryerTemp: 45,
        dryerDuration: 120,
        retractSpeed: 50,
        feedSpeed: 50,
        colorSuggestions: ['FFD700', 'C0C0C0', 'FF69B4', '00CED1'],
        isCustom: false,
        description: 'Glossy finish PLA with metallic appearance',
    },
]

export const materialLibrary: Module<MaterialLibraryState, RootState> = {
    namespaced: true,
    state: () => ({
        profiles: [...DEFAULT_PROFILES],
        selectedProfileId: null,
    }),
    getters: {
        getAllProfiles: (state) => state.profiles,
        getDefaultProfiles: (state) => state.profiles.filter((p) => !p.isCustom),
        getCustomProfiles: (state) => state.profiles.filter((p) => p.isCustom),
        getProfileById: (state) => (id: string) => state.profiles.find((p) => p.id === id),
        getProfileByName: (state) => (name: string) =>
            state.profiles.find((p) => p.name.toLowerCase() === name.toLowerCase()),
        getSelectedProfile: (state) => {
            if (!state.selectedProfileId) return null
            return state.profiles.find((p) => p.id === state.selectedProfileId) ?? null
        },
    },
    mutations: {
        setProfiles(state, profiles: MaterialProfile[]) {
            state.profiles = profiles
        },
        addProfile(state, profile: MaterialProfile) {
            // Check if profile already exists
            const existingIndex = state.profiles.findIndex((p) => p.id === profile.id)
            if (existingIndex >= 0) {
                // Update existing profile
                state.profiles.splice(existingIndex, 1, profile)
            } else {
                // Add new profile
                state.profiles.push(profile)
            }
        },
        removeProfile(state, profileId: string) {
            const index = state.profiles.findIndex((p) => p.id === profileId)
            if (index >= 0) {
                state.profiles.splice(index, 1)
            }
        },
        updateProfile(state, { id, updates }: { id: string; updates: Partial<MaterialProfile> }) {
            const index = state.profiles.findIndex((p) => p.id === id)
            if (index >= 0) {
                state.profiles[index] = { ...state.profiles[index], ...updates }
            }
        },
        setSelectedProfile(state, profileId: string | null) {
            state.selectedProfileId = profileId
        },
        resetToDefaults(state) {
            state.profiles = [...DEFAULT_PROFILES]
            state.selectedProfileId = null
        },
    },
    actions: {
        async loadProfiles({ commit }) {
            // Load custom profiles from localStorage
            try {
                const stored = localStorage.getItem('ace_material_profiles')
                if (stored) {
                    const customProfiles: MaterialProfile[] = JSON.parse(stored)
                    const allProfiles = [...DEFAULT_PROFILES, ...customProfiles]
                    commit('setProfiles', allProfiles)
                }
            } catch (error) {
                console.error('Failed to load material profiles:', error)
            }
        },
        async saveProfiles({ state }) {
            // Save only custom profiles to localStorage
            try {
                const customProfiles = state.profiles.filter((p) => p.isCustom)
                localStorage.setItem('ace_material_profiles', JSON.stringify(customProfiles))
            } catch (error) {
                console.error('Failed to save material profiles:', error)
            }
        },
        async createProfile({ commit, dispatch }, profile: Omit<MaterialProfile, 'id' | 'isCustom'>) {
            const newProfile: MaterialProfile = {
                ...profile,
                id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                isCustom: true,
            }
            commit('addProfile', newProfile)
            await dispatch('saveProfiles')
            return newProfile
        },
        async updateProfile({ commit, dispatch }, { id, updates }: { id: string; updates: Partial<MaterialProfile> }) {
            commit('updateProfile', { id, updates })
            await dispatch('saveProfiles')
        },
        async deleteProfile({ commit, dispatch }, profileId: string) {
            commit('removeProfile', profileId)
            await dispatch('saveProfiles')
        },
        async importProfiles({ commit, dispatch }, profiles: MaterialProfile[]) {
            profiles.forEach((profile) => {
                commit('addProfile', profile)
            })
            await dispatch('saveProfiles')
        },
        async exportProfiles({ state }) {
            // Export custom profiles as JSON
            const customProfiles = state.profiles.filter((p) => p.isCustom)
            const json = JSON.stringify(customProfiles, null, 2)
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `ace_material_profiles_${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
        },
    },
}

export default materialLibrary
