<template>
  <div v-if="service_nodes.length > 0" class="service-node-unlock">
     <div class="q-pa-md">
       <div class="q-pb-sm header">Currently staked nodes</div>
       <q-list class="service-node-list" no-border>
         <div>
           <q-item v-for="node in service_nodes" :key="node.service_node_pubkey">
             <q-item-section>
               <q-item-label class="ellipsis">{{ node.service_node_pubkey }}</q-item-label>
               <q-item-label class="non-selectable">Contribution: <FormatTriton :amount="node.ourContributionAmount" /></q-item-label>
             </q-item-section>
             <q-item-section side>
               <q-btn 
                 v-if="node.requested_unlock_height === 0"
                 color="primary" size="md" label="Unlock"
                 :disabled="!is_ready || unlock_status.sending"
                 side
                 @click="unlockWarning(node.service_node_pubkey)"
               />
               <q-item-label v-if="node.requested_unlock_height > 0" header>Unlocking at height {{ node.requested_unlock_height }}</q-item-label>
             </q-item-section>
             <q-menu context-menu>
               <q-list separator class="context-menu">
                 <q-item v-close-popup clickable @click.native="copyKey(node.service_node_pubkey, $event)">
                   <q-item-section>Copy service node key</q-item-section>
                 </q-item>
                 <q-item v-close-popup clickable @click.native="openExplorer(node.service_node_pubkey)">
                   <q-item-section>View on Explorer</q-item-section>
                 </q-item>
               </q-list>
             </q-menu>
           </q-item>
         </div>
       </q-list>
    </div>

    <q-inner-loading :showing="unlock_status.sending" :dark="theme=='dark'">
        <q-spinner color="primary" size="30" />
    </q-inner-loading>
  </div>
</template>

<script>
const objectAssignDeep = require("object-assign-deep")
import { mapState } from "vuex"
import { required } from "vuelidate/lib/validators"
import { service_node_key } from "src/validators/common"
import tritonField from "components/triton_field"
import WalletPassword from "src/mixins/wallet_password"
import FormatTriton from "components/format_triton"

export default {
    name: "ServiceNodeUnlock",
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        unlock_status: state => state.gateway.service_node_status.unlock,
        our_address: state => {
          const primary = state.gateway.wallet.address_list.primary[0]
          return (primary && primary.address) || null
        },
        is_ready(state) {
          return this.$store.getters["gateway/isReady"]
        },
        service_nodes(state) {
          const nodes = state.gateway.daemon.service_nodes
          const getContribution = node => node.contributors.find(c => c.address === this.our_address)
          // Only show nodes that we contributed to
          return nodes.filter(getContribution).map(n => {
            const ourContribution = getContribution(n)
            return {
              ...n,
              ourContributionAmount: ourContribution.amount
            }
          })
        }
    }),
    validations: {
        node_key: { required, service_node_key }
    },
    watch: {
        unlock_status: {
            handler (val, old) {
                if (val.code === old.code) return
                switch (this.unlock_status.code) {
                case 0:
                    this.key = null
                    this.password = null

                    this.$q.notify({
                        type: "positive",
                        timeout: 1000,
                        message: this.unlock_status.message
                    })
                    this.$v.$reset()
                    break
                case 1:
                    // Tell the user to confirm
                    this.$q.dialog({
                        title: "Confirm",
                        message: this.unlock_status.message,
                        ok: {
                            label: "UNLOCK",
                            color: "primary"
                        },
                        cancel: {
                            flat: true,
                            label: "CANCEL",
                            color: "red"
                        },
                        style: "min-width: 500px; overflow-wrap: break-word;",
                        dark: this.theme == "dark",
                        color: this.theme == "dark" ? "red" : "dark"
                    }).onOk(() => {
                        let password = this.password || "";
                        this.gatewayUnlock(password, this.key, true)
                    })
                    .onDismiss(() => null)
                    .onCancel(() => null);
                    break
                case -1:
                    this.key = null
                    this.password = null

                    this.$q.notify({
                        type: "negative",
                        timeout: 3000,
                        message: this.unlock_status.message
                    })
                    break
                }
            },
            deep: true
        }
    },
    methods: {
        unlockWarning (key) {
          this.$q.dialog({
            title: "Unlock service node warning",
            message: "Unlocking a partial stake in a node will also unstake for any other participants, if staking in a shared node its best to let the operator and other participants know you are unstaking.",
            ok: {
              label: "CONTINUE",
              color: "primary"
            },
            cancel: {
              flat: true,
              label: "CANCEL",
              color: this.theme === "dark" ? "red" : "dark"
            },
            dark: this.theme == "dark",
            color: this.theme == "dark" ? "red" : "dark"
          })
          .onOk(() => {
            this.unlock(key)
          })
          .onDismiss(() => {})
          .onCancel(() => {});
        },              
        async unlock(key) {
            // We store this as it could change between the 2 step process
            this.key = key

            let passwordDialog = await this.showPasswordConfirmation({
                title: "Unlock service node",
                noPasswordMessage: "Do you want to unlock the service node?",
                ok: {
                    label: "UNLOCK",
                    color: "primary"
                },
                dark: this.theme == "dark",
                color: this.theme == "dark" ? "red" : "dark"
            });

            passwordDialog
              .onOk(password => {
                this.password = password || "";              
                this.gatewayUnlock(this.password, this.key, false)
            })
            .onDismiss(() => {})
            .onCancel(() => {});
        },
        gatewayUnlock (password, key, confirmed = false) {
            password = password || "";
            this.$store.commit("gateway/set_snode_status", {
                unlock: {
                    code: 2, // Code 1 is reserved for can_unlock
                    message: "Unlocking...",
                    sending: true
                }
            })
            this.$gateway.send("wallet", "unlock_stake", {
                password,
                service_node_key: key,
                confirmed
            })
        },
        copyKey (key, event) {
          event.stopPropagation()
          for (let i = 0; i < event.path.length; i++) {
            if (event.path[i].tagName == "BUTTON") {
              event.path[i].blur()
              break
            }
          }
          clipboard.writeText(key)
          this.$q.notify({
            type: "positive",
            timeout: 1000,
            message: "Service node key copied to clipboard"
          })
        },
        openExplorer(key) {
          this.$gateway.send("core", "open_explorer", {type: "service_node", id: key})
        }
    },

    mixins: [WalletPassword],
    components: {
        tritonField,
        FormatTriton
    }
}
</script>

<style lang="scss">
.service-node-unlock {
  user-select: none;
  .header {
    font-weight: 450;
  }
  .q-item-subtotal, .q-list-header {
    font-size: 14px;
  }
}
</style>
