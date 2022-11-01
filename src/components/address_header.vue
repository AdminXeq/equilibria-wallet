<template>
  <div>
    <q-item-section class="self-start">
      <q-item-label sublabel class="title">{{ title }}</q-item-label>
      <q-item-label class="row">
        <q-item-section class="break-all" style="font-size: 18px">
          {{ address }}
        </q-item-section>
        <q-item-section v-if="showCopy" side>
          <q-btn ref="copy" color="primary" padding="xs" size="sm" icon="file_copy" @click="copyAddress">
            <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">
              Copy Address
            </q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item-label>
      <q-item-label v-if="payment_id" header>Payment id: {{ payment_id }}</q-item-label>
      <q-item-label v-if="extra" header class="extra non-selectable">{{ extra }}</q-item-label>
    </q-item-section>

    <q-menu context-menu>
      <q-list separator class="context-menu">
        <q-item v-close-popup clickable @click.native="copyAddress(/*address, $event*/)">
          <q-item-section>
            Copy Address
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script>
const { clipboard } = require("electron")
// import Identicon from "components/identicon"
export default {
    name: "AddressHeader",
    props: {
        title: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        payment_id: {
            type: String,
            required: false
        },
        extra: {
            type: String,
            required: false
        },
        showCopy: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    data () {
        return {}
    },
    methods: {
        copyAddress() {
            this.$refs.copy.$el.blur()
            clipboard.writeText(this.address)
            if (this.payment_id) {
                this.$q.dialog({
                    title: "Copy address",
                    message: "There is a payment id associated with this address.\nBe sure to copy the payment id separately.",
                    ok: {
                        label: "OK",
                        color: "positive"
                    }
                })
                .onDismiss(() => null)
                .onCancel(() => null)
                .onOk(() => {
                    this.$q.notify({
                        type: "positive",
                        timeout: 1000,
                        message: "Address copied to clipboard"
                    })
                })
            } else {
                this.$q.notify({
                    type: "positive",
                    timeout: 1000,
                    message: "Address copied to clipboard"
                })
            }
        }
    },
    components: {
        // Identicon
    }
}
</script>

<style lang="scss">
.title {
  font-size: 18px;
  margin-bottom: 4px;
  color: navy;
}

.extra {
  margin-top: 8px;
  color: navy;
}

.address-header {
    padding: 0;
    img {
        float:left;
        margin-right: 15px;
    }
    h3 {
        margin: 15px 0 0;
    }
    p {
        word-break: break-all;
    }

    &::after {
        content: "";
        clear: both;
        display: table;
    }

    .q-item-label {
        .q-item-label {
            font-weight: 400;
        }
    }
}
</style>
