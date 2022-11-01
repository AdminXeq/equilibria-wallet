<template>
  <div class="wallet-settings">
    <q-btn icon-right="more_vert" label="Settings" size="md" flat>
      <q-menu anchor="bottom right" self="top right">
        <q-list separator class="menu-list">
          <q-item v-close-popup clickable :disabled="!is_ready" @click.native="getPrivateKeys()">
            <q-item-label header>Show Private Keys</q-item-label>
          </q-item>
          <q-item v-close-popup clickable :disabled="!is_ready" @click.native="showModal('change_password')">
            <q-item-label header>Change Password</q-item-label>
          </q-item>
          <q-item v-close-popup clickable :disabled="!is_ready" @click.native="showModal('rescan')">
            <q-item-label header>Rescan Account</q-item-label>
          </q-item>
          <q-item v-close-popup clickable :disabled="!is_ready" @click.native="showModal('sweep_all')">
            <q-item-label header>Sweep All</q-item-label>
          </q-item>
          <q-item v-close-popup clickable :disabled="!is_ready" @click.native="showModal('key_image')">
            <q-item-label header>Manage Key Images</q-item-label>
          </q-item>
          <q-item v-close-popup clickable :disabled="!is_ready" @click.native="deleteWallet()">
            <q-item-label header>Delete Account</q-item-label>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <!-- Private_Key Modal -->
    <q-dialog v-model="modals.private_keys.visible" minimized class="private-key-modal" @hide="closePrivateKeys()">
      <div class="modal">
        <div class="modal-header">Show private keys</div>
        <div class="q-ma-lg">
          <template v-if="secret.mnemonic">
            <h6 class="q-mb-xs q-mt-lg">Seed words</h6>
            <div class="row">
              <div class="col">{{ secret.mnemonic }}</div>
              <div class="col-auto">
                <q-btn class="copy-btn" color="primary" padding="xs" size="sm" icon="file_copy" @click="copyPrivateKey('mnemonic', $event)">
                  <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">Copy seed words</q-tooltip>
                </q-btn>
              </div>
            </div>
          </template>

          <template v-if="secret.view_key != secret.spend_key">
            <h6 class="q-mb-xs">View key</h6>
            <div class="row">
              <div class="col" style="word-break:break-all;">
                {{ secret.view_key }}
              </div>
              <div class="col-auto">
                <q-btn class="copy-btn" color="primary" padding="xs" size="sm" icon="file_copy" @click="copyPrivateKey('view_key', $event)">
                  <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">Copy view key</q-tooltip>
                </q-btn>
              </div>
            </div>
          </template>

          <template v-if="!/^0*$/.test(secret.spend_key)">
            <h6 class="q-mb-xs">Spend key</h6>
            <div class="row">
              <div class="col" style="word-break:break-all;">
                {{ secret.spend_key }}
              </div>
              <div class="col-auto">
                <q-btn class="copy-btn" color="primary" padding="xs" size="sm" icon="file_copy" @click="copyPrivateKey('spend_key', $event)">
                  <q-tooltip anchor="center left" self="center right" :offset="[5, 10]">Copy spend key</q-tooltip>
                </q-btn>
              </div>
            </div>
          </template>

          <div class="q-mt-lg">
            <q-btn color="primary" label="Close" @click="hideModal('private_keys')" />
          </div>
        </div>
      </div>
    </q-dialog>

    <!-- Modal Rescanning -->
    <q-dialog v-model="modals.rescan.visible" minimized>
      <div class="modal">
        <div class="a-ma-lg modal-header">Rescan Account</div>
        <div class="q-ma-lg">
          <p>Select full rescan or rescan of spent outputs only.</p>

          <div class="q-mt-lg">
            <q-radio v-model="modals.rescan.type" val="full" label="Rescan full blockchain" />
          </div>
          <div class="q-mt-sm">
            <q-radio v-model="modals.rescan.type" val="spent" label="Rescan spent outputs" />
          </div>

          <div class="q-mt-xl text-right">
            <q-btn flat class="q-mr-sm" label="Close" @click="hideModal('rescan')" />
            <q-btn color="red" label="Rescan" @click="rescanWallet()" />
          </div>
        </div>
      </div>
    </q-dialog>

    <!-- Sweep All Modal -->
    <q-dialog v-model="modals.sweep_all.visible" minimized>
      <div class="modal">
        <div class="a-ma-lg modal-header">Sweep All</div>
        <div class="q-ma-lg">
          <p>Sweeps wallet to consolidate inputs.</p>
          <div class="q-mt-xl text-right">
            <q-btn flat class="q-mr-sm" label="Close" @click="hideModal('sweep_all')" />
            <q-btn color="primary" label="Sweep All" @click="sweepAll()" />
          </div>
        </div>
      </div>
    </q-dialog>

    <!-- Key Image Modal -->
    <q-dialog v-model="modals.key_image.visible" class="key-image-modal" minimized>
      <div class="modal key-image-modal">
        <div class="modal-header">
          {{ modals.key_image.type }} key images
        </div>
        <div class="q-ma-lg">
          <div class="row q-mb-md">
            <div class="q-mr-xl">
              <q-radio v-model="modals.key_image.type" val="Export" label="Export" />
            </div>
            <div>
              <q-radio v-model="modals.key_image.type" val="Import" label="Import" />
            </div>
          </div>

          <template v-if="modals.key_image.type == 'Export'">
            <tritonField class="q-mt-lg" label="Key image export directory" disable-hover>
              <q-input v-model="modals.key_image.export_path" disable borderless />
              <input id="keyImageExportPath" ref="keyImageExportSelect" class="image-path" type="file" webkitdirectory directory hidden @change="setKeyImageExportPath" />
              <q-btn color="secondary" @click="selectKeyImageExportPath">Browse</q-btn>
            </tritonField>
          </template>
          <template v-if="modals.key_image.type == 'Import'">
            <tritonField class="q-mt-lg" label="Key image import file" disable-hover>
              <q-input v-model="modals.key_image.import_path" disable borderless />
              <input id="keyImageImportPath" ref="keyImageImportSelect" type="file" class="image-path" hidden @change="setKeyImageImportPath" />
              <q-btn color="secondary" @click="selectKeyImageImportPath">Browse</q-btn>
            </tritonField>
          </template>

          <div class="q-mt-lg text-right">
            <q-btn flat class="q-mr-sm" label="Close" @click="hideModal('key_image')" />
            <q-btn color="primary" label="modals.key_image.type" @click="doKeyImages()" />
          </div>
        </div>
      </div>
    </q-dialog>

    <!-- Change Password Modal -->
    <q-dialog v-model="modals.change_password.visible" minimized @hide="clearChangePassword()">
      <div class="modal password-modal">
        <div class="modal-header">Change password</div>
        <div class="q-ma-lg">
          <q-input v-model="modals.change_password.old_password" type="password" label="Old Password" :dark="theme == 'dark'" />
          <q-input v-model="modals.change_password.new_password" type="password" label="New Password" :dark="theme == 'dark'" />
          <q-input v-model="modals.change_password.new_password_confirm" type="password" label="Confirm New Password" :dark="theme == 'dark'" />
          <div class="q-mt-xl text-right">
            <q-btn flat class="q-mr-sm" label="Close" @click="hideModal('change_password')" />
            <q-btn color="primary" label="Change" @click="doChangePassword()" />
          </div>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script>
const objectAssignDeep = require("object-assign-deep");
const { clipboard } = require("electron");
import { mapState } from "vuex";
import { required, decimal } from "vuelidate/lib/validators";
import WalletPassword from "src/mixins/wallet_password";
import tritonField from "components/triton_field";

export default {
  name: "WalletSettings",
  components: {
    tritonField
  },
  mixins: [WalletPassword],
  data() {
    return {
      modals: {
        private_keys: {
          visible: false
        },
        rescan: {
          visible: false,
          type: "full"
        },
        sweep_all: {
          visible: false
        },
        key_image: {
          visible: false,
          type: "Export",
          export_path: "",
          import_path: ""
        },
        change_password: {
          visible: false,
          old_password: "",
          new_password: "",
          new_password_confirm: ""
        }
      }
    };
  },
  computed: mapState({
    theme: state => state.gateway.app.config.appearance.theme,
    info: state => state.gateway.wallet.info,
    unlocked_balance: state => state.gateway.wallet.info.unlocked_balance,
    tx_status: state => state.gateway.tx_status,
    secret: state => state.gateway.wallet.secret,
    award_address: state => state.gateway.wallet.info.address,
    wallet_data_dir: state => state.gateway.app.config.app.wallet_data_dir,
    is_ready() {
      return this.$store.getters["gateway/isReady"]
    },
  }),
  watch: {
    secret: {
      handler(val, old) {
        if (val.view_key == old.view_key) return;
        switch (this.secret.view_key) {
          case "":
            break;
          case -1:
            this.$q.notify({
              type: "negative",
              timeout: 1000,
              message: this.secret.mnemonic
            });
            this.$store.commit("gateway/set_wallet_data", {
              secret: {
                mnemonic: "",
                spend_key: "",
                view_key: ""
              }
            });
            break;
          default:
            this.showModal("private_keys");
            break;
        }
      },
      deep: true
    },
    tx_status: {
      handler(val, old) {
      if (val.code == old.code) return;
        switch(this.tx_status.code) {
          case 0:
            this.$q.notify({
              type: "positive",
              timeout: 1000,
              message: this.tx_status.message
            });
            break;
          case -1:
            this.$q.notify({
              type: "negative",
              timeout: 3000,
              message: this.tx_status.message
            });
            break;
        }                
      },
      deep: true
    }
  },
  created() {
    const path = require("upath");
    this.modals.key_image.export_path = path.join(this.wallet_data_dir, "images", this.info.name);
    this.modals.key_image.import_path = path.join(this.wallet_data_dir, "images", this.info.name, "key_image_export");
  },
  methods: {
    showModal(which) {
      if (!this.is_ready) return
      this.modals[which].visible = true
    },
    hideModal(which) {
      this.modals[which].visible = false
    },
    copyPrivateKey(type, event) {
      event.stopPropagation()
      for (let i = 0; i < event.path.length; i++) {
        if (event.path[i].tagName == "BUTTON") {
          event.path[i].blur()
          break
        }
      }

      if (this.secret[type] == null) {
        this.$q.notify({
          type: "negative",
          timeout: 1000,
          message: "Error copying private key"
        })
        return
      }

      clipboard.writeText(this.secret[type])
      let type_human = type.substring(0, 1).toUpperCase()+type.substring(1).replace("_", " ")

      this.$q
        .dialog({
          title: "Copy "+type_human,
          message: "Be careful who you send your private keys to as they control your funds.",
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
            message: type_human+" copied to clipboard"
          })
        })
    },
    async getPrivateKeys () {
      if (!this.is_ready) return
      let passwordDialog = await this.showPasswordConfirmation({
        title: "Show private keys",
        noPasswordMessage: "Do you want to view your private keys?",
        ok: {
          label: "SHOW",
          color: "primary"
        },
        dark: this.theme == "dark",
        color: this.theme == "dark" ? "white" : "dark"
      });
      passwordDialog
        .onOk(password => {
          password = password || "";
          this.$gateway.send("wallet", "get_private_keys", { password });
        })
        .onDismiss(() => {})
        .onCancel(() => {});
    },
    closePrivateKeys() {
      this.hideModal("private_keys")
      setTimeout(() => {
        this.$store.commit("gateway/set_wallet_data", {
          secret: {
            mnemonic: "",
            spend_key: "",
            view_key: ""
          }
        });
      }, 500);
    },
    rescanWallet() {
      this.hideModal("rescan")
      if (this.modals.rescan.type == "full") {
        this.$q
          .dialog({
            title: "Rescan wallet",
            message: "Warning: Some information about previous transactions\nsuch as the recipient's address will be lost.",
            ok: {
              label: "RESCAN",
              color: "positive"
            },
            cancel: {
              flat: true,
              label: "CANCEL",
              color: this.theme == "dark" ? "white" : "dark"
            },
            dark: this.theme == "dark"
          })
          .onOk(password => {
            this.$gateway.send("wallet", "rescan_blockchain")
          })
          .onDismiss(() => {})
          .onCancel(() => {})
      } else {
        this.$gateway.send("wallet", "rescan_spent")
      }
    },
    async sweepAll() {
      this.hideModal("sweep_all")

      const { unlocked_balance } = this.info;

      const tx = {
        amount: unlocked_balance / 1e4,
        address: this.award_address,
        priority: 0
      };
      
      let passwordDialog = await this.showPasswordConfirmation({
        title: "Sweep All",
        message: "Sweeping will consolidate inputs.",
        ok: {
          label: "Sweep",
          color: "primary"
        },
        cancel: {
          flat: true,
          label: "CANCEL",
          color: this.theme == "dark" ? "white" : "dark"
        },
        dark: this.theme == "dark"
      })
      passwordDialog
        .onOk(password => {
          password = password || "";
          this.$store.commit("gateway/set_tx_status", {
            code: 1,
            message: "Sweeping All",
            sending: true
          });
          const newTx = objectAssignDeep.noMutate(tx, { password });
          this.$gateway.send("wallet", "transfer", newTx);
        })
        .onDismiss(() => {})
        .onCancel(() => {})
    },
    selectKeyImageExportPath () {
      this.$refs.keyImageExportSelect.click()
    },
    setKeyImageExportPath (file) {
      this.modals.key_image.export_path = file.target.files[0].path
    },
    selectKeyImageImportPath () {
      this.$refs.keyImageImportSelect.click()
    },
    setKeyImageImportPath (file) {
      this.modals.key_image.import_path = file.target.files[0].path
    },
    async doKeyImages () {
      this.hideModal("key_image")
      let passwordDialog = await this.showPasswordConfirmation({
        title: this.modals.key_image.type + " key images",
        noPasswordMessage: `Do you want to ${this.modals.key_image.type.toLowerCase()} key images?`,
        ok: {
          label: this.modals.key_image.type,
          color: "primary"
        },
        dark: this.theme == "dark",
        color: this.theme == "dark" ? "white" : "dark"
      });
      passwordDialog
        .onOk(password => {
          password = password || "";
          if (this.modals.key_image.type == "Export")
            this.$gateway.send("wallet", "export_key_images", {
              password: password,
              path: this.modals.key_image.export_path
            })
          else if (this.modals.key_image.type == "Import")
            this.$gateway.send("wallet", "import_key_images", {
              password: password,
              path: this.modals.key_image.import_path
            })
        })
        .onCancel(() => {})
        .onDismiss(() => {})
    },
    doChangePassword() {
      let old_password = this.modals.change_password.old_password
      let new_password = this.modals.change_password.new_password
      let new_password_confirm = this.modals.change_password.new_password_confirm

      if (new_password == old_password) {
        this.$q.notify({
          type: "negative",
          timeout: 1000,
          message: "New password must be different"
        })
      } else if (new_password != new_password_confirm) {
        this.$q.notify({
          type: "negative",
          timeout: 1000,
          message: "New passwords do not match"
        })
      } else {
        this.hideModal("change_password")
        this.$gateway.send("wallet", "change_wallet_password", { old_password, new_password })
      }
    },
    clearChangePassword () {
      this.modals.change_password.old_password = ""
      this.modals.change_password.new_password = ""
      this.modals.change_password.new_password_confirm = ""
    },
    deleteWallet () {
      if (!this.is_ready) return
      this.$q
        .dialog({
          title: "Delete wallet",
          message: "Are you absolutely sure you want to delete your wallet?\nMake sure you have your private keys backed up.\nTHIS PROCESS IS NOT REVERSIBLE!",
          ok: {
            label: "DELETE",
            color: "red"
          },
          cancel: {
            flat: true,
            label: "CANCEL",
            color: this.theme == "dark" ? "white" : "dark"
          },
          dark: this.theme == "dark"
        })
        .onOk(() => {
          return this.hasPassword()
        })
        .onOk(hasPassword => {
          if (!hasPassword) return ""
          return this.$q.dialog({
            title: "Delete wallet",
            message: "Enter wallet password to continue.",
            prompt: {
              model: "",
              type: "password"
            },
            ok: {
              label: "DELETE",
              color: "negative"
            },
            cancel: {
              flat: true,
              label: "CANCEL",
              color: this.theme == "dark" ? "white" : "dark"
            },
            dark: this.theme == "dark",
            color: "positive"
          })
        })
        .onOk(password => {
          this.$gateway.send("wallet", "delete_wallet", { password })
        })
        .onDismiss(() => {})
        .onCancel(() => {})
    }
  }
}
</script>

.menu-list { }

<style lang="scss">
.wallet-settings {
  .q-btn {
    color: white;
  }
}

.password-modal {
  min-width: 400px;
}

.image-path {
  opacity: 0;
  overflow: hidden;
}

.key-image-modal {
  label * {
    color: #cecece !important;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  input {
    overflow: ellipsis;
  }
}

.private-key-modal {
    .copy-btn {
        margin-left: 8px;
    }
}

.key-image-modal {
    min-width: 600px;
    width: 45vw;

    .triton-field {
        flex: 1,
    }
}
</style>
