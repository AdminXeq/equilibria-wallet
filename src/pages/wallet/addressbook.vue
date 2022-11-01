<template>
<q-page class="address-book">

    <div class="header row q-pt-md q-pb-xs q-mx-md q-mb-none items-center non-selectable">
            Address book
    </div>

    <template v-if="address_book_combined.length">
        <q-list link no-border :dark="theme=='dark'" class="triton-list">
            <q-item class="triton-list-item" :key="`${entry.address}-${entry.name}-${entry.payment_id}`" v-for="entry in address_book_combined" @click.native="details(entry)">
                <q-item-section>
                    <q-item-label class="ellipsis">{{ entry.address }}</q-item-label>
                    <q-item-label class="non-selectable" caption>{{ entry.name }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label>
                    <q-icon size="24px" :name="entry.starred ? 'star' : 'star_border'" />
                    <q-btn
                        color="secondary"
                        style="margin-left: 10px;"
                        :label="Send"
                        :disabled="view_only"
                        @click="sendToAddress(entry, $event)"
                    />
                  </q-item-label>
                </q-item-section>

                <q-menu context-menu>
                    <q-list class="context-menu">
                        <q-item v-close-popup clickable @click.native="details(entry)">
                            <q-item-section>Show details</q-item-section>
                        </q-item>

                        <q-item v-close-popup clickable @click.native="sendToAddress(entry, $event)">
                            <q-item-section>Send to this address</q-item-section>
                        </q-item>

                        <q-item v-close-popup clickable @click.native="copyAddress(entry, $event)">
                            <q-item-section>Copy address</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>

            </q-item>
        </q-list>
    </template>
    <template v-else>
        <p class="q-ma-md">Address book is empty</p>
    </template>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn
            :disable="!is_ready"
            round
            color="primary"
            @click="addEntry"
            icon="add"
            />
    </q-page-sticky>
    <AddressBookDetails ref="addressBookDetails" />

</q-page>
</template>

<script>
const { clipboard } = require("electron")
import { mapState } from "vuex"
// import Identicon from "components/identicon"
import AddressBookDetails from "components/address_book_details"
export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        view_only: state => state.gateway.wallet.info.view_only,
        address_book: state => state.gateway.wallet.address_list.address_book,
        address_book_starred: state => state.gateway.wallet.address_list.address_book_starred,
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        },
        address_book_combined (state) {
            const starred = this.address_book_starred.map(a => ({ ...a, starred: true }))
            return [
                ...starred,
                ...this.address_book
            ]
        }
    }),
    methods: {
        details: function (entry) {
            this.$refs.addressBookDetails.entry = entry
            this.$refs.addressBookDetails.mode = "view"
            this.$refs.addressBookDetails.isVisible = true
        },
        addEntry: function () {
            this.$refs.addressBookDetails.entry = null
            this.$refs.addressBookDetails.mode = "new"
            this.$refs.addressBookDetails.isVisible = true
        },
        sendToAddress (address, event) {
            event.stopPropagation()
            for (let i = 0; i < event.path.length; i++) {
                if (event.path[i].tagName === "BUTTON") {
                    event.path[i].blur()
                    break
                }
            }
            this.$router.replace({ path: "send", query: { address: address.address, payment_id: address.payment_id } })
        },
        copyAddress (entry, event) {
            event.stopPropagation()
            for (let i = 0; i < event.path.length; i++) {
                if (event.path[i].tagName === "BUTTON") {
                    event.path[i].blur()
                    break
                }
            }
            clipboard.writeText(entry.address)
            if (entry.payment_id) {
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
        // Identicon,
        AddressBookDetails
    }
}
</script>

<style lang="scss">
.address-book {
    .header {
        font-size: 14px;
        font-weight: 500
    }

    .triton-list-item {
        cursor: pointer;
        padding-top: 12px;
        padding-bottom: 12px;

        .q-item-sublabel  {
            font-size: 14px;
        }

        .q-item-label {
            font-weight: 400;
        }

        .q-item-section {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-left: 12px;
        }
    }

}
</style>
