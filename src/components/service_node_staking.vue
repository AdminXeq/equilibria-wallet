<template>
  <div class="service-node-staking">
    <div class="q-px-md q-pt-md">
      <tritonField label="Service Node Key" :error="$v.service_node.key.$error">
        <q-input v-model.trim="service_node.key" :dark="theme=='dark'" placeholder="64 hexadecimal characters"
          borderless dense @blur="$v.service_node.key.$touch"
        />
      </tritonField>

      <tritonField label="Amount" class="q-mt-md" :error="$v.service_node.amount.$error">
        <q-input v-model.trim="service_node.amount" :dark="theme=='dark'" type="number"
          min="0" :max="unlocked_balance / 1e4" placeholder="0"
          borderless dense @blur="$v.service_node.amount.$touch"
        />
        <q-btn color="secondary" :text-color="theme == 'dark' ? 'white' : 'dark'"
          @click="service_node.amount = unlocked_balance / 1e4"
        >
          All
        </q-btn>
      </tritonField>

      <div class="submit-button">
        <q-btn :disable="!is_able_to_send" color="primary" label="Stake" @click="stake()" />
        <q-btn :disable="!is_able_to_send" color="secondary" label="Sweep All" @click="sweepAllWarning()" />
      </div>
    </div>

    <ServiceNodeUnlock />

    <q-inner-loading :showing="stake_status.sending || tx_status.sending" :dark="theme == 'dark'">
      <q-spinner color="primary" size="30" />
    </q-inner-loading>
  </div>
</template>

<script>
const objectAssignDeep = require("object-assign-deep")
import { mapState } from "vuex"
import { required, decimal } from "vuelidate/lib/validators"
import { service_node_key, greater_than_zero } from "src/validators/common"
import tritonField from "components/triton_field"
import WalletPassword from "src/mixins/wallet_password"
import ServiceNodeUnlock from "components/service_node_unlock"

export default {
    name: "ServiceNodeStaking",
    components: {
      tritonField,
      ServiceNodeUnlock
    },
    mixins: [WalletPassword],
    data () {
      return {
        service_node: {
          key: "",
          amount: 0
        }
      };
    },
    computed: mapState({
      theme: state => state.gateway.app.config.appearance.theme,
      unlocked_balance: state => state.gateway.wallet.info.unlocked_balance,
      info: state => state.gateway.wallet.info,
      stake_status: state => state.gateway.service_node_status.stake,
      tx_status: state => state.gateway.tx_status,
      award_address: state => state.gateway.wallet.info.address,
      is_ready(state) {
        return this.$store.getters["gateway/isReady"]
      },
      is_able_to_send(state) {
        return this.$store.getters["gateway/isAbleToSend"]
      },
      address_placeholder(state) {
        const wallet = state.gateway.wallet.info;
        const prefix = (wallet && wallet.address && wallet.address[0]) || "T";
        return `${prefix}..`;
      }
    }),
    validations: {
        service_node: {
            key: { required, service_node_key },
            amount: {
                required,
                decimal,
                greater_than_zero
            }
        }
    },
    watch: {
        stake_status: {
            handler (val, old) {
                if (val.code == old.code) return;
                const { code, message } = val;
                switch (code) {
                  case 0:
                    this.$q.notify({
                        type: "positive",
                        timeout: 1000,
                        message
                    })
                    this.$v.$reset()
                    this.service_node = {
                        key: "",
                        amount: 0
                    }
                    break
                  case -1:
                    this.$q.notify({
                        type: "negative",
                        timeout: 3000,
                        message
                    })
                    break
                }
            },
            deep: true
        },
        tx_status: {
          handler(val, old) {
            if (val.code == old.code) return
            switch(this.tx_status.code) {
              case 0:
                this.$q.norify({
                  type: "positive",
                  timeout: 1000,
                  message: this.tx_status.message
                })
                break
              case -1:
                this.$q.notify({
                  type: "negative",
                  timeout: 3000,
                  message: this.tx_status.message
                })
                break
            }
          },
          deep: true
        }
    },
    methods: {
      sweepAllWarning() {
        this.$q
          .dialog({
            title: "Sweep all warning",
            message: "You are about to combine all of your unspent funds by sending a transaction to yourself. You might see temporarily balance 0 in your wallet",
            ok: {
              label: "SWEEP ALL",
              color: "primary"
            },
            cancel: {
              flat: true,
              label: "CANCEL",
              color: this.theme === "dark" ? "white" : "dark"
            },
            dark: this.theme === "dark"
          })
          .onOk(() => {
            this.sweepAll();
          })
          .onDismiss(() => {})
          .onCancel(() => {});
      },
      async sweepAll() {
        const { unlocked_balance } = this.info

        const tx = {
          amount: unlocked_balance / 1e4,
          address: this.award_address,
          priority: 0
        }

        let passwordDialog = await this.showPasswordConfirmation({
          title: "Sweep All",
          noPasswordMessage: "Do you want to sweep all?",
          ok: {
            label: "SWEEP ALL",
            color: "primary"
          },
          dark: this.theme == "dark",
          color: this.theme == "dark" ? "white" : "dark"
        })
        passwordDialog
          .onOk(password => {
            password = password || "";
            this.$store.commit("gateway/set_tx_status", {
              code: 1,
              message: "Sweeping All",
              sending: true
            })
            const newTx = objectAssignDeep.noMutate(tx, {password})
            this.$gateway.send("wallet", "transfer", newTx)
          })
          .onDismiss(() => {})
          .onCancel(() => {});
        },
        async stake() {
          this.$v.service_node.$touch()

          if (this.$v.service_node.key.$error) {
            this.$q.notify({
              type: "negative",
              timeout: 1000,
              message: "Service node key not valid"
            })
            return
          }

          if (this.service_node.amount < 0) {
            this.$q.notify({
              type: "negative",
              timeout: 1000,
              message: "Amount cannot be negative"
            })
            return
          } else if (this.service_node.amount == 0) {
            this.$q.notify({
              type: "negative",
              timeout: 1000,
              message: "Amount must be greater than zero"
            })
            return
          } else if (this.service_node.amount > this.unlocked_balance / 1e4) {
            this.$q.notify({
              type: "negative",
              timeout: 1000,
              message: "Not enough unlocked balance"
            })
            return
          } else if (this.$v.service_node.amount.$error) {
            this.$q.notify({
              type: "negative",
              timeout: 1000,
              message: "Amount not valid"
            })
            return
          }

          let passwordDialog = await this.showPasswordConfirmation({
            title: "Stake",
            noPasswordMessage: "Do you want to stake?",
            ok: {
              label: "STAKE",
              color: "primary"
            },
            dark: this.theme == "dark",
            color: this.theme == "dark" ? "white" : "dark"
          })
          passwordDialog
            .onOk(password => {
              password = password || "";
              this.$store.commit("gateway/set_snode_status", {
                stake: {
                  code: 1,
                  message: "Staking...",
                  sending: true
                }
              })
              const service_node = objectAssignDeep.noMutate(this.service_node, { 
                password,
                destination: this.award_address
              })
                
              this.$gateway.send("wallet", "stake", service_node);
            })
            .onDismiss(() => {})
            .onCancel(() => {});
        }
    }
};
</script>

<style lang="scss">
.service-node-staking {
  .submit-button {
    .q-btn:not(:first-child) {
      margin-left: 8px;
    }
  }
}
</style>
