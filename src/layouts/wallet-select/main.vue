<template>
  <q-layout view="hHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <template v-if="show_menu">
          <MainMenu :disable-switch-wallet="true" />
        </template>
        <template v-else>
          <q-btn class="cancel" icon="reply" flat round dense @click="cancel()" />
        </template>
        <q-toolbar-title v-if="page_title == 'Equilibria'" class="flex items-center justify-center">
          <img src="xeq_logo_with_padding.png" height="60" />
        </q-toolbar-title>
        <q-toolbar-title v-else class="flex items-center justify-center">{{ page_title }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view ref="page"/>
    </q-page-container>

    <StatusFooter/>

  </q-layout>
</template>

<script>
import { mapState } from "vuex"

import SettingsModal from "components/settings"
import StatusFooter from "components/footer"
import MainMenu from "components/mainmenu"

export default {
    components: {
        StatusFooter,
        MainMenu,
        SettingsModal
    },
    data () {
        return {}
    },
    computed: {
        show_menu () {
            return this.$route.name === "wallet-select"
        },
        page_title () {
            switch (this.$route.name) {
            case "wallet-create":
                return "Create new account"
            case "wallet-restore":
                return "Restore account from seed"
            case "wallet-import":
                return "Import account from file"
            case "wallet-import-view-only":
                return "Restore view-only account"
            case "wallet-import-legacy":
                return "Import account from legacy gui"
            case "wallet-import-old-gui":
                return "Import accounts from old GUI"
            case "wallet-created":
                return "Account created/restored"

            default:
            case "wallet-select":
                return "equilibria"
            }
        }
    },
    methods: {
        cancel () {
            this.$router.replace({ path: "/wallet-select" })
            this.$gateway.send("wallet", "close_wallet")
            setTimeout(() => {
                // short delay to prevent wallet data reaching the
                // websocket moments after we close and reset data
                this.$store.dispatch("gateway/resetWalletData")
            }, 250)
        }
    },
}
</script>

<style>
</style>
