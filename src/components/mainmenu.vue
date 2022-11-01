<template>
  <div>
    <q-btn class="menu" icon="menu" size="lg" flat>
      <q-menu>
        <q-list separator class="menu-list">
          <q-item v-if="!disableSwitchWallet" v-close-popup clickable @click.native="switchWallet">
            <q-item-label header>Switch Account</q-item-label>
          </q-item>
          <q-item v-close-popup clickable @click.native="openSettings">
            <q-item-label header>Daemon Settings</q-item-label>
          </q-item>
          <q-item v-close-popup clickable @click.native="showAbout(true)">
            <q-item-label header>About</q-item-label>
          </q-item>
          <q-item v-close-popup clickable @click.native="exit">
            <q-item-label header>Exit Equilibria Wallet</q-item-label>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <settings-modal ref="settingsModal" />
    <q-dialog ref="aboutModal" minimized>
        <div class="about-modal">
            <img class="q-mb-md" src="xeq_logo_with_padding.png" />

            <p class="q-my-sm">Version: v{{version}}-v{{daemonVersion}}</p>
            <p class="q-my-sm">Copyright (c) 2018-2022, Equilibria Project</p>
            <p class="q-my-sm">Copyright (c) 2018-2019, Loki Project</p>
            <p class="q-my-sm">Copyright (c) 2018, Ryo Currency Project</p>
            <p class="q-my-sm">All rights reserved.</p>

            <div class="q-mt-md q-mb-lg external-links">
                <p>
                    <a @click="openExternal('https://equilibriacc.com/')" href="#">https://equilibriacc.com/</a>
                </p>
                <p>
                    <a @click="openExternal('https://discord.gg/Ps9pBmc2QX')" href="#">Discord</a> -
                    <a @click="openExternal('https://t.me/EquilibriaCommunity')" href="#">Telegram</a> -
                    <a @click="openExternal('https://github.com/EquilibriaCC/Equilibria')" href="#">Github</a>
                </p>
            </div>

            <q-btn
                color="positive"
                @click="showAbout(false)"
                label="Close"
                />
        </div>
    </q-dialog>
</div>
</template>

<script>
import { version, daemonVersion } from "../../package.json"
import { mapState } from "vuex"
import SettingsModal from "components/settings"
export default {
    name: "MainMenu",
    props: {
        disableSwitchWallet: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    data () {
        return {
            version: "",
            daemonVersion: ""
        }
    },
    mounted () {
        this.version = version
        this.daemonVersion = daemonVersion
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        isRPCSyncing: state => state.gateway.wallet.isRPCSyncing

    }),
    methods: {
        openExternal (url) {
            this.$gateway.send("core", "open_url", { url })
        },
        showAbout (toggle) {
            if (toggle) { this.$refs.aboutModal.show() } else { this.$refs.aboutModal.hide() }
        },
        openSettings () {
            this.$refs.settingsModal.isVisible = true
        },
        switchWallet () {
            if (this.isRPCSyncing) {
                this.$gateway.confirmClose("The wallet RPC is currently syncing. If you wish to switch wallets then you must restart the application. You will lose your syncing progress and have to rescan the blockchain again.", true)
                return
            }
            this.$q.dialog({
                title: "Switch account",
                message: "Are you sure you want to close the current wallet?",
                ok: {
                    label: "OK",
                    color: "positive"

                },
                cancel: {
                    flat: true,
                    label: "CANCEL",
                    color: "red"
                }
            }).then(() => {
                this.$router.replace({ path: "/wallet-select" })
                this.$gateway.send("wallet", "close_wallet")
                setTimeout(() => {
                    // short delay to prevent wallet data reaching the
                    // websocket moments after we close and reset data
                    this.$store.dispatch("gateway/resetWalletData")
                }, 250)
            }).catch(() => {
            })
        },
        exit () {
            this.$gateway.confirmClose("Are you sure you want to exit?")
        }
    },
    components: {
        SettingsModal
    }
}
</script>

<style lang="scss">
.about-modal {
    padding: 25px;
    background-color: $dark;
    color: navy;

    .external-links {

        a {

            color: #497dc6;
            text-decoration: none;

            &:hover,
            &:active,
            &:visited {
                text-decoration: underline;
            }

        }

    }

}

</style>
