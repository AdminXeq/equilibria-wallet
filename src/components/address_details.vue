<template>
  <q-dialog v-model="isVisible" maximized>
    <q-layout>
      <q-header>
        <q-toolbar color="dark" inverted>
          <q-btn flat round dense icon="reply" @click="isVisible = false" />
          <q-toolbar-title>
            Address details
          </q-toolbar-title>
          <q-btn flat label="Show QR Code" @click="isQRCodeVisible = true" />
          <q-btn class="q-ml-sm" color="primary" label="Copy address" @click="copyAddress()" />
        </q-toolbar>
      </q-header>
      <q-page-container>
        <div class="layout-padding">
          <template v-if="address != null">
            <AddressHeader :address="address.address"
                           :title="address.address_index == 0 ? 'Primary address' : 'Sub-address (Index ' + address.address_index + ')'"
                           :extra="'You have ' + (address.used ? 'used' : 'not used') + ' this address'"
                           :showCopy="false"
            />

            <template v-if="address.used">
              <div class="row justify-between" style="max-width: 768px">
                <div class="infoBox">
                  <div class="infoBoxContent">
                    <div class="text">
                      <span>Balance</span>
                    </div>
                    <div class="value">
                      <span><Formattriton :amount="address.balance" /></span>
                    </div>
                  </div>
                </div>

                <div class="infoBox">
                  <div class="infoBoxContent">
                    <div class="text">
                      <span>Unlocked balance</span>
                    </div>
                    <div class="value">
                      <span><Formattriton :amount="address.unlocked_balance" /></span>
                    </div>
                  </div>
                </div>

                <div class="infoBox">
                  <div class="infoBoxContent">
                    <div class="text">
                      <span>Number of unspent outputs</span>
                    </div>
                    <div class="value">
                      <span>{{ address.num_unspent_outputs }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="row justify-between" style="max-width: 768px">
                <div class="infoBox">
                  <div class="infoBoxContent">
                    <div class="text">
                      <span>Balance</span>
                    </div>
                    <div class="value"><span>N/A</span></div>
                  </div>
                </div>

                <div class="infoBox">
                  <div class="infoBoxContent">
                    <div class="text">
                      <span>Unlocked balance</span>
                    </div>
                    <div class="value"><span>N/A</span></div>
                  </div>
                </div>

                <div class="infoBox">
                  <div class="infoBoxContent">
                    <div class="text">
                      <span>Number of unspent outputs</span>
                    </div>
                    <div class="value"><span>N/A</span></div>
                  </div>
                </div>
              </div>
            </template>

            <div class="q-mt-sm">
              <div class="non-selectable recent-transactions-wrapper">
                <q-icon name="history" size="24px" />
                <span class="vertical-middle q-ml-xs">Recent incoming transactions to this address</span>
              </div>

              <div style="margin: 0 -16px;">
                <TxList :key="address.address" type="all_in" :limit="5" :to-incoming-address-index="address.address_index" />
              </div>
            </div>
          </template>
        </div>
      </q-page-container>
    </q-layout>
    <template v-if="address != null">
      <q-dialog v-model="isQRCodeVisible" minimized :content-class="'qr-code-modal'">
        <q-card class="qr-code-card">
          <div class="text-center q-mb-sm q-pa-md" style="background: white;">
            <qrcode-vue ref="qr" :value="address.address" size="240"> </qrcode-vue>
            <q-menu context-menu>
              <q-list link separator style="min-width: 150px; max-height: 300px;">
                <q-item v-close-popup @click.native="copyQR()">
                  <q-item-label label="Copy QR code" />
                </q-item>
                <q-item v-close-popup @click.native="saveQR()">
                  <q-item-main label="Save QR code to file" />
                </q-item>
              </q-list>
            </q-menu>
          </div>
          <q-card-actions>
            <q-btn color="primary" label="Close" @click="isQRCodeVisible = false" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </q-dialog>
</template>

<script>
import { mapState } from "vuex"
const { clipboard, nativeImage } = require("electron")
import AddressHeader from "components/address_header"
import Formattriton from "components/format_triton"
import QrcodeVue from "qrcode.vue"
import TxList from "components/tx_list"
export default {
    name: "AddressDetails",
    computed: mapState({
    }),
    data () {
        return {
            isVisible: false,
            isQRCodeVisible: false,
            address: null
        }
    },
    methods: {
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
        copyAddress () {
            clipboard.writeText(this.address.address)
            this.$q.notify({
                type: "positive",
                timeout: 1000,
                message: "Address copied to clipboard"
            })
        }
    },
    components: {
        AddressHeader,
        TxList,
        Formattriton,
        QrcodeVue
    }
}
</script>

<style>
</style>
