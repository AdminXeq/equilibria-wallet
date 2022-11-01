<template>
  <q-page>
    <div class="row q-pt-sm q-mx-md q-mb-sm items-end non-selectable">

      <div class="col-5">Transactions</div>
      <tritonField class="col-5 q-px-sm" label="Filter by txid">
        <q-input v-model="tx_txid" :dark="theme == 'dark'" placeholder="Enter txid" borderless dense />
      </tritonField>

      <tritonField class="col-2" label="Filter by transaction type">
        <q-select :dark="theme == 'dark'" v-model="tx_type" :options="tx_type_options" borderless dense />
      </tritonField>

    </div>
    <TxList :type="tx_type" :txid="tx_txid" />
  </q-page>
</template>

<script>
import { mapState } from "vuex"
import TxList from "components/tx_list"
import tritonField from "components/triton_field"
export default {
    data () {
        return {
            tx_type: "all",
            tx_txid: "",
            tx_type_options: [
                { label: "All", value: "all" },
                { label: "Incoming", value: "in" },
                { label: "Outgoing", value: "out" },
                { label: "Pending", value: "all_pending" },
                { label: "Miner", value: "miner" },
                { label: "Service Node", value: "snode" },
                { label: "Stake", value: "stake" },
                { label: "Failed", value: "failed" }
            ]

        }
    },
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme,
        tx_list: state => state.gateway.wallet.transactions.tx_list
    }),

    components: {
        TxList,
        tritonField
    }

}
</script>

<style lang="scss">
</style>
