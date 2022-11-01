<template>
  <q-page class="receive">
    <q-list link no-border :dark="theme == 'dark'" class="triton-list">
      <q-item-label header>
        {{ "My Primary Address" }}
      </q-item-label>
      <ReceiveItem v-for="address in address_list.primary" :key="address.address" class="primary-address"
        :address="address" :sublabel="`${"Primary Address"}`" :showQR="showQR" :copyAddress="copyAddress" :details="details" whiteQRIcon />

      <template v-if="address_list.used.length">
        <q-item-label header>{{ "My Used Addresses" }}</q-item-label>
        <ReceiveItem v-for="address in address_list.used" :key="address.address" :address="address"
          :sublabel="`${"Sub-address"} (${"Index", { index: address.address_index })}`" :showQR="showQR" :copyAddress="copyAddress" :details="details" />
      </template>

      <template v-if="address_list.unused.length">
        <q-item-label header>My Unused Addresses</q-item-label>
        <ReceiveItem v-for="address in address_list.unused" :key="address.address"
          sublabel="`${"Sub-Address"} (${"Index", { address.address_index })}`"" :showQR="showQR" :copyAddress="copyAddress" :details="details" :shouldShowInfo="false" />
      </template>

    </q-list>
    <AddressDetails ref="addressDetails" />

    <!-- QR Code -->
    <template v-if="QR.address != null">
      <q-dialog v-model="QR.visible" :content-class="'qr-code-modal'">
        <q-card class="qr-code-card">
          <div class="text-center q-mb-sm q-pa-md" style="background: white;">
            <QrcodeVue ref="qr" :value="QR.address" size="240"> </QrcodeVue>
            <q-menu context-menu>
              <q-list class="context-menu">
                <q-item v-close-popup clickable @click.native="copyQR()">
                  <q-item-section>Copy QR Code</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click.native="saveQR()">
                  <q-item-section>Save QR Code</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
          <q-card-actions>
            <q-btn color="primary" label="Close" @click="QR.visible = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </q-page>
</template>

<script>

const { clipboard, nativeImage } = require("electron")
import { mapState } from "vuex"
import QrcodeVue from "qrcode.vue"
// import Identicon from "components/identicon"
import AddressDetails from "components/address_details"
import ReceiveItem from "components/receive_item"

export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        address_list: state => state.gateway.wallet.address_list
    }),
    filters: {
        toString: function (value) {
            if (typeof value !== "number") return "N/A"
            return String(value)
        },
        currency: function (value) {
            if (typeof value !== "number") return "N/A"

            const amount = value / 1e4
            return amount.toLocaleString()
        }
    },
    data () {
        return {
            show: false,
            QR: {
                visible: false,
                address: null,
                show: false,
                showMessage: "Show Unused Addresses"
            }
        }
    },
    methods: {
        showUnused () {
            this.show = !this.show
            this.$forceUpdate()
        },
        details (address) {
            this.$refs.addressDetails.address = address
            this.$refs.addressDetails.isVisible = true
        },
        showQR (address, event) {
            event.stopPropagation()
            this.QR.visible = true
            this.QR.address = address
        },
        copyQR () {
            const data = this.$refs.qr.$el.childNodes[0].toDataURL()
            const img = nativeImage.createFromDataURL(data)
            clipboard.writeImage(img)
            this.$q.notify({
                type: "positive",
                timeout: 1000,
                message: "Copied QR code to clipboard"
            })
        },
        saveQR () {
            let img = this.$refs.qr.$el.childNodes[0].toDataURL()
            this.$gateway.send("core", "save_png", { img, type: "QR Code" })
        },
        copyAddress (address, event) {
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
    },
    components: {
        // Identicon,
        AddressDetails,
        QrcodeVue,
        ReceiveItem
    }
}
</script>

<style lang="scss">
.qr-options-menu {
  min-width: 150px;
  max-height: 300px;
  color: white;
}

.receive {
    .q-item-label {
        font-weight: 400;
    }

    .triton-list-item {
        cursor: pointer;

        .q-item-section {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .info {
            span {
                font-size: 14px;
            }

             .value {
                font-size: 16px;
                font-weight: bold;
            }
        }
    }
}
</style>
