<template>
<q-page>
    <div class="q-mx-md import-old-gui">
        <q-list link dark no-border class="wallet-list">
            <q-item v-for="state in directory_state" :key="state.directory" :class="{selected : state.selected}">
                <q-item-side>
                    <q-checkbox v-model="state.selected" />
                </q-item-side>
                <q-item-main @click.native="state.selected = !state.selected">
                    <q-item-tile label>{{ state.directory }}</q-item-tile>
                </q-item-main>
                <q-item-side>
                    <q-select hide-underline dark class="q-ma-none full-width" v-model="state.type" :options="selectOptions" />
                </q-item-side>
            </q-item>
        </q-list>

         <q-field>
            <q-btn color="primary" @click="import_wallets" label="Import Accounts" :disable="selectedWallets.length === 0"/>
        </q-field>
    </div>
</q-page>
</template>

<script>
import { mapState } from "vuex"

export default {
    data () {
        return {
            directory_state: []
        }
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        directories: state => state.gateway.wallets.directories,
        old_gui_import_status: state => state.gateway.old_gui_import_status,
        selectOptions: state => [
            {
                label: "Main",
                value: "mainnet"
            },
            {
                label: "Staging",
                value: "stagenet"
            },
            {
                label: "Test",
                value: "testnet"
            }
        ],
        selectedWallets () {
            return this.directory_state.filter(s => s.selected)
        }
    }),
    watch: {
        directories: {
            handler (val, old) {
                this.populate_state()
            },
            deep: true
        },
        old_gui_import_status: {
            handler (val, old) {
                if (val.code === old.code) return

                const { code, failed_wallets } = this.old_gui_import_status

                // Imported
                if (code === 0) {
                    this.$q.loading.hide()
                    if (failed_wallets.length === 0) {
                        this.$router.replace({ path: "/wallet-select" })
                    } else {
                        failed_wallets.forEach(wallet => {
                            this.$q.notify({
                                type: "negative",
                                timeout: 3000,
                                message: `Failed to import account: ${wallet}`
                            })
                        })
                    }
                }
            },
            deep: true
        }
    },
    created () {
        this.$gateway.send("wallet", "list_wallets")
        this.populate_state()
    },
    methods: {
        populate_state () {
            // Keep any directories that intersect
            const new_state = this.directory_state.filter(state => this.directories.includes(state.directory))

            // Add in new directories
            this.directories
                .filter(dir => !new_state.find(state => state.directory === dir))
                .forEach(directory => {
                    new_state.push({
                        directory,
                        selected: false,
                        type: "mainnet"
                    })
                })

            // Sort them
            this.directory_state = new_state.sort(function (a, b) {
                return a.directory.localeCompare(b.directory)
            })
        },
        import_wallets () {
            this.$q.loading.show({
                delay: 0
            })
            this.$gateway.send("wallet", "copy_old_gui_wallets", {
                wallets: this.selectedWallets
            })
        },
        cancel () {
            this.$router.replace({ path: "/wallet-select" })
        }
    }
}
</script>

<style lang="scss">
.import-old-gui {
    .wallet-list {
        .q-item {
            margin: 10px 0px;
            margin-bottom: 0px;
            padding: 14px;
            border-radius: 3px;
        }
    }
}
</style>
