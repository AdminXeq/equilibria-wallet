<template>
<q-page>
    <q-list class="wallet-list" link no-border :dark="theme=='dark'">
        <template v-if="wallets.list.length">
            <div class="header row justify-between items-center">
                <div style="margin-left: 71px; font-size: 20px" class="header-title">Accounts</div>
                <q-btn class="primary" icon="add" size="md" color="transparent" v-if="wallets.list.length">
                    <q-popover class="header-popover">
                        <q-list separator link>
                            <q-item v-for="action in actions" @click.native="action.handler" :key="action.name">
                                <q-item-main :label="action.name" />
                            </q-item>
                        </q-list>
                    </q-popover>

                </q-btn>
            </div>
            <div class="hr-separator" />
            <q-item v-for="wallet in wallets.list" @click.native="openWallet(wallet)" :key="`${wallet.address}-${wallet.name}`">
                <q-item-side>
                    <div class="wallet-icon">
                        <svg width="48" viewBox="0 0 17 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-wallet"><defs class="si-glyph-fill"></defs><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(1.000000, 0.000000)" fill="#434343"><path d="M7.988,10.635 L7.988,8.327 C7.988,7.578 8.561,6.969 9.267,6.969 L13.964,6.969 L13.964,5.531 C13.964,4.849 13.56,4.279 13.007,4.093 L13.007,4.094 L11.356,4.08 L11.336,4.022 L3.925,4.022 L3.784,4.07 L1.17,4.068 L1.165,4.047 C0.529,4.167 0.017,4.743 0.017,5.484 L0.017,13.437 C0.017,14.269 0.665,14.992 1.408,14.992 L12.622,14.992 C13.365,14.992 13.965,14.316 13.965,13.484 L13.965,12.031 L9.268,12.031 C8.562,12.031 7.988,11.384 7.988,10.635 L7.988,10.635 Z" class="si-glyph-fill"></path><path d="M14.996,8.061 L14.947,8.061 L9.989,8.061 C9.46,8.061 9.031,8.529 9.031,9.106 L9.031,9.922 C9.031,10.498 9.46,10.966 9.989,10.966 L14.947,10.966 L14.996,10.966 C15.525,10.966 15.955,10.498 15.955,9.922 L15.955,9.106 C15.955,8.528 15.525,8.061 14.996,8.061 L14.996,8.061 Z M12.031,10.016 L9.969,10.016 L9.969,9 L12.031,9 L12.031,10.016 L12.031,10.016 Z" class="si-glyph-fill"></path><path d="M3.926,4.022 L10.557,1.753 L11.337,4.022 L12.622,4.022 C12.757,4.022 12.885,4.051 13.008,4.092 L11.619,0.051 L1.049,3.572 L1.166,4.048 C1.245,4.033 1.326,4.023 1.408,4.023 L3.926,4.023 L3.926,4.022 Z" class="si-glyph-fill"></path></g></g></svg>
                    </div>
                </q-item-side>
                <q-item-main>
                    <q-item-tile label>{{ wallet.name }}</q-item-tile>
                    <q-item-tile class="monospace ellipsis" sublabel>{{ wallet.address }}</q-item-tile>
                </q-item-main>

                <q-context-menu>
                    <q-list link separator style="min-width: 150px; max-height: 300px;">
                        <q-item v-close-overlay
                                @click.native="openWallet(wallet)">
                            <q-item-main label="Open Account" />
                        </q-item>

                        <q-item v-close-overlay
                                @click.native="copyAddress(wallet.address, $event)">
                            <q-item-main label="Copy Address" />
                        </q-item>
                    </q-list>
                </q-context-menu>

            </q-item>
            <q-item-separator />
        </template>
        <template v-else>
            <q-item v-for="action in actions" @click.native="action.handler" :key="action.name">
                <q-item-main :label="action.name" />
            </q-item>
        </template>
    </q-list>

</q-page>
</template>

<script>
const { clipboard } = require("electron")
import { mapState } from "vuex"
// import Identicon from "components/identicon"

export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        wallets: state => state.gateway.wallets,
        status: state => state.gateway.wallet.status,
        actions (status) {
            // TODO: Add this in once triton has the functionality
            // <q-item @click.native="restoreViewWallet()">
            //     <q-item-main label="Restore view-only wallet" />
            // </q-item>
            const actions = [
                {
                    name: "Create new account",
                    handler: this.createNewWallet
                },
                {
                    name: "Restore account from seed",
                    handler: this.restoreWallet
                },
                {
                    name: "Import account from file",
                    handler: this.importWallet
                }
            ]

            if (this.wallets.directories.length > 0) {
                actions.push({
                    name: "Import accounts from old GUI",
                    handler: this.importOldGuiWallets
                })
            }

            return actions
        }
    }),
    created () {
        this.$gateway.send("wallet", "list_wallets")
    },
    methods: {
        async openWallet (wallet) {
            // this.$gateway.send("wallet", "open_wallet", {name: wallet.name, password: ""});
            // const checkRoute = async () => {
            //     while (this.$router.history.current.name == "wallet-select") {
            //         await new Promise(r => setTimeout(r, 10));
            //     }
            // }
            // checkRoute()
            if (wallet.password_protected !== false) {
                this.$q.dialog({
                    title: "Password",
                    message: "Enter account password to continue.",
                    prompt: {
                        model: "",
                        type: "password"
                    },
                    ok: {
                        label: "OPEN",
                        color: "positive"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: "red"
                    }
                }).then(password => {
                    this.$q.loading.show({
                        delay: 0
                    })
                    this.$gateway.send("wallet", "open_wallet", { name: wallet.name, password: password })
                })
                    .catch(() => {
                    })
            } else {
                this.$q.loading.show({
                    delay: 0
                })
                this.$gateway.send("wallet", "open_wallet", { name: wallet.name, password: "" })
            }
        },
        createNewWallet () {
            this.$router.replace({ path: "wallet-select/create" })
        },
        restoreWallet () {
            this.$router.replace({ path: "wallet-select/restore" })
        },
        restoreViewWallet () {
            this.$router.replace({ path: "wallet-select/import-view-only" })
        },
        importWallet () {
            this.$router.replace({ path: "wallet-select/import" })
        },
        importOldGuiWallets () {
            this.$router.replace({ path: "wallet-select/import-old-gui" })
        },
        importLegacyWallet () {
            this.$router.replace({ path: "wallet-select/import-legacy" })
        },
        copyAddress (address, event) {
            event.stopPropagation()
            for (let i = 0; i < event.path.length; i++) {
                if (event.path[i].tagName === "BUTTON") {
                    event.path[i].blur()
                    break
                }
            }
            clipboard.writeText(address)
            this.$q.notify({
                type: "positive",
                timeout: 1000,
                message: "Address copied to clipboard"
            })
        }
    },
    watch: {
        status: {
            handler (val, old) {
                if (val.code === old.code) return
                switch (this.status.code) {
                case 0: // Wallet loaded
                    this.$q.loading.hide()
                    this.$router.replace({ path: "/wallet" })
                    break
                case -1: // Error
                case -22:
                    this.$q.loading.hide()
                    this.$q.notify({
                        type: "negative",
                        timeout: 1000,
                        message: this.status.message
                    })
                    this.$store.commit("gateway/set_wallet_data", {
                        status: {
                            code: 1 // Reset to 1 (ready for action)
                        }
                    })
                    break
                }
            },
            deep: true
        }
    },
    components: {
        // Identicon
    }
}
</script>

<style lang="scss">
.header-popover.q-popover {
    max-width: 250px !important;
}

.wallet-list {
    .header {
        margin: 0 16px;
        margin-bottom: 8px;
        min-height: 36px;

        .header-title {
            font-size: 14px;
            font-weight: 500;
        }

        .add {
            width: 38px;
            padding: 0;
        }
    }
    .q-item {
        margin: 10px 16px;
        margin-bottom: 0px;
        padding: 14px;
        border-radius: 3px;
    }
}
</style>
