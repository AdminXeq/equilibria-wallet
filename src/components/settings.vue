<template>
  <q-dialog v-model="isVisible" maximized class="settings-modal">
    <q-layout>
      <q-header>
        <q-toolbar color="dark" inverted>
          <q-btn flat round dense icon="reply" @click="isVisible = false" />
          <q-toolbar-title shrink>Settings</q-toolbar-title>

          <div class="row col justify-center q-pr-xl">
            <q-btn-toggle v-model="page" toggle-color="primary" color="tertiary" size="md" :options="tabs" />
          </div>

          <q-btn color="primary" :label="Save" @click="save" />
        </q-toolbar>
      </q-header>
      <q-page-container>
        <div v-if="page=='general'">
          <div class="q-pa-lg">
            <SettingsGeneral ref="settingsGeneral"></SettingsGeneral>
          </div>
        </div>

        <div v-if="page=='peers'">
          <q-list :dark="theme=='dark'" no-border>
            <q-list-header>Peer list</q-list-header>

            <q-item v-for="entry in daemon.connections" :key="entry.address" link @click.native="showPeerDetails(entry)">
              <q-item-label>
                <q-item-label header>{{ entry.address }}</q-item-label>
                <q-item-label caption>Height: {{ entry.height }}</q-item-label>
              </q-item-label>
            </q-item>

            <template v-if="daemon.bans.length">
              <q-list-header>Banned peers (bans will cleared if wallet is restarted)</q-list-header>
              <q-item v-for="entry in daemon.bans" :key="entry.host">
                <q-item-label>
                  <q-item-label header>{{ entry.host }}</q-item-label>
                  <q-item-label caption>Banned until {{ new Date(Date.now() + entry.seconds * 1000).toLocaleString() }}</q-item-label>
                </q-item-label>
              </q-item>
            </template>
          </q-list>
        </div>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script>
import { mapState } from "vuex"
import SettingsGeneral from "components/settings_general"
export default {
    name: "SettingsModal",
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        daemon: state => state.gateway.daemon,
        pending_config: state => state.gateway.app.pending_config,
        config: state => state.gateway.app.config,
        tabs: function (state) {
            const { app, daemons } = state.gateway.app.config
            let tabs = [
                { label: "General", value: "general", icon: "settings" }
            ]
            if (daemons[app.net_type].type !== "remote") {
                tabs.push({ label: "Peers", value: "peers", icon: "cloud_queue" })
            }
            return tabs
        }
    }),
    data () {
        return {
            page: "general",
            isVisible: false
        }
    },
    watch: {
        isVisible: function () {
            if (this.isVisible === false) {
                this.$store.dispatch("gateway/resetPendingConfig")
            }
        }
    },
    methods: {
        save () {
            this.$gateway.send("core", "save_config", this.pending_config)
            this.isVisible = false
        },
        showPeerDetails (entry) {
            this.$q.dialog({
                title: "Peer details",
                message: JSON.stringify(entry, null, 2),
                ok: {
                    label: "Ban peer",
                    color: "negative"
                },
                cancel: {
                    flat: true,
                    label: "Close",
                    color: "red"
                }
            }).onOk(() => {
                this.$q.dialog({
                    title: "Ban peer",
                    message: "Enter length to ban peer in seconds.\nDefault 3600 = 1 hour.",
                    prompt: {
                        model: "",
                        type: "number"
                    },
                    ok: {
                        label: "Ban peer",
                        color: "negative"
                    },
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: "red"
                    }
                }).onOk(seconds => {
                    this.$gateway.send("daemon", "ban_peer", { host: entry.host, seconds })
                })
                .onCancel(() => {})
                .onDismiss(() => null);
            })
            .onCancel(() => {})
            .onDismiss(() => {});
        }
    },
    components: {
        SettingsGeneral
    }
}
</script>

<style lang="scss">
</style>
