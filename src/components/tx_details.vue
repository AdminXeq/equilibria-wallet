<template>
  <q-dialog v-model="isVisible" maximized>
    <q-layout>
      <q-header>
        <q-toolbar color="dark" inverted>
          <q-btn flat round dense icon="reply" @click="isVisible = false" />
          <q-toolbar-title>
            Transaction details
          </q-toolbar-title>
          <q-btn flat class="q-mr-sm" label="Show tx details" @click="showTxDetails" />
          <q-btn v-if="can_open" color="primary" label="View on explorer" @click="openExplorer" />
        </q-toolbar>
      </q-header>
      <div class="layout-padding">
        <div class="row items-center non-selectable">
          <div class="q-mr-sm">
            <TxTypeIcon :type="tx.type" :tooltip="false" />
          </div>
          
          <div v-if="tx.type == 'in'" :class="'tx-' + tx.type">
            Incoming transaction
          </div>
          <div v-else-if="tx.type == 'out'" :class="'tx-' + tx.type">
            Outgoing transaction
          </div>
          <div v-else-if="tx.type == 'pool'" :class="'tx-' + tx.type">
            Pending incoming transaction
          </div>
          <div v-else-if="tx.type == 'pending'" :class="'tx-' + tx.type">
            Pending outgoing transaction
          </div>
          <div v-else-if="tx.type == 'failed'" :class="'tx-' + tx.type">
            Failed transaction
          </div>
        </div>

        <div class="row justify-between" style="max-width: 768px">
          <div class="infoBox">
            <div class="infoBoxContent">
              <div class="text"><span>Amount</span></div>
              <div class="value"><span><Formattriton :amount="tx.amount" raw-value /></span></div>
            </div>
          </div>

          <div class="infoBox">
            <div class="infoBoxContent">
              <div class="text"><span>Fee <template v-if="tx.type == 'in' || tx.type == 'pool'">(paid by sender)</template></span></div>
              <div class="value"><span><Formattriton :amount="tx.fee" raw-value /></span></div>
            </div>
          </div>

          <div class="infoBox">
            <div class="infoBoxContent">
              <div class="text"><span>Height</span></div>
              <div class="value"><span>{{ tx.height }}</span></div>
            </div>
          </div>

          <div class="infoBox">
            <div class="infoBoxContent">
              <div class="text"><span>Timestamp</span></div>
              <div class="value"><span>{{ formatDate(tx.timestamp * 1000) }}</span></div>
            </div>
          </div>
        </div>

        <h6 class="q-mt-xs q-mb-none text-weight-light">Transaction id</h6>
        <p class="monospace break-all">{{ tx.txid }}</p>

        <h6 class="q-mt-xs q-mb-none text-weight-light">Payment id</h6>
        <p class="monospace break-all">{{ tx.payment_id ? tx.payment_id : 'N/A' }}</p>

        <div v-if="tx.type == 'in' || tx.type == 'pool'">
          <q-list no-border>
            <q-item header class="q-px-none">Incoming transaction sent to:</q-item>
            <q-item class="q-px-none">
              <q-item-label>
                <q-item-label class="non-selectable">{{ in_tx_address_used.address_index_text }}</q-item-label>
                <q-item-label class="monospace ellipsis">{{ in_tx_address_used.address }}</q-item-label>
              </q-item-label>

              <q-menu context-menu>
                <q-list link separator class="context-menu">
                  <q-item v-close-popup clickable @click.native="copyAddress(in_tx_address_used.address, $event)">
                    <q-item-selection>Copy address</q-item-selection>
                  </q-item>
                </q-list>
              </q-menu>
            </q-item>
          </q-list>
        </div>

        <div v-else-if="tx.type == 'out' || tx.type == 'pending'">
          <q-list no-border>
            <q-item header class="q-px-none">Outgoing transaction sent to:</q-item>
            <template v-if="out_destinations">
              <q-item v-for="destination in out_destinations" :key="destination.address" class="q-px-none">
                <q-item-label>
                  <q-item-label header>{{ destination.name }}</q-item-label>
                  <q-item-label class="monospace ellipsis">{{ destination.address }}</q-item-label>
                  <q-item-label><Formattriton :amount="destination.amount"/></q-item-label>
                </q-item-label>
                <q-menu context-menu>
                  <q-list separator class="context-menu">
                    <q-item v-close-popup clickable @click.native="copyAddress(destination.address, $event)">
                      <q-item-section>Copy address</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-item>
            </template>
            <template v-else>
              <q-item class="q-px-none">
                <q-item-label>
                  <q-item-label header>Destination unknown</q-item-label>
                </q-item-label>
              </q-item>
            </template>
          </q-list>
        </div>

        <q-input v-model="txNotes" label="Transaction notes" :dark="theme == 'dark'"
          :text-color="theme == 'dark' ? 'white' : 'dark'"
          type="textarea" rows="2" dense
        />

        <q-btn :disable="!is_ready" :text-color="theme == 'dark' ? 'white' : 'dark'"
          label="Save tx notes" color="primary" @click="saveTxNotes"
        />
      </div>
    </q-layout>
  </q-dialog>
</template>

<script>
const { clipboard } = require("electron")
import { mapState } from "vuex"
import { date } from "quasar"
// const { formatDate } = date
import TxTypeIcon from "components/tx_type_icon"
import Formattriton from "components/format_triton"
export default {
    name: "TxDetails",
    components: {
      TxTypeIcon,
      Formattriton
    },
    data() {
      return {
        isVisible: false,
        txNotes: "",
        tx: {
          address: "",
          amount: 0,
          double_spend_seen: false,
          fee: 0,
          height: 0,
          note: "",
          payment_id: "",
          subaddr_index: { major: 0, minor: 0 },
          timestamp: 0,
          txid: "",
          type: "",
          unlock_time: 0
        }
      };
    },
    computed: mapState({
      theme: state => state.gateway.app.config.appearance.theme,
      can_open(state) {
        const { net_type } = state.gateway.app.config.app;
        return net_type !== "stagenet";
      },
      in_tx_address_used (state) {
        let i
        let used_addresses = state.gateway.wallet.address_list.primary.concat(state.gateway.wallet.address_list.used)
        for (i = 0; i < used_addresses.length; i++) {
          if (used_addresses[i].address_index == this.tx.subaddr_index.minor) {
            let address_index_text = ""
            if (used_addresses[i].address_index === 0) {
              address_index_text = "Primary address"
            } else {
              address_index_text = "Sub-address (Index: " + used_addresses[i].address_index + ")"
            }
            return {
              address: used_addresses[i].address,
              address_index: used_addresses[i].address_index,
              address_index_text: address_index_text
            }
          }
        }
        return false
      },
      out_destinations (state) {
        if (!this.tx.destinations) return false
        let i, j
        let destinations = []
        let address_book = state.gateway.wallet.address_list.address_book
        for (i = 0; i < this.tx.destinations.length; i++) {
          let destination = this.tx.destinations[i]
          destination.name = ""
          for (j = 0; j < address_book.length; j++) {
            if (destination.address === address_book[j].address) {
              const { name, description } = address_book[j]
              const separator = description === "" ? "" : " - "
              destination.name = `${name}${separator}${description}`
              break
            }
          }
          destinations.push(destination)
        }
        return destinations
      },
      is_ready (state) {
        return this.$store.getters["gateway/isReady"]
      }
    }),
    methods: {
      showTxDetails () {
        this.$q
          .dialog({
            title: "Transaction details",
            message: JSON.stringify(this.tx, null, 2),
            ok: {
              label: "close",
              color: "primary"
            },
            dark: this.theme == "dark",
            style: "min-width: 500px; overflow-wrap: break-word;"
          })
          .onOk(() => {})
          .onCancel(() => {})
          .onDismiss(() => {});
      },
      openExplorer() {
        this.$gateway.send("core", "open_explorer", {
          type: "tx",
          id: this.tx.txid
        });
      },
      saveTxNotes() {
        this.$q.notify({
          timeout: 1000,
          type: "positive",
          message: "Transaction notes saved"
        })
        this.$gateway.send("wallet", "save_tx_notes", {
          txid: this.tx.txid,
          note: this.txNotes
        })
      },
      formatDate(timestamp) {
        return date.formatDate(timestamp, "YYYY-MM-DD hh:mm a")
      },
      copyAddress(address, event) {
        event.stopPropagation()
        for (let i = 0; i < event.path.length; i++) {
          if (event.path[i].tagName == "BUTTON") {
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
    }
}
</script>

<style></style>