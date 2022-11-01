<template>
  <q-dialog v-model="isVisible" maximized class="address-book-details">
    <q-layout v-if="mode == 'edit' || mode == 'new'">
      <q-header>
        <q-toolbar color="dark" inverted>
          <q-btn flat round dense icon="reply" @click="close()" />
          <q-toolbar-title v-if="mode=='new'">
            Add address book entry
          </q-toolbar-title>
          <q-toolbar-title v-else-if="mode=='edit'">
            Edit address book entry
          </q-toolbar-title>

          <q-btn v-if="mode == 'edit'" color="red flat no-ripple" label="Cancel" @click="cancelEdit()" />
          <q-btn class="q-ml-sm" color="primary" label="Save" @click="save()" />
        </q-toolbar>
      </q-header>
      <q-page-container>
        <div class="address-book-modal q-mx-md">
          <tritonField label="Address" :error="$v.newEntry.address.$error">
            <q-input
              v-model.trim="newEntry.address"
              placeholder="address_placeholder"
              :dark="theme == 'dark'"
              borderless
              dense
              @blur="$v.newEntry.address.$touch"
            />
            <q-btn
              v-model.trim="newEntry.starred"
              flat
              round
              :icon="newEntry.starred ? 'star' : 'star_border'"
              @click="updareStarred"
            />
          </tritonField>
          <tritonField label="Name">
            <q-input v-model="newEntry.name" :dark="theme == 'dark'" borderless dense />
          </tritonField>
          <tritonField label="Payment ID" :error="$v.newEntry.payment_id.$error" optional>
            <q-input
              v-model.trim="newEntry.payment_id"
              placeholder="16 or 64 hexadecimal characters"
              :dark="theme == 'dark'"
              borderless
              dense
              @blur="$v.newEntry.payment_id.$touch"
            />
          </tritonField>
          <tritonField label="Notes" optional>
            <q-input
              v-model="newEntry.description"
              placeholder="Additional notes"
              type="textarea"
              class="full-width text-area-triton"
              :dark="theme == 'dark'"
              borderless
              dense
            />
          </tritonField>

          <q-btn
            v-if="mode == 'edit'"
            class="submit-button"
            color="red"
            label="Delete"
            @click="deleteEntry()"
          />
        </div>
      </q-page-container>
    </q-layout>

    <q-layout v-else>
      <q-header>
        <q-toolbar color="dark" inverted>
          <q-btn flat round dense icon="reply" @click="close()" />
          <q-toolbar-title>
            Address book details
          </q-toolbar-title>
          <q-btn class="q-mr-sm" flat no-ripple :disable="!is_ready" label="Edit" @click="edit()" />
          <q-btn color="primary" :disabled="view_only" label="Send Coins" @click="sendToAddress" />
        </q-toolbar>
      </q-header>
      <q-page-container>
        <div class="layout-padding">
          <template v-if="entry != null">
            <AddressHeader :address="entry.address"
                           :title="entry.name"
                           :payment_id="entry.payment_id"
                           :extra="entry.description ? 'Notes: ' + entry.description : ''"
            />

            <div class="q-mt-lg">
              <div class="non-selectable">
                <q-icon name="history" size="24px" />
                <span class="vertical-middle q-ml-xs">Recent transactions with this address</span>
              </div>
              <TxList :key="entry.address" type="all_in" :limit="5" :to-outgoing-address="entry.address" />
            </div>
          </template>
        </div>
      </q-page-container>
    </q-layout>
  </q-dialog>
</template>

<script>
import { mapState } from "vuex"
// import Identicon from "components/identicon"
import AddressHeader from "components/address_header"
import TxList from "components/tx_list"
import tritonField from "components/triton_field"
import { payment_id, address } from "src/validators/common"
import { required } from "vuelidate/lib/validators"
export default {
    name: "AddressBookDetails",
    data () {
        return {
            isVisible: false,
            entry: null,
            mode: "view",
            newEntry: {
                index: false,
                address: "",
                payment_id: "",
                name: "",
                description: "",
                starred: false
            }
        }
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        view_only: state => state.gateway.wallet.info.view_only,
        is_ready (state) {
            return this.$store.getters["gateway/isReady"]
        },
        address_placeholder (state) {
            const wallet = state.gateway.wallet.info
            const prefix = (wallet && wallet.address && wallet.address[0]) || "T"
            return `${prefix}..`
        }
    }),
    validations: {
        newEntry: {
            address: {
                required,
                isAddress (value) {
                    if (value === "") return true

                    return new Promise(resolve => {
                        address(value, this.$gateway)
                            .then(() => resolve(true))
                            .catch(e => resolve(false))
                    })
                }
            },
            payment_id: { payment_id }
        }
    },
    methods: {
        save () {
            this.$v.newEntry.$touch()

            if (this.$v.newEntry.address.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Address not valid"
                })
                return
            }

            if (this.$v.newEntry.payment_id.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Payment id not valid"
                })
                return
            }

            this.$gateway.send("wallet", "add_address_book", this.newEntry)
            this.close()
        },
        deleteEntry () {
            this.$gateway.send("wallet", "delete_address_book", this.newEntry)
            this.close()
        },
        sendToAddress () {
            this.close()
            this.$router.replace({ path: "send", query: { address: this.entry.address, payment_id: this.entry.payment_id } })
        },
        edit () {
            this.mode = "edit"
            this.newEntry = this.entry
        },
        cancelEdit () {
            this.mode = "view"
            this.$v.$reset()
            this.newEntry = {
                index: false,
                address: "",
                payment_id: "",
                name: "",
                description: "",
                starred: false
            }
        },
        updateStarred() {
          this.newEntry.starred = !this.newEntry.starred;
          return;
        },
        close () {
            this.isVisible = false
            this.$v.$reset()
            this.newEntry = {
                index: false,
                address: "",
                payment_id: "",
                name: "",
                description: "",
                starred: false
            }
        }
    },

    components: {
        AddressHeader,
        // Identicon,
        TxList,
        tritonField
    }
}
</script>

<style lang="scss">
.address-book-details {

    .address-book-modal {
        > .triton-field {
            margin-top: 16px;
        }

        .star-entry {
            padding: 4px;
        }
    }
}
</style>
