import { Module } from 'vuex'
import { RootState } from '@/store/types'
import { materialLibrary } from './materialLibrary'
import setup from './setup'

export interface AceState {}

export const ace: Module<AceState, RootState> = {
    namespaced: true,
    state: {},
    modules: {
        materialLibrary,
        setup,
    },
}
