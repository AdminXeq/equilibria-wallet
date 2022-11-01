<template>
<q-page>
    <div class="q-mx-md">
        <tritonField class="q-mt-md" label="Account Name" :error="$v.wallet.name.$error">
            <q-input
                v-model="wallet.name"
                placeholder="A name for your account"
                @blur="$v.wallet.name.$touch"
                :dark="theme == 'dark'"
                borderless
                dense
                />
        </tritonField>

        <tritonField class="q-mt-md" label="Mnemonic Seed" :error="$v.wallet.seed.$error">
            <q-input
                v-model="wallet.seed"
                class="full-width text-area-triton"
                placeholder="25 (or 24) word Mnemonic Seed"
                type="textarea"
                @blur="$v.wallet.seed.$touch"
                :dark="theme == 'dark'"
                borderless
                dense
                />
        </tritonField>

        <div class="row items-end q-mt-md">
            <div class="col-md-9 col-sm-8">
                <tritonField v-if="wallet.refresh_type=='date'" label="Restore from date">
                    <q-input v-model="wallet.refresh_start_date" mask="date" borderless dense>
                      <template v-slot:addend>
                        <q-icon v-if="wallet.refresh_type == 'date'" name="event" class="cursor-pointer">
                          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                            <q-date v-model="wallet.refresh_start_date" :dark="theme == 'dark'" :options="dateRangeOptions">
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                </tritonField>
                <tritonField v-else-if="wallet.refresh_type=='height'" label="Restore from block height" :error="$v.wallet.refresh_start_height.$error">
                    <q-input v-model="wallet.refresh_start_height" type="number"
                                min="0"
                                @blur="$v.wallet.refresh_start_height.$touch"
                                :dark="theme == 'dark'"
                                borderless
                                dense
                                />
                </tritonField>
            </div>
            <div class="col-sm-4 col-md-3">
                <template v-if="wallet.refresh_type == 'date'">
                    <q-btn class="restore-from-button" :text-color="theme == 'dark' ? 'white' : 'dark'" flat @click="wallet.refresh_type = 'height'">
                        <div class="column justify-center items-center">
                          <q-icon name="clear_all" />
                          Switch to<br/>Height select
                        </div>
                    </q-btn>
                </template>
                <template v-else-if="wallet.refresh_type == 'height'">
                    <q-btn class="restore-from-button" :text-color="theme == 'dark' ? 'white' : 'dark'" flat @click="wallet.refresh_type = 'date'">
                        <div class="column justify-center items-center">
                            <q-icon name="today" />
                            Switch to<br/>date select
                        </div>
                    </q-btn>
                </template>
            </div>
        </div>

        <tritonField class="q-mt-md" label="Password">
            <q-input
                v-model="wallet.password"
                placeholder="An optional password for the account"
                type="password"
                :dark="theme == 'dark'"
                borderless
                dense
                @keyup.enter="restore_wallet"
            />
        </tritonField>

        <tritonField class="q-mt-md" label="Confirm Password">
            <q-input
                v-model="wallet.password_confirm"
                type="password"
                :dark="theme == 'dark'"
                borderless
                dense
                @keyup.enter="restore_wallet"
            />
        </tritonField>

        <q-btn class="submit-button" color="primary" label="Restore Account" @click="restore_wallet" />

    </div>
</q-page>
</template>

<script>
import { required, numeric } from "vuelidate/lib/validators"
import { mapState } from "vuex"
import tritonField from "components/triton_field"
import { date } from "quasar"

const timeStampFirstBlock = 1541014386;
const qDateFormat = "YYYY/MM/DD";
let dateFirstBlock = date.formatDate(timeStampFirstBlock, qDateFormat);
export default {
    data () {
        return {
            wallet: {
                name: "",
                seed: "",
                refresh_type: "date",
                refresh_start_height: 0,
                refresh_start_date: timeStampFirstBlock, // timestamp of block 1
                password: "",       
                password_confirm: ""
            }
        }
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        status: state => state.gateway.wallet.status
    }),
    watch: {
        status: {
            handler (val, old) {
                if (val.code === old.code) return
                switch (this.status.code) {
                case 1:
                    break
                case 0:
                    this.$q.loading.hide()
                    this.$router.replace({ path: "/wallet-select/created" })
                    break
                default:
                    this.$q.loading.hide()
                    this.$q.notify({
                        type: "negative",
                        timeout: 1000,
                        message: this.status.message
                    })
                    break
                }
            },
            deep: true
        }
    },
    validations: {
        wallet: {
            name: { required },
            seed: { required },
            refresh_start_height: { numeric }
        }
    },
    methods: {
        restore_wallet () {
            this.$v.wallet.$touch()

            if (this.$v.wallet.name.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Enter a wallet name"
                })
                return
            }
            if (this.$v.wallet.seed.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Enter seed words"
                })
                return
            }

            let seed = this.wallet.seed.trim()
                .replace(/\n/g, " ")
                .replace(/\t/g, " ")
                .replace(/\s{2,}/g, " ")
                .split(" ")
            if (seed.length !== 14 && seed.length !== 24 && seed.length !== 25 && seed.length !== 26) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Invalid seed word length"
                })
                return
            }

            if (this.$v.wallet.refresh_start_height.$error) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Invalid restore height"
                })
                return
            }
            if (this.wallet.password !== this.wallet.password_confirm) {
                this.$q.notify({
                    type: "negative",
                    timeout: 1000,
                    message: "Passwords do not match"
                })
                return
            }

            this.$q.loading.show({
                delay: 0
            })

            this.$gateway.send("wallet", "restore_wallet", this.wallet)
        },
        // Ensures the date is valid
        dateRangeOptions(dateSelected) {
          const now = Date.now();
          const formattedNow = date.formatDate(now, qDateFormat);
          return dateSelected > timeStampFirstBlock && dateSelected <= formattedNow;
        },
        cancel () {
            this.$router.replace({ path: "/wallet-select" })
        }
    },
    components: {
        tritonField
    }
}
</script>

<style>
.restore-from-button {
  width: 100%;
  height: 54px;
}
</style>
