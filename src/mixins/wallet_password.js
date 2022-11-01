import { mapState } from "vuex"

export default {
    computed: mapState({
        theme: state => state.gateway.app.config.appearance.theme
    }),
    methods: {
        hasPassword () {
            // Validate the address
            return new Promise((resolve) => {
                this.$gateway.once("has_password", (data) => {
                    resolve(!!data)
                })
                this.$gateway.send("wallet", "has_password")
            })
        },

        async showPasswordConfirmation (options) {
            const { noPasswordMessage, ...other } = options
            return this.hasPassword().then(hasPassword => {
                const sharedOpts = {
                    cancel: {
                        flat: true,
                        label: "CANCEL",
                        color: "red"
                    },
                    ...other
                };
                const hasPasswordOpts = {
                    ...sharedOpts,
                    message: "Enter wallet password to continue",
                    prompt: {
                        model: "",
                        type: "password"
                    }
                };
                const noPasswordOpts = {
                    ...sharedOpts,
                    medsage: noPasswordMessage
                };
                let usedOpts = hasPassword ? hasPasswordOpts : noPasswordOpts;
                return this.$q.dialog(usedOpts);
            })
            .catch(() => {});
        }
    }
}
