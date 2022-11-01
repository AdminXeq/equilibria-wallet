<template>
  <q-list class="triton-list-item" no-border @click.native="details(address)">
    <q-item>
      <q-item-section class="flex">
        <q-item-label class="ellipsis">{{ address.address }}</q-item-label>
        <q-item-label v-if="sublabel" caption class="non-selectable">{{ sublabel }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="row">
          <q-btn style="margin-right: 4px;" flat padding="xs" size="md" @click="showQR(address.address, $event)">
            <img :src="qrImage" height="24" />
            <q-tooltip anchor="bottom right" self="top right" :offset="[0, 5]">
              Show QR Code
            </q-tooltip>
          </q-btn>
          <q-btn flat padding="xs" size="md" icon="file_copy" @click="copyAddress(address.address, $event)">
            <q-tooltip anchor="bottom right" self="top right" :offset="[0, 5]">
              Copy Address
            </q-tooltip>
          </q-btn>
        </div>
      </q-item-section>
    </q-item>
    <template v-if="shouldShowInfo">
      <q-separator />
      <q-item>
        <q-item-section>
          <div class="row info-section">
            <span class="col-sm-4">
              <span>Balance</span>
              <br/>
              <span class="value">{{ address.balance | currency }}</span>
            </span>
            <span class="col-sm-4">
              <span>Unlocked Balance</span>
              <br/>
              <span class="value">{{ address.unlocked_balance | currency }}</span>
            </span>
            <span class="col-sm-4">
              <span>Unspent Outputs</span>
              <br/>
              <span class="value">{{ address.num_unspent_outputs | toString }}</span>
            </span>
          </div>
        </q-item-section>
      </q-item>
    </template>
    <q-menu context-menu>
      <q-list separator class="context-menu">
        <q-item v-close-popup clickable @click.native="details(address)">
          <q-item-section>
            Show Details
          </q-item-section>
        </q-item>

        <q-item v-close-popup clickable @click.native="copyAddress(address.address, $event)">
          <q-item-section>
            Copy Address
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-list>
</template>

<script>
import { mapState } from "vuex"
const { clipboard, nativeImage } = require("electron")
export default {
    name: "ReceiveItem",
    props: {
        address: {
            required: true
        },
        sublabel: {
            type: String,
            required: false,
        },
        shouldShowInfo: {
            type: Boolean,
            required: false,
            default: true
        },
        showQR: {
            type: Function,
            required: true
        },
        copyAddress: {
            type: Function,
            required: true
        },
        details: {
            type: Function,
            required: true
        },
        whiteQRIcon: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    computed: {
        qrImage () {
            const image = this.whiteQRIcon ? "qr-code" : "qr-code-grey"
            return `${image}.svg`
        },
    },
    filters: {
        toString: function (value) {
            if (typeof value !== "number") return "N/A";
            return String(value);
        },
        currency: function (value) {
            if (typeof value !== "number") return "N/A";

            const amount = value / 1e4
            return amount.toLocaleString()
        }
    },
}
</script>

<style>
.into-section {
  max-height: 3rem;
}
</style>
