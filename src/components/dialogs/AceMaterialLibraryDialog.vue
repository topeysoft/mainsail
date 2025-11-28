<template>
    <v-dialog v-model="showDialog" max-width="800" scrollable @click:outside="closeDialog" @keydown.esc="closeDialog">
        <v-card>
            <v-toolbar flat dense>
                <v-toolbar-title>
                    <v-icon left>{{ mdiBookshelf }}</v-icon>
                    {{ $t('Panels.AcePanel.MaterialLibrary') }}
                </v-toolbar-title>
                <v-spacer />
                <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                        <v-btn icon v-bind="attrs" v-on="on" @click="showCreateDialog = true">
                            <v-icon>{{ mdiPlus }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('Panels.AcePanel.CreateMaterial') }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                        <v-btn icon v-bind="attrs" v-on="on" @click="exportProfiles">
                            <v-icon>{{ mdiExport }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('Panels.AcePanel.ExportMaterials') }}</span>
                </v-tooltip>
                <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                        <v-btn icon v-bind="attrs" v-on="on" @click="$refs.fileInput.click()">
                            <v-icon>{{ mdiImport }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('Panels.AcePanel.ImportMaterials') }}</span>
                </v-tooltip>
                <v-btn icon @click="closeDialog">
                    <v-icon>{{ mdiClose }}</v-icon>
                </v-btn>
            </v-toolbar>

            <v-tabs v-model="activeTab" class="mb-3">
                <v-tab>{{ $t('Panels.AcePanel.DefaultMaterials') }}</v-tab>
                <v-tab>
                    {{ $t('Panels.AcePanel.CustomMaterials') }}
                    <v-chip x-small class="ml-2">{{ customProfiles.length }}</v-chip>
                </v-tab>
            </v-tabs>

            <v-card-text style="max-height: 500px">
                <v-tabs-items v-model="activeTab">
                    <!-- Default Materials Tab -->
                    <v-tab-item>
                        <v-list>
                            <v-list-item
                                v-for="profile in defaultProfiles"
                                :key="profile.id"
                                @click="selectProfile(profile)">
                                <v-list-item-avatar>
                                    <v-icon color="primary">{{ mdiCubeOutline }}</v-icon>
                                </v-list-item-avatar>
                                <v-list-item-content>
                                    <v-list-item-title class="font-weight-bold">
                                        {{ profile.name }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ profile.description }}
                                    </v-list-item-subtitle>
                                    <div class="mt-2 d-flex flex-wrap gap-2">
                                        <v-chip x-small>
                                            <v-icon x-small left>{{ mdiThermometer }}</v-icon>
                                            {{ profile.defaultTemp }}°C
                                        </v-chip>
                                        <v-chip x-small>
                                            <v-icon x-small left>{{ mdiHairDryer }}</v-icon>
                                            {{ profile.dryerTemp }}°C / {{ profile.dryerDuration }}min
                                        </v-chip>
                                    </div>
                                </v-list-item-content>
                                <v-list-item-action>
                                    <v-btn small text color="primary" @click.stop="applyProfile(profile)">
                                        {{ $t('Panels.AcePanel.Apply') }}
                                    </v-btn>
                                </v-list-item-action>
                            </v-list-item>
                        </v-list>
                    </v-tab-item>

                    <!-- Custom Materials Tab -->
                    <v-tab-item>
                        <v-list v-if="customProfiles.length > 0">
                            <v-list-item
                                v-for="profile in customProfiles"
                                :key="profile.id"
                                @click="selectProfile(profile)">
                                <v-list-item-avatar>
                                    <v-icon color="secondary">{{ mdiCube }}</v-icon>
                                </v-list-item-avatar>
                                <v-list-item-content>
                                    <v-list-item-title class="font-weight-bold">
                                        {{ profile.name }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle>
                                        {{ profile.description || $t('Panels.AcePanel.CustomMaterialProfile') }}
                                    </v-list-item-subtitle>
                                    <div class="mt-2 d-flex flex-wrap gap-2">
                                        <v-chip x-small>
                                            <v-icon x-small left>{{ mdiThermometer }}</v-icon>
                                            {{ profile.defaultTemp }}°C
                                        </v-chip>
                                        <v-chip x-small>
                                            <v-icon x-small left>{{ mdiHairDryer }}</v-icon>
                                            {{ profile.dryerTemp }}°C / {{ profile.dryerDuration }}min
                                        </v-chip>
                                    </div>
                                </v-list-item-content>
                                <v-list-item-action class="flex-row gap-1">
                                    <v-btn icon small @click.stop="editProfile(profile)">
                                        <v-icon small>{{ mdiPencil }}</v-icon>
                                    </v-btn>
                                    <v-btn icon small @click.stop="deleteProfile(profile.id)">
                                        <v-icon small color="error">{{ mdiDelete }}</v-icon>
                                    </v-btn>
                                    <v-btn small text color="primary" @click.stop="applyProfile(profile)">
                                        {{ $t('Panels.AcePanel.Apply') }}
                                    </v-btn>
                                </v-list-item-action>
                            </v-list-item>
                        </v-list>
                        <div v-else class="text-center py-8">
                            <v-icon size="64" color="grey lighten-1">{{ mdiInboxArrowDown }}</v-icon>
                            <div class="text-h6 mt-4 grey--text">{{ $t('Panels.AcePanel.NoCustomMaterials') }}</div>
                            <div class="text-caption grey--text">{{ $t('Panels.AcePanel.CreateYourFirst') }}</div>
                            <v-btn color="primary" class="mt-4" @click="showCreateDialog = true">
                                <v-icon left>{{ mdiPlus }}</v-icon>
                                {{ $t('Panels.AcePanel.CreateMaterial') }}
                            </v-btn>
                        </div>
                    </v-tab-item>
                </v-tabs-items>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn text @click="closeDialog">
                    {{ $t('Panels.AcePanel.Close') }}
                </v-btn>
            </v-card-actions>
        </v-card>

        <!-- Hidden file input for importing -->
        <input
            ref="fileInput"
            type="file"
            accept="application/json"
            style="display: none"
            @change="importProfiles" />

        <!-- Create/Edit Material Dialog -->
        <ace-material-edit-dialog
            v-if="showCreateDialog || editingProfile"
            :show="showCreateDialog || !!editingProfile"
            :profile="editingProfile"
            @save="onSaveProfile"
            @close="closeEditDialog" />
    </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import {
    mdiClose,
    mdiBookshelf,
    mdiPlus,
    mdiExport,
    mdiImport,
    mdiCubeOutline,
    mdiCube,
    mdiThermometer,
    mdiHairDryer,
    mdiPencil,
    mdiDelete,
    mdiInboxArrowDown,
} from '@mdi/js'
import { MaterialProfile } from '@/store/ace/materialLibrary'

@Component({
    components: {
        AceMaterialEditDialog: () => import('./AceMaterialEditDialog.vue'),
    },
})
export default class AceMaterialLibraryDialog extends Mixins(BaseMixin) {
    mdiClose = mdiClose
    mdiBookshelf = mdiBookshelf
    mdiPlus = mdiPlus
    mdiExport = mdiExport
    mdiImport = mdiImport
    mdiCubeOutline = mdiCubeOutline
    mdiCube = mdiCube
    mdiThermometer = mdiThermometer
    mdiHairDryer = mdiHairDryer
    mdiPencil = mdiPencil
    mdiDelete = mdiDelete
    mdiInboxArrowDown = mdiInboxArrowDown

    @Prop({ type: Boolean, required: true }) readonly show!: boolean

    activeTab = 0
    showCreateDialog = false
    editingProfile: MaterialProfile | null = null

    get showDialog() {
        return this.show
    }

    set showDialog(value: boolean) {
        if (!value) this.$emit('close')
    }

    get defaultProfiles(): MaterialProfile[] {
        return this.$store.getters['ace/materialLibrary/getDefaultProfiles'] ?? []
    }

    get customProfiles(): MaterialProfile[] {
        return this.$store.getters['ace/materialLibrary/getCustomProfiles'] ?? []
    }

    mounted() {
        // Load profiles from localStorage on mount
        this.$store.dispatch('ace/materialLibrary/loadProfiles')
    }

    selectProfile(profile: MaterialProfile) {
        this.$store.commit('ace/materialLibrary/setSelectedProfile', profile.id)
    }

    applyProfile(profile: MaterialProfile) {
        this.$emit('apply', profile)
        this.closeDialog()
    }

    editProfile(profile: MaterialProfile) {
        this.editingProfile = { ...profile }
    }

    async deleteProfile(profileId: string) {
        const confirmed = await this.$confirm(
            this.$t('Panels.AcePanel.ConfirmDeleteMaterial').toString(),
            this.$t('Panels.AcePanel.DeleteMaterial').toString()
        )
        if (confirmed) {
            await this.$store.dispatch('ace/materialLibrary/deleteProfile', profileId)
        }
    }

    async onSaveProfile(profile: MaterialProfile) {
        if (profile.isCustom && this.editingProfile) {
            // Updating existing custom profile
            await this.$store.dispatch('ace/materialLibrary/updateProfile', {
                id: profile.id,
                updates: profile,
            })
        } else {
            // Creating new custom profile
            await this.$store.dispatch('ace/materialLibrary/createProfile', profile)
        }
        this.closeEditDialog()
    }

    closeEditDialog() {
        this.showCreateDialog = false
        this.editingProfile = null
    }

    async exportProfiles() {
        await this.$store.dispatch('ace/materialLibrary/exportProfiles')
    }

    async importProfiles(event: Event) {
        const input = event.target as HTMLInputElement
        if (!input.files || input.files.length === 0) return

        const file = input.files[0]
        try {
            const text = await file.text()
            const profiles: MaterialProfile[] = JSON.parse(text)

            // Validate profiles
            if (!Array.isArray(profiles)) {
                throw new Error('Invalid file format')
            }

            await this.$store.dispatch('ace/materialLibrary/importProfiles', profiles)

            // Show success message
            this.$toast.success(
                this.$t('Panels.AcePanel.ImportSuccess', { count: profiles.length }).toString()
            )
        } catch (error) {
            this.$toast.error(this.$t('Panels.AcePanel.ImportFailed').toString())
            console.error('Failed to import profiles:', error)
        }

        // Reset file input
        input.value = ''
    }

    closeDialog() {
        this.$emit('close')
    }
}
</script>

<style scoped>
.gap-1 {
    gap: 4px;
}

.gap-2 {
    gap: 8px;
}
</style>
